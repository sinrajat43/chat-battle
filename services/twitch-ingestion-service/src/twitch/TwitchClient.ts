import * as tmi from '@tmi.js/chat';
import { EventEmitter } from 'events';
import { TwitchIRCMessage, ConnectionStatus, ChatMessage } from '../types';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { MessageParser } from './MessageParser';
import { getAccessToken } from '../auth/TwitchAuth';

/**
 * TwitchClient - Manages Twitch IRC connection and message handling
 */
export class TwitchClient extends EventEmitter {
  // Type the events this emitter can emit
  emit(event: 'message', message: ChatMessage): boolean;
  emit(event: 'connected' | 'disconnected' | 'rateLimited', ...args: unknown[]): boolean;
  emit(event: string, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }
  private client: tmi.Client | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = Infinity;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 60000; // Max 60 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  /**
   * Connect to Twitch IRC
   */
  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      logger.warn('Already connected or connecting');
      return;
    }

    // Validate required config for connecting to Twitch
    if (!config.twitch.channel) {
      throw new Error('TWITCH_CHANNEL environment variable is required to connect to Twitch');
    }
    // TWITCH_USERNAME is optional - only used to filter messages from self
    if (!config.twitch.username) {
      logger.warn('TWITCH_USERNAME not set - will not filter messages from self');
    }

    this.status = 'connecting';
    logger.info({ channel: config.twitch.channel }, 'Connecting to Twitch IRC');

    try {
      // Get access token (either from config or via token refresh)
      let accessToken: string | null = null;
      
      // Check if static token exists and is not a placeholder
      const staticToken = config.twitch.oauthToken?.replace(/^oauth:/, '');
      const isPlaceholder = staticToken && (
        staticToken.length < 20 || 
        staticToken.includes('your_token') || 
        staticToken.includes('placeholder') ||
        staticToken === 'your_token_here'
      );
      
      if (staticToken && !isPlaceholder) {
        // Use static token if provided and valid (backward compatibility)
        accessToken = staticToken;
      } else {
        if (isPlaceholder) {
          logger.warn('Placeholder token detected in .env - using tokenStore.json instead');
        }
        // Use dynamic token from token refresh system
        accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error(
            'Failed to get Twitch access token. Please run the authentication server via `npm run auth` and authorize at http://localhost:3000/auth'
          );
        }
      }

      // Validate token length (Twitch tokens are typically 30+ characters)
      if (!accessToken || accessToken.length < 20) {
        throw new Error(
          `Invalid access token: token is too short (${accessToken?.length || 0} chars). ` +
          'Please check your tokenStore.json or TWITCH_OAUTH_TOKEN in .env file.'
        );
      }

      // Create @tmi.js/chat client
      // Note: channels should be array of channel names (without # prefix)
      const channelName = config.twitch.channel.replace(/^#/, ''); // Remove # if present
      this.client = new tmi.Client({
        channels: [channelName],
        token: accessToken,
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Connect
      await this.client.connect();
      
      // Emit connected event after successful connection
      this.status = 'connected';
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      logger.info('Connected to Twitch IRC successfully');
      this.emit('connected');
    } catch (error) {
      this.status = 'disconnected';
      logger.error({ error }, 'Failed to connect to Twitch');
      this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * Set up @tmi.js/chat event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    // Handle chat messages - @tmi.js/chat uses different event structure
    // Complete event structure is documented in types/twitch-events.ts
    this.client.on('message', (event: any) => {
      // Ignore messages from self (only if TWITCH_USERNAME is set)
      if (config.twitch.username && event.user?.login === config.twitch.username) {
        return;
      }

      // Convert @tmi.js/chat event to our TwitchIRCMessage format
      // Available fields: event.channel._login, event.user.*, event.message.*, event.tags.*
      // See types/twitch-events.ts for complete structure
      const ircMessage: TwitchIRCMessage = {
        channel: event.channel?._login || '',
        username: event.user?.login || '',
        'user-id': event.user?.id || '',
        message: event.message?.text || '',
        emotes: event.message?.emotes || (Array.isArray(event.message?.emotes) ? {} : event.message?.emotes),
        'message-type': event.message?.isAction ? 'action' : 'chat',
        'room-id': event.channel?._id,
        time: event.tags?.tmiSentTs?.toString(),
        user: {
          login: event.user?.login || '',
          id: event.user?.id,
        },
      };

      // Parse message
      const chatMessage = MessageParser.parseMessage(ircMessage);
      if (chatMessage) {
        this.emit('message', chatMessage);
      }
    });

    // Note: @tmi.js/chat handles rate limiting internally
    // We can add custom handling if needed in the future
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    logger.info(
      { attempt: this.reconnectAttempts + 1, delayMs: delay },
      'Scheduling reconnection'
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch((error) => {
        logger.error({ error }, 'Reconnection failed');
      });
    }, delay);
  }

  /**
   * Disconnect from Twitch IRC
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.client) {
      try {
        // @tmi.js/chat doesn't have explicit disconnect, but we can clear the reference
        // The client will disconnect automatically when process exits
        logger.info('Disconnecting from Twitch IRC');
        this.client = null;
      } catch (error) {
        logger.error({ error }, 'Error during disconnect');
      }
    }

    this.status = 'disconnected';
    this.emit('disconnected', 'manual');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }
}

