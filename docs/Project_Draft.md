# Twitch Chat Battle - Project Draft

## 1. Project Overview

**Project Name:** Twitch Chat Battle

**Description:** A real-time analytics platform that compares and visualizes chat activity across multiple Twitch channels, providing live leaderboards, emote trends, and engagement metrics.

**Primary Goals:**

- Explore and implement Kafka for high-throughput real-time data ingestion
- Design efficient Cassandra data models for time-window queries
- Build an engaging, interactive dashboard for comparing channel performance
- Demonstrate scalable architecture handling multiple concurrent streams

---

## 2. Core Features

### 2.1 User Input

- Enter 1–4 Twitch channel names
- Choose a time frame (e.g., last 10 min, last 1 hr, custom range)

### 2.2 Data Collection

- Kafka ingests live chat messages from selected channels
- Message schema includes:
  - `channel_id`
  - `user_id`
  - `message`
  - `timestamp`
  - `emotes`

### 2.3 Real-Time Processing

Calculate per-channel analytics in real-time:

- Top emotes
- Total chat count
- Top chatter (most messages)
- Most liked/repeated messages (optional)
- Sliding window support: rolling stats for the chosen timeframe

### 2.4 Dashboard / Web App

- Live leaderboards per channel (e.g., "Channel A: 5000 messages, Top Emote: Kappa")
- Graphs for:
  - Emote trends
  - Chat spikes
  - User activity
- Side-by-side channel comparison over selected time frame

---

## 3. Technical Architecture

### 3.1 Data Ingestion (Kafka)

**Topic Strategy:**

- Option A: Separate topics per channel
- Option B: Single topic with `channel_id` key for partitioning

**Consumer Groups:**

- Different consumer groups for different analytics tasks:
  - Sentiment analysis
  - Emote extraction
  - Top user tracking

**Scaling Considerations:**

- Test high-throughput scaling with multiple channels streaming simultaneously
- Monitor partition distribution and consumer lag

### 3.2 Storage (Cassandra)

**Data Model:**

**Raw Chats Table:**

- Purpose: Store messages for historical queries and long-term analysis
- Schema considerations:
  - Primary key: `(channel_id, timestamp, message_id)`
  - TTL: X days to avoid data bloat

**Aggregated Stats Table:**

- Purpose: Per channel, per time window analytics
- Schema considerations:
  - Primary key: `((channel_id), window_start, emote)` or similar
  - Columns: top emotes, chat counts, top user
  - Batch writes for aggregated stats

**Optimization Strategies:**

- TTL for raw messages older than X days
- Materialized views for leaderboard queries
- Read optimization for time-window queries

---

## 4. Advanced Features / Extensions

### Phase 2+ Features:

- **Sentiment Analysis:** Per-channel sentiment → "Most positive/negative channel"
- **Viral Content Detection:** Highlight viral messages or high engagement chat snippets
- **Real-time Notifications:** Alerts for emote sprees or chatter milestones
- **Chat Replay:** Option to replay chat battles for previous timeframes (using stored data in Cassandra)
- **ML Integration:** Topic clustering of chat messages using machine learning

---

## 5. Project Benefits & Learning Outcomes

### Why This Project is Valuable:

1. **Kafka Exploration:**

   - High-frequency, unpredictable Twitch chat → perfect Kafka stress test
   - Real-world streaming data patterns
   - Consumer group management and partitioning strategies

2. **Cassandra Deep Dive:**

   - Complex queries and aggregation → deep Cassandra modeling
   - Time-series data optimization
   - TTL and data lifecycle management

3. **Practical & Engaging:**

   - Fun and engaging → can demo publicly or share with friends
   - Real-world use case with actual user engagement

4. **Scalable Approach:**
   - Start with 1 channel and extend to 4+ later
   - Gradual complexity increase
   - Iterative development path

---

## 6. Implementation Phases

### Phase 1: MVP (Minimum Viable Product)

- [ ] Single channel support
- [ ] Basic Kafka ingestion
- [ ] Simple Cassandra storage
- [ ] Basic dashboard with live chat count

### Phase 2: Core Features

- [ ] Multi-channel support (2-4 channels)
- [ ] Real-time analytics (top emotes, top user)
- [ ] Time window selection
- [ ] Enhanced dashboard with graphs

### Phase 3: Advanced Features

- [ ] Sentiment analysis
- [ ] Viral message detection
- [ ] Chat replay functionality
- [ ] ML topic clustering

---

## 7. Notes & Considerations

### Technical Decisions to Make:

- Kafka topic partitioning strategy
- Cassandra data modeling approach
- Real-time processing framework (Kafka Streams, Flink, etc.)
- Frontend technology stack
- Deployment architecture

### Open Questions:

- [ ] Which Twitch API/library to use for chat ingestion?
- [ ] How to handle rate limiting?
- [ ] What's the optimal time window granularity?
- [ ] How to handle channel disconnections/reconnections?

---

## 8. Resources & References

_Add links, documentation, and helpful resources here as you discover them_
