export type SharedSecret = {
  id: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  encrypedSecret: string
  userId: string
  jwt: Record<string, string>
}