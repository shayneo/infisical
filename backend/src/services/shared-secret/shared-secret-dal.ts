import { Knex } from "knex";

import { TDbClient } from "@app/db";
import { TableName } from "@app/db/schemas";
import { DatabaseError } from "@app/lib/errors";
import { ormify } from "@app/lib/knex";

export type TSharedSecretDALFactory = ReturnType<typeof sharedSecretDALFactory>;

export const sharedSecretDALFactory = (db: TDbClient) => {
  const sharedSecretTagOrm = ormify(db, TableName.SharedSecrets);

  const getSharedSecretsByUserId = async (userId: string, tx?: Knex) => {
    try {
      const sharedSecrets = await (tx || db)(TableName.SharedSecrets)
        .where({ userId })
        .where("expiresAt", ">", new Date());
      return sharedSecrets;
    } catch (error) {
      throw new DatabaseError({ error, name: "Find all by userId" });
    }
  };

  const getSharedSecretById = async (id: string, tx?: Knex) => {
    const sharedSecret = await (tx || db)(TableName.SharedSecrets)
      .where({ id })
      .where("expiresAt", ">", new Date())
      .first();
    return sharedSecret;
  };

  return {
    ...sharedSecretTagOrm,
    getSharedSecretsByUserId,
    getSharedSecretById
  };
};
