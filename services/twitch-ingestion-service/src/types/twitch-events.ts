/**
 * Twitch Event Types - Complete structure from @tmi.js/chat
 * 
 * This file documents all available fields from Twitch IRC events
 * for future reference and potential enhancements.
 */

/**
 * Complete structure of the 'message' event from @tmi.js/chat
 * Based on actual event structure received from Twitch
 */
export interface TwitchMessageEvent {
  /**
   * Channel information
   */
  channel: {
    lastUserstate: any | null;
    _id: string; // Channel ID (e.g., "100869214")
    _login: string; // Channel login name (e.g., "arky")
  };

  /**
   * User information
   */
  user: {
    id: string; // User ID (e.g., "245335256")
    display: string; // Display name (e.g., "Flex0n247")
    color: string; // User's chat color (e.g., "#FF0000")
    badges: Array<[string, string]>; // Badges array, e.g., [["arcane-season-2-premiere", "1"]]
    badgeInfo: any[]; // Badge info array
    isBroadcaster: boolean;
    isMod: boolean;
    isSubscriber: boolean;
    isFounder: boolean;
    isVip: boolean;
    type: string; // User type (empty string for normal users)
    login: string; // Username (lowercase, e.g., "flex0n247")
    isTurbo: boolean;
    isReturningChatter: boolean;
  };

  /**
   * Message content
   */
  message: {
    id: string; // Message ID (UUID, e.g., "fb12eb9c-0ae5-467b-a5ce-88eb8922826d")
    text: string; // Message text
    flags: any[]; // Message flags
    emotes: any[]; // Emotes in message
    isAction: boolean; // True if /me action message
    isFirst: boolean; // True if user's first message
  };

  /**
   * Shared chat information (for shared chat channels)
   */
  sharedChat?: {
    channel: {
      lastUserstate: any | null;
      _id: string;
      _login: string;
    };
    user: {
      badges: Array<[string, string]>;
      badgeInfo: any[];
    };
    message: {
      id: string;
    };
    sourceOnly: boolean;
  };

  /**
   * IRC tags (raw IRC message tags)
   */
  tags: {
    badgeInfo: any[];
    badges: Array<[string, string]>;
    clientNonce: string; // Client nonce (UUID)
    color: string; // User color
    displayName: string; // Display name
    emotes: any[];
    firstMsg: boolean;
    flags: any[];
    id: string; // Message ID
    mod: boolean;
    returningChatter: boolean;
    roomId: string; // Room/channel ID
    sourceBadgeInfo: any[];
    sourceBadges: Array<[string, string]>;
    sourceId: string;
    sourceOnly: boolean;
    sourceRoomId: string;
    subscriber: boolean;
    tmiSentTs: number; // Timestamp when message was sent (Unix milliseconds)
    turbo: boolean;
    userId: string; // User ID
    userType: string; // User type
  };
}

/**
 * Available badge types (common examples)
 * Badges can include:
 * - broadcaster, moderator, subscriber, founder, vip
 * - premium, bits, partner, staff, admin
 * - Custom badges (e.g., "arcane-season-2-premiere")
 */
export type BadgeType = 
  | 'broadcaster'
  | 'moderator'
  | 'subscriber'
  | 'founder'
  | 'vip'
  | 'premium'
  | 'bits'
  | 'partner'
  | 'staff'
  | 'admin'
  | string; // Custom badges

/**
 * Extended ChatMessage with all available fields
 * This can be used for future enhancements
 */
export interface ExtendedChatMessage {
  // Current fields
  channel_id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: number;
  emotes: string[];

  // Additional available fields (for future use)
  displayName?: string;
  color?: string;
  badges?: Array<[string, string]>;
  isMod?: boolean;
  isSubscriber?: boolean;
  isVip?: boolean;
  isBroadcaster?: boolean;
  isFounder?: boolean;
  isTurbo?: boolean;
  isReturningChatter?: boolean;
  isAction?: boolean;
  isFirst?: boolean;
  messageId?: string;
  roomId?: string;
  clientNonce?: string;
}


