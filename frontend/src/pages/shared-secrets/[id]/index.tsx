import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { Button } from "@app/components/v2";
import { apiRequest } from "@app/config/request";
import { SharedSecret } from "@app/hooks/api/sharedSecrets/types";
import { arrayBufferToBase64, base64ToArrayBuffer } from "@app/lib/crypto";

export default function SharedSecretById() {
  const router = useRouter();
  const { id } = router.query;
  const [secret, setSecret] = useState<SharedSecret | null>(null);
  const [clearText, setClearText] = useState("");
  const [failed, setFailed] = useState(false);
  const [reveal, setReveal] = useState(false);

  const hash = router.asPath.split("#")[1] || "";

  useEffect(() => {
    const getSecret = async () => {
      try {
        const { data } = await apiRequest.get<{ sharedSecret: SharedSecret }>(
          `/api/v1/shared-secrets/${id}`
        );
        if (data.sharedSecret) {
          setSecret(data.sharedSecret);
        }
      } catch (error) {
        setFailed(true);
      }
    };
    getSecret();
  }, []);

  useEffect(() => {
    const decode = async () => {
      if (!secret) {
        return;
      }
      try {
        const key = await crypto.subtle.importKey(
          "jwk",
          secret.jwk,
          {
            name: "AES-GCM"
          },
          true,
          ["encrypt", "decrypt"]
        );

        const buff = base64ToArrayBuffer(secret.encryptedSecret);

        const data = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: base64ToArrayBuffer(hash)
          },
          key,
          buff
        );

        const b64Clear = arrayBufferToBase64(data);

        setClearText(atob(b64Clear));
      } catch (error) {
        setFailed(true);
      }
    };

    decode();
  }, [secret]);

  return (
    <div className="flex flex-col justify-between bg-bunker-700 md:h-screen">
      <Head>
        <title>Shared Secret</title>
        <link rel="icon" href="/infisical.ico" />
      </Head>
      <div className="flex w-screen flex-col items-center justify-center pt-48 text-bunker-200">
        {clearText && (
          <div>
            <div className="text-3xl font-semibold text-gray-200">Someone shared a secret</div>
            <p className="mb-6 text-lg text-mineshaft-300">Make sure you keep it safe</p>
            <div className="mt-24">
              <div className="h-12 items-center rounded bg-mineshaft-600 text-center text-3xl">
                <p className={reveal ? "" : "pt-1.5"}>{reveal ? clearText : "************"}</p>
              </div>
              <Button
                variant="solid"
                colorSchema="primary"
                className="mt-4 h-min w-full"
                onClick={() => setReveal(!reveal)}
              >
                {reveal ? "Hide" : "Show"} Secret
              </Button>
            </div>
          </div>
        )}
        {failed && <div>sorry, this secret is long gone... or maybe it never existed.</div>}
        {!hash && <div>sorry, your secret url is invalid!</div>}
      </div>
    </div>
  );
}
