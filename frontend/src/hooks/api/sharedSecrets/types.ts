export type SharedSecret = {
  id: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  encryptedSecret: string
  userId: string
  jwk: {
    alg: string;
    ext: boolean;
    k: string;
    key_ops: string[];
    kty: string;
  };
}