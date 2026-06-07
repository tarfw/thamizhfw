export type ContentAddress = string;

export type SyncProtocol = {
  /** Connect to a P2P network */
  connect(peer: string): Promise<void>;
  /** Publish content to the network */
  publish(content: Uint8Array): Promise<ContentAddress>;
  /** Retrieve content by address */
  retrieve(address: ContentAddress): Promise<Uint8Array | null>;
  /** Subscribe to content updates */
  subscribe(topic: string, handler: (address: ContentAddress) => void): () => void;
};

export type LocalSyncEngine = {
  /** Sync local state with remote peers */
  sync(): Promise<void>;
  /** Get last sync timestamp */
  lastSync(): number;
};

export const P2P_STATUS = {
  DISABLED: 'disabled',
  PLANNED: 'planned',
  IN_DEVELOPMENT: 'in_development',
  READY: 'ready',
} as const;

export type P2PStatus = (typeof P2P_STATUS)[keyof typeof P2P_STATUS];

export const currentP2PStatus: P2PStatus = P2P_STATUS.PLANNED;

export interface ContentAddressing {
  hash(content: Uint8Array): Promise<ContentAddress>;
  verify(address: ContentAddress, content: Uint8Array): Promise<boolean>;
}

export class StubContentAddressing implements ContentAddressing {
  async hash(content: Uint8Array): Promise<ContentAddress> {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = (hash * 31 + content[i]) >>> 0;
    }
    return `stub:${hash.toString(16)}`;
  }
  async verify(address: ContentAddress, content: Uint8Array): Promise<boolean> {
    const computed = await this.hash(content);
    return computed === address;
  }
}