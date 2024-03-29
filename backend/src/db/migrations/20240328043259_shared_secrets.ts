import { Knex } from "knex";

import { TableName } from "../schemas";
import { createOnUpdateTrigger, dropOnUpdateTrigger } from "../utils";

export async function up(knex: Knex): Promise<void> {
  const isSharedSecretsPresent = await knex.schema.hasTable(TableName.SharedSecrets);
  if (!isSharedSecretsPresent) {
    await knex.schema.createTable(TableName.SharedSecrets, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.jsonb("jwk").notNullable();
      t.string("encryptedSecret");
      t.timestamp("expiresAt").defaultTo(knex.raw("CURRENT_TIMESTAMP + INTERVAL '15 MINUTE'"));
      t.uuid("userId").notNullable();
      t.foreign("userId").references("id").inTable(TableName.Users).onDelete("CASCADE");
      t.timestamps(true, true, true);
    });
  }

  await createOnUpdateTrigger(knex, TableName.SharedSecrets);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TableName.OrgMembership);
  await knex.schema.dropTableIfExists(TableName.OrgRoles);
  await dropOnUpdateTrigger(knex, TableName.OrgMembership);
}
