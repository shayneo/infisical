import { BadRequestError } from "@app/lib/errors";

import { TSharedSecretDALFactory } from "./shared-secret-dal";

type TSharedSecretServiceFactoryDep = {
  sharedSecretDAL: TSharedSecretDALFactory;
};

export type TSharedSecretServiceFactory = ReturnType<typeof sharedSecretServiceFactory>;

export const sharedSecretServiceFactory = ({ sharedSecretDAL }: TSharedSecretServiceFactoryDep) => {
  const createSharedSecret = async ({
    userId,
    jwk,
    encryptedSecret,
    expiresAt
  }: {
    userId: string;
    jwk: Record<string, string>;
    encryptedSecret: string;
    expiresAt: Date;
  }) => {
    const newRecord = await sharedSecretDAL.create({
      userId,
      jwk,
      encryptedSecret,
      expiresAt
    });
    return newRecord;
  };

  const deleteSharedSecret = async (id: string) => {
    const secret = await sharedSecretDAL.getSharedSecretById(id);
    if (!secret) throw new BadRequestError({ message: "Secret doesn't exist" });

    const deletedTag = await sharedSecretDAL.deleteById(id);
    return deletedTag;
  };

  const getSharedSecretsByUserId = async (userId: string) => {
    const secrets = await sharedSecretDAL.getSharedSecretsByUserId(userId);
    return secrets;
  };

  const getById = async (id: string) => {
    const secret = await sharedSecretDAL.getSharedSecretById(id);
    if (!secret) throw new BadRequestError({ message: "Secret doesn't exist" });
    return secret;
  };

  return { createSharedSecret, deleteSharedSecret, getById, getSharedSecretsByUserId };
};
