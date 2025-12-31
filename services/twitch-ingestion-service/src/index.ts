import { config } from './config/config';
import { logger } from './utils/logger';
import { TwitchClient } from './twitch/TwitchClient';
import { KafkaProducer } from './kafka/Producer';
import { ChatMessage } from './types';

/**
 * Main service entry point
 */
class IngestionService {
  private twitchClient: TwitchClient;
  private kafkaProducer: KafkaProducer;
  private shutdownInProgress = false;

  constructor() {
    this.twitchClient = new TwitchClient();
    this.kafkaProducer = new KafkaProducer();
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    logger.info('Starting Twitch Ingestion Service...');
    logger.info({ config: { channel: config.twitch.channel } }, 'Configuration loaded');

    try {
      // Connect Kafka producer first
      logger.info('Connecting to Kafka...');
      await this.kafkaProducer.connect();

      // Set up Twitch client event handlers
      this.setupTwitchHandlers();

      // Connect to Twitch
      logger.info('Connecting to Twitch IRC...');
      await this.twitchClient.connect();

      logger.info('Service started successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to start service');
      await this.shutdown();
      process.exit(1);
    }
  }

  /**
   * Set up Twitch client event handlers
   */
  private setupTwitchHandlers(): void {
    // Handle incoming messages
    this.twitchClient.on('message', async (message: ChatMessage) => {
      try {
        await this.kafkaProducer.sendMessage(message);
        logger.debug(
          { channelId: message.channel_id, username: message.username },
          'Message sent to Kafka'
        );
      } catch (error) {
        logger.error(
          { error, channelId: message.channel_id, username: message.username },
          'Failed to send message to Kafka'
        );
        // Don't crash on individual message failures
      }
    });

    // Handle connection events
    this.twitchClient.on('connected', () => {
      logger.info('Twitch connection established');
    });

    this.twitchClient.on('disconnected', (reason) => {
      logger.warn({ reason }, 'Twitch connection lost');
    });

    this.twitchClient.on('error', (error) => {
      logger.error({ error }, 'Twitch client error');
    });

    this.twitchClient.on('rateLimited', () => {
      logger.warn('Rate limited by Twitch - messages may be delayed');
    });

    // Handle Kafka producer events
    this.kafkaProducer.on('connected', () => {
      logger.info('Kafka producer connected');
    });

    this.kafkaProducer.on('disconnected', () => {
      logger.warn('Kafka producer disconnected');
    });

    this.kafkaProducer.on('error', (error) => {
      logger.error({ error }, 'Kafka producer error');
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.shutdownInProgress) {
      return;
    }

    this.shutdownInProgress = true;
    logger.info('Shutting down service...');

    try {
      // Disconnect Twitch client
      if (this.twitchClient) {
        await this.twitchClient.disconnect();
      }

      // Disconnect Kafka producer
      if (this.kafkaProducer) {
        await this.kafkaProducer.disconnect();
      }

      logger.info('Service shut down successfully');
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
    }
  }
}

// Create and start service
const service = new IngestionService();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await service.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await service.shutdown();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  service.shutdown().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  service.shutdown().then(() => process.exit(1));
});

// Start the service
service.start().catch((error) => {
  logger.fatal({ error }, 'Failed to start service');
  process.exit(1);
});

