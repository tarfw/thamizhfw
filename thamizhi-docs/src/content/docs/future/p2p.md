---
title: P2P Decentralized Distribution
description: Detailed architecture for peer-to-peer content distribution, offline-first news sharing, and mesh networking in Thamizhi.
---

## P2P Network Architecture

Thamizhi's P2P layer enables direct device-to-device communication without central servers, forming a distributed content distribution network for news articles.

### Node Types

- **Publisher Nodes**: Citizen journalists and source scrapers that produce and sign news content
- **Relay Nodes**: Mobile/desktop peers that store and forward content to neighboring peers
- **Bridge Nodes**: Optional cloud gateways that connect the P2P mesh to traditional web users
- **Archive Nodes**: High-availability peers that maintain full content history

## Content Distribution Protocol

Each news article is wrapped in a signed content envelope:

```
{
  "article_id": "sha256(content_hash)",
  "content": { ... },
  "publisher_sig": "<ed25519_signature>",
  "timestamp": <unix_epoch_ms>,
  "ttl": <seconds>,
  "reputation_score": <float>
}
```

Peers validate signatures and reputation before accepting and re-broadcasting content.

## Discovery & Routing

- **DHT-based peer discovery** using Kademlia-style distributed hash tables
- **Gossip protocol** for content announcements — new articles propagate through epidemic broadcast
- **Bloom filters** for efficient content deduplication across the mesh
- **Locality-aware routing** prioritizes nearby peers for low-latency news delivery

## Offline-First & Mesh Networking

```
Mobile App (Publisher) ──P2P──> Mobile App (Relay)
        │                            │
        │ (WiFi Direct / Bluetooth)  │ (LAN / local mesh)
        ▼                            ▼
   Nearby Peers ─────────────────> Cloud Bridge (optional)
```

- **WiFi Direct / Bluetooth LE** for local mesh in events, protests, or areas with no internet
- **Store-and-forward**: content persists on each peer until TTL expires
- **Opportunistic sync**: when devices come within range, they exchange missed articles automatically
- **Conflict resolution**: last-write-wins per publisher, with version vectors for concurrent edits

## Reputation Routing

Peers maintain a local trust score for every publisher and relay:

| Factor | Weight | Description |
|--------|--------|-------------|
| Content validity | 0.4 | Historical accuracy of published articles (cross-referenced) |
| Uptime | 0.2 | How consistently the peer relays content |
| Distance | 0.15 | Network hops from publisher |
| Peer endorsements | 0.15 | Signed vouches from other trusted peers |
| Age | 0.1 | How long the peer has been in the network |

Content from low-reputation peers is deprioritized or discarded.

## Timeline

- **Phase 1** (Current): Centralized on Cloudflare Workers
- **Phase 2** (Future): Hybrid — P2P sync between mobile apps + cloud bridge
- **Phase 3** (Future): Full P2P — content completely distributed, cloud optional

## Security Model

- **Content signing**: ECDSA (Ed25519) signatures on every article
- **Sybil resistance**: reputation-weighted content acceptance; new peers must earn trust
- **E2E encryption** for private/direct messages between journalists and editors
- **Proof-of-publication**: timestamped content hashes anchored to a public ledger (optional blockchain backing)
