import { ChatMessage } from '../types';
import { logger } from '../utils/logger';

/**
 * MessageSerializer - Serializes ChatMessage to JSON for Kafka
 */
export class MessageSerializer {
  /**
   * Serialize ChatMessage to JSON string
   */
  static serialize(message: ChatMessage): string {
    try {
      const json = JSON.stringify(message);
      return json;
    } catch (error) {
      logger.error({ error, message }, 'Failed to serialize message');
      throw new Error('Message serialization failed');
    }
  }

  /**
   * Validate message before serialization
   */
  static validate(message: ChatMessage): boolean {
    return (
      !!message.channel_id &&
      !!message.username &&
      !!message.message &&
      typeof message.timestamp === 'number' &&
      Array.isArray(message.emotes)
    );
  }
}


