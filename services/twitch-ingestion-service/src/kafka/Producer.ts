import { Kafka, Producer, ProducerConfig } from 'kafkajs';
import { EventEmitter } from 'events';
import { ChatMessage } from '../types';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { MessageSerializer } from './MessageSerializer';

/**
 * KafkaProducer - Manages Kafka producer connection and message publishing
 */
export class KafkaProducer extends EventEmitter {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private isConnected = false;

  constructor() {
    super();

    // Initialize Kafka client
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        retries: 5,
        initialRetryTime: 100,
        multiplier: 2,
        maxRetryTime: 30000,
      },
    });
  }

  /**
   * Connect producer to Kafka
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn('Producer already connected');
      return;
    }

    try {
      // Create producer with configuration
      const producerConfig: ProducerConfig = {
        allowAutoTopicCreation: false, // Topics should be created beforehand
        idempotent: true, // Enable idempotent producer
        maxInFlightRequests: 1, // Required for idempotent producer
        retry: {
          retries: 5,
          initialRetryTime: 100,
          multiplier: 2,
          maxRetryTime: 30000,
        },
      };

      this.producer = this.kafka.producer(producerConfig);

      // Set up event handlers
      this.producer.on('producer.connect', () => {
        logger.info('Kafka producer connected');
        this.isConnected = true;
        this.emit('connected');
      });

      this.producer.on('producer.disconnect', () => {
        logger.warn('Kafka producer disconnected');
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.producer.on('producer.network.request_timeout', (payload) => {
        logger.warn({ payload }, 'Kafka producer network timeout');
      });

      // Connect
      await this.producer.connect();
      logger.info('Kafka producer ready');
    } catch (error) {
      logger.error({ error }, 'Failed to connect Kafka producer');
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Send message to Kafka topic
   */
  async sendMessage(message: ChatMessage): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error('Producer not connected');
    }

    // Validate message
    if (!MessageSerializer.validate(message)) {
      throw new Error('Invalid message format');
    }

    try {
      // Serialize message
      const value = MessageSerializer.serialize(message);

      // Send to Kafka
      // Use channel_id as key for partitioning
      // acks: -1 (all) is set at the producer level via idempotent mode
      await this.producer.send({
        topic: config.kafka.topic,
        acks: -1, // Wait for all replicas
        messages: [
          {
            key: message.channel_id,
            value: value,
            timestamp: message.timestamp.toString(),
          },
        ],
      });
    } catch (error) {
      logger.error(
        { error, message },
        'Failed to send message to Kafka'
      );
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect producer
   */
  async disconnect(): Promise<void> {
    if (this.producer) {
      try {
        await this.producer.disconnect();
        logger.info('Kafka producer disconnected');
      } catch (error) {
        logger.error({ error }, 'Error during producer disconnect');
      }
      this.producer = null;
    }
    this.isConnected = false;
  }

  /**
   * Check if producer is connected
   */
  isProducerConnected(): boolean {
    return this.isConnected;
  }
}

