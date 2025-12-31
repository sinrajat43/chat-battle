import { ChatMessage, TwitchIRCMessage } from '../types';
import { logger } from '../utils/logger';

/**
 * MessageParser - Parses Twitch IRC messages into ChatMessage format
 */
export class MessageParser {
  /**
   * Parse a Twitch IRC message into ChatMessage format
   */
  static parseMessage(ircMessage: TwitchIRCMessage): ChatMessage | null {
    try {
      // Extract channel_id - handle both string and object formats
      let channelId = '';
      if (typeof ircMessage.channel === 'string') {
        channelId = ircMessage.channel.replace(/^#/, '');
      } else if (ircMessage.channel && typeof ircMessage.channel === 'object') {
        channelId = ircMessage.channel.login || '';
      }
      
      if (!channelId) {
        logger.warn({ ircMessage }, 'Message missing channel');
        return null;
      }

      // Extract user information - handle both old and new formats
      const userId = ircMessage['user-id'] || ircMessage.user?.id || '';
      const username = ircMessage.username || ircMessage.user?.login || '';

      if (!username) {
        logger.warn({ ircMessage }, 'Message missing username');
        return null;
      }

      // Extract message text - handle both string and object formats
      const message = typeof ircMessage.message === 'string' 
        ? ircMessage.message 
        : ircMessage.message?.text || '';

      // Extract emotes
      const emotes: string[] = [];
      if (ircMessage.emotes) {
        // Emotes format: { "emoteid": ["start-end", "start-end"] }
        // We'll extract emote IDs from the message
        // For now, we'll store emote IDs (can be enhanced to map to names)
        Object.keys(ircMessage.emotes).forEach((emoteId) => {
          // In a real implementation, you might want to map emote IDs to names
          // For Phase 1, we'll just track that emotes were present
          emotes.push(emoteId);
        });
      }

      // Generate timestamp (Unix milliseconds)
      const timestamp = Date.now();

      const chatMessage: ChatMessage = {
        channel_id: channelId,
        user_id: userId,
        username: username,
        message: message,
        timestamp: timestamp,
        emotes: emotes,
      };

      return chatMessage;
    } catch (error) {
      logger.error({ error, ircMessage }, 'Failed to parse message');
      return null;
    }
  }

  /**
   * Validate a ChatMessage
   */
  static validateMessage(message: ChatMessage): boolean {
    return (
      !!message.channel_id &&
      !!message.username &&
      !!message.message &&
      typeof message.timestamp === 'number' &&
      Array.isArray(message.emotes)
    );
  }
}

