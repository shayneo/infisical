export type SharedSecretPostPayload = {
  userId: string;
  jwk: {
    alg: string;
    ext: boolean;
    k: string;
    key_ops: string[];
    kty: string;
  };
  encryptedSecret: string;
  expiresAt: Date;
};
