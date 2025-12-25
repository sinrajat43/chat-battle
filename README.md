# Twitch Chat Battle

A real-time analytics platform that compares and visualizes chat activity across multiple Twitch channels, providing live leaderboards, emote trends, and engagement metrics.

## Core Features

### User Input

- Enter 1–4 Twitch channel names
- Choose a time frame (e.g., last 10 min, last 1 hr)

### Data Collection

- Kafka ingests live chat messages from the selected channels
- Each message includes: `channel_id`, `user_id`, `message`, `timestamp`, `emotes`

### Real-Time Processing

Calculate per-channel analytics in real-time:

- Top emotes
- Total chat count
- Top chatter (most messages)
- Most liked/repeated messages (optional)
- Sliding window support: rolling stats for the chosen timeframe

### Storage (Cassandra)

- **Raw chats table**: Store messages for historical queries and long-term analysis
- **Aggregated stats table**: Per channel, per time window: top emotes, chat counts, top user
- TTL for raw messages older than X days to avoid data bloat

### Dashboard / Web App

- Show live leaderboards per channel: e.g., "Channel A: 5000 messages, Top Emote: Kappa"
- Graphs for emote trends, chat spikes, user activity
- Compare channels side by side over the selected time frame

## Kafka & Cassandra Exploration

### Kafka

- Separate topics per channel or a single topic with `channel_id` key for partitioning
- Use consumer groups for different analytics tasks: sentiment, emotes, top user
- Test high-throughput scaling with multiple channels streaming simultaneously

### Cassandra

- Efficient modeling for time-window queries: e.g., `PRIMARY KEY ((channel_id), window_start, emote)`
- Batch writes for aggregated stats
- Explore TTL, materialized views, and read optimization for leaderboard queries

## Advanced Features / Extensions

- Sentiment analysis per channel → "Most positive/negative channel"
- Highlight viral messages or high engagement chat snippets
- Real-time notifications for emote sprees or chatter milestones
- Option to replay chat battles for previous timeframes (using stored data in Cassandra)
- Integrate ML for topic clustering of chat messages

## Why This is Great

- High-frequency, unpredictable Twitch chat → perfect Kafka stress test
- Complex queries and aggregation → deep Cassandra modeling
- Fun and engaging → you can even demo it publicly or share with friends
- You can scale gradually: start with 1 channel and extend to 4+ later
