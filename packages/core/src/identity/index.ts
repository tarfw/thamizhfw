export type DID = string;
export type VerifiableCredential = {
  '@context': string[];
  type: string[];
  issuer: DID;
  issuanceDate: string;
  credentialSubject: Record<string, unknown>;
  proof?: Record<string, unknown>;
};

export type JournalistCredential = {
  id: string;
  did: DID;
  name: string;
  beats: string[];
  publications: string[];
  verifiedBy: DID[];
  credentials: VerifiableCredential[];
  createdAt: number;
};

export type ResolvedDID = {
  did: DID;
  document: {
    id: DID;
    verificationMethod: Array<{ id: string; type: string; publicKeyJwk?: unknown }>;
    service?: Array<{ id: string; type: string; serviceEndpoint: string }>;
  };
};

export interface IdentityResolver {
  resolve(did: DID): Promise<ResolvedDID | null>;
  verifyCredential(vc: VerifiableCredential, issuerDID: DID): Promise<boolean>;
  createCredential(subject: Record<string, unknown>, type: string[]): Promise<VerifiableCredential>;
}

export class StubIdentityResolver implements IdentityResolver {
  async resolve(did: DID): Promise<ResolvedDID | null> {
    return {
      did,
      document: {
        id: did,
        verificationMethod: [],
      },
    };
  }

  async verifyCredential(vc: VerifiableCredential, issuerDID: DID): Promise<boolean> {
    return vc.issuer === issuerDID;
  }

  async createCredential(subject: Record<string, unknown>, type: string[]): Promise<VerifiableCredential> {
    return {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', ...type],
      issuer: 'did:example:stub',
      issuanceDate: new Date().toISOString(),
      credentialSubject: subject,
    };
  }
}