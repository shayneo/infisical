import { BadRequestError } from "@app/lib/errors";

import { TSharedSecretDALFactory } from "./shared-secret-dal";
import { SharedSecretPostPayload } from "./shared-secret-types";

type TSharedSecretServiceFactoryDep = {
  sharedSecretDAL: TSharedSecretDALFactory;
};

export type TSharedSecretServiceFactory = ReturnType<typeof sharedSecretServiceFactory>;

export const sharedSecretServiceFactory = ({ sharedSecretDAL }: TSharedSecretServiceFactoryDep) => {
  const createSharedSecret = async ({ userId, jwk, encryptedSecret, expiresAt }: SharedSecretPostPayload) => {
    const thresh = 1000 * 60 * 90; // 90 min
    const max = Date.now() + thresh;
    if (expiresAt.getTime() > max) {
      throw new BadRequestError({
        message: "expiresAt is too far in the future, shared secrets should be short lived"
      });
    }

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
