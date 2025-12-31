/**
 * ChatMessage - Message format for Kafka topic
 */
export interface ChatMessage {
  channel_id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: number; // Unix timestamp in milliseconds
  emotes: string[];
}

/**
 * TwitchIRCMessage - Raw message from @tmi.js/chat
 * Compatible with both old tmi.js and new @tmi.js/chat formats
 */
export interface TwitchIRCMessage {
  channel: string | { login: string };
  username?: string;
  'user-id'?: string;
  message: string | { text: string };
  emotes?: { [emoteid: string]: string[] };
  'message-type'?: string;
  'room-id'?: string;
  time?: string;
  user?: { login: string; id?: string };
}

/**
 * ServiceConfig - Configuration structure
 */
export interface ServiceConfig {
  twitch: {
    channel: string; // Optional - only needed when running ingestion service
    username: string; // Optional - only needed when running ingestion service
    oauthToken?: string; // Optional - can use getAccessToken() instead
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string;
    authPort?: number;
  };
  kafka: {
    brokers: string[];
    topic: string;
    clientId: string;
  };
  logging: {
    level: string;
  };
}

/**
 * ConnectionStatus - Service connection status
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

