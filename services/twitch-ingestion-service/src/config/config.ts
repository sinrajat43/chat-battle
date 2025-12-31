import dotenv from 'dotenv';
import { ServiceConfig } from '../types';

// Load environment variables
dotenv.config();

/**
 * Validate and load configuration from environment variables
 */
function loadConfig(): ServiceConfig {
  // Twitch configuration
  const twitchChannel = process.env.TWITCH_CHANNEL;
  const twitchUsername = process.env.TWITCH_USERNAME;
  const twitchOauthToken = process.env.TWITCH_OAUTH_TOKEN; // Optional if using token refresh
  const twitchClientId = process.env.TWITCH_CLIENT_ID;
  const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;
  const twitchRedirectUri = process.env.TWITCH_REDIRECT_URI || 'http://localhost:3000/auth/callback';
  const twitchScopes = process.env.TWITCH_SCOPES || 'chat:read';
  const twitchAuthPort = parseInt(process.env.TWITCH_AUTH_PORT || '3000', 10);

  // Channel and username are only required when running the ingestion service
  // They're not needed for the OAuth auth server (npm run auth)
  // We'll validate them lazily when actually needed
  if (!twitchChannel) {
    console.warn('TWITCH_CHANNEL not set - required for running the ingestion service');
  }
  if (!twitchUsername) {
    console.warn('TWITCH_USERNAME not set - required for running the ingestion service');
  }

  // OAuth token is optional if using automatic token refresh
  // If using static token, Client ID/Secret are not required
  // If using auto-refresh, Client ID/Secret are required
  if (!twitchOauthToken) {
    // Using automatic token refresh - need Client ID and Secret
    if (!twitchClientId || !twitchClientSecret) {
      throw new Error(
        'Either TWITCH_OAUTH_TOKEN (for static token) or both TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET (for auto-refresh) are required'
      );
    }
  } else {
    // Using static token - validate format
    if (!twitchOauthToken.startsWith('oauth:')) {
      throw new Error(
        'TWITCH_OAUTH_TOKEN must start with "oauth:" prefix. Example: oauth:your_token_here'
      );
    }
    // Client ID/Secret are optional when using static token, but recommended for future token refresh
    if (!twitchClientId || !twitchClientSecret) {
      // Use console.warn to avoid circular dependency with logger
      console.warn(
        'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET not provided. Automatic token refresh will not be available.'
      );
    }
  }

  // Kafka configuration
  const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
  const kafkaTopic = process.env.KAFKA_TOPIC_CHAT_MESSAGES || 'twitch-chat-messages';
  const kafkaClientId =
    process.env.KAFKA_CLIENT_ID || 'twitch-ingestion-service';

  // Logging configuration
  const logLevel = process.env.LOG_LEVEL || 'info';

  return {
    twitch: {
      channel: twitchChannel || '', // Optional - only needed when running ingestion service
      username: twitchUsername || '', // Optional - only needed when running ingestion service
      oauthToken: twitchOauthToken, // Optional - can use getAccessToken() instead
      clientId: twitchClientId || '', // Required for auto-refresh, empty string if using static token
      clientSecret: twitchClientSecret || '', // Required for auto-refresh, empty string if using static token
      redirectUri: twitchRedirectUri,
      scopes: twitchScopes,
      authPort: twitchAuthPort,
    },
    kafka: {
      brokers: kafkaBrokers.split(',').map((b) => b.trim()),
      topic: kafkaTopic,
      clientId: kafkaClientId,
    },
    logging: {
      level: logLevel,
    },
  };
}

// Export singleton config instance
export const config = loadConfig();

