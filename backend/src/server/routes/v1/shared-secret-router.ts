import { z } from "zod";

import { SharedSecretsSchema } from "@app/db/schemas";
import { logger } from "@app/lib/logger";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";

export const registerSharedSecretRouter = async (server: FastifyZodProvider) => {
  server.route({
    url: "/",
    method: "GET",
    schema: {
      response: {
        200: z.object({
          sharedSecrets: SharedSecretsSchema.array()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const userId = req.permission.id;
      logger.info("userId", userId);
      const sharedSecrets = await server.services.sharedSecret.getSharedSecretsByUserId(userId);
      return { sharedSecrets };
    }
  });

  server.route({
    url: "/:sharedSecretId",
    method: "GET",
    schema: {
      params: z.object({ sharedSecretId: z.string().trim() }),
      response: {
        200: z.object({
          sharedSecret: SharedSecretsSchema
        })
      }
    },
    handler: async (req) => {
      const { sharedSecretId } = req.params;
      const sharedSecret = await server.services.sharedSecret.getById(sharedSecretId);
      return { sharedSecret };
    }
  });

  server.route({
    url: "/",
    method: "POST",
    schema: {
      body: z.object({
        sharedSecret: z.object({
          jwk: z.object({
            alg: z.string(),
            ext: z.boolean(),
            k: z.string(),
            key_ops: z.array(z.string()),
            kty: z.string()
          }),
          encryptedSecret: z.string(),
          expiresAt: z.string()
        })
      }),
      response: {
        200: z.object({
          sharedSecret: SharedSecretsSchema
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const userId = req.permission.id;
      const { jwk, encryptedSecret, expiresAt } = req.body.sharedSecret;
      const d = new Date(expiresAt);

      const sharedSecret = await server.services.sharedSecret.createSharedSecret({
        userId,
        jwk,
        expiresAt: d,
        encryptedSecret
      });
      return { sharedSecret };
    }
  });
};
