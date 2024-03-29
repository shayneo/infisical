import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

import { Button, Select, SelectItem } from "@app/components/v2";
import { apiRequest } from "@app/config/request";
import { OrgPermissionActions, OrgPermissionSubjects } from "@app/context";
import { withPermission } from "@app/hoc";
import { SharedSecret } from "@app/hooks/api/sharedSecrets/types";
import { arrayBufferToBase64, bytesToBase64 } from "@app/lib/crypto";
import { SecretLinksTable } from "@app/views/SecretSharing/components";

const SecretSharing = withPermission(
  () => {
    // const router = useRouter();
    const [iv, setIv] = useState(crypto.getRandomValues(new Uint8Array(12)));
    const [secretInput, setSecretInput] = useState("");
    const [key, setKey] = useState<CryptoKey | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [keyString, setKeyString] = useState("");
    const [encrypted, setEncrypted] = useState("");
    const [decrypted, setDecrypted] = useState("");
    const [shareLink, setShareLink] = useState("");
    const [expiresDuration, setExpiresDuration] = useState("5");

    const durationOptions = ["5", "15", "30", "60"];

    async function generateKey() {
      const k = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 128
        },
        true, // whether the key is extractable
        ["encrypt", "decrypt"] // can be used to encrypt and decrypt
      );
      setKey(k);
      const jwk = await crypto.subtle.exportKey("jwk", k);
      setKeyString(JSON.stringify(jwk));
    }

    // generate the inital key
    useEffect(() => {
      generateKey();
    }, []);

    useEffect(() => {
      const encrypt = async () => {
        if (!key) {
          return;
        }
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(secretInput);

        const encryptedData = await crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv
          },
          key,
          encodedData
        );

        const b64Str = arrayBufferToBase64(encryptedData);
        setEncrypted(b64Str);

        // decrypt back for troubleshooting
        const decryptedData = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv
          },
          key,
          encryptedData
        );
        setDecrypted(atob(arrayBufferToBase64(decryptedData)));
      };

      encrypt();
    }, [secretInput]);

    const onChangeHandler = (text: string) => {
      setSecretInput(text);
    };

    const createSecret = async () => {
      const durMins = parseInt(expiresDuration, 10);
      const reqBody = {
        sharedSecret: {
          expiresAt: new Date(Date.now() + 1000 * 60 * durMins),
          encryptedSecret: encrypted,
          jwk: JSON.parse(keyString)
        }
      };
      try {
        const { data } = await apiRequest.post<{ sharedSecret: SharedSecret }>(
          "/api/v1/shared-secrets",
          reqBody
        );
        const link = `/shared-secrets/${data.sharedSecret.id}#${bytesToBase64(iv)}`;
        setShareLink(link);

        // now reset the key and iv
        setIv(crypto.getRandomValues(new Uint8Array(12)));
        generateKey();
      } catch (error) {
        console.error(error);
      }
    };

    return (
      <div>
        <Head>
          <title>Secret Sharing</title>
          <link rel="icon" href="/infisical.ico" />
          <meta property="og:image" content="/images/message.png" />
        </Head>
        <div className="flex h-full w-full justify-center bg-bunker-800 text-white">
          <div className="w-full max-w-7xl px-6">
            <div className="relative">
              <div className="mt-6 text-3xl font-semibold text-gray-200">Secret Sharing</div>
              <div className="mb-6 text-lg text-mineshaft-300">
                Share secrets through short lived, secure URLs.
              </div>
              <Button
                variant="solid"
                colorSchema="primary"
                className="absolute right-0 top-6 h-min py-2"
                onClick={() => setShowDebug(!showDebug)}
              >
                👀
              </Button>
            </div>
            <div className="relative mb-6  rounded-md border border-mineshaft-600 bg-mineshaft-800 p-6">
              <div className="flex justify-between">
                <div className="flex items-end gap-x-4">
                  <label htmlFor="secret" className="">
                    <div className="mb-1 ml-1">Secret</div>
                    <input
                      id="secret"
                      value={secretInput}
                      onChange={(e) => onChangeHandler(e.target.value)}
                      className="rounded py-2 px-4"
                    />
                  </label>
                  <label htmlFor="expires">
                    <div className="mb-1 ml-1">Expire After</div>
                    <Select
                      value={expiresDuration}
                      onValueChange={(value) => {
                        setExpiresDuration(value);
                      }}
                      className="bg-transparent pl-0 text-sm font-medium text-primary/80 hover:text-primary"
                      dropdownContainerClassName="text-bunker-200 bg-mineshaft-800 border border-mineshaft-600 drop-shadow-2xl"
                    >
                      {durationOptions?.map((dur) => (
                        <SelectItem value={dur} key={dur}>
                          {dur} Minutes
                        </SelectItem>
                      ))}
                    </Select>
                  </label>
                  <Button
                    variant="solid"
                    colorSchema="primary"
                    className="h-min py-2"
                    onClick={createSecret}
                  >
                    Share
                  </Button>
                </div>
              </div>

              {shareLink && (
                <div className="mt-4 w-full border-t border-mineshaft-400 pt-4">
                  <Link href={shareLink} passHref>
                    {window.location.host + shareLink}
                  </Link>
                </div>
              )}

              {showDebug && (
                <div className="mt-4 w-full border-t border-mineshaft-400 pt-4">
                  <div>IV: {iv}</div>
                  <div>Encrypted Input: {encrypted}</div>
                  <div>Decrypted: {decrypted}</div>
                  <div>key: {keyString}</div>
                </div>
              )}
            </div>
            <SecretLinksTable />
          </div>
        </div>
      </div>
    );
  },
  { action: OrgPermissionActions.Read, subject: OrgPermissionSubjects.SecretScanning }
);

Object.assign(SecretSharing, { requireAuth: true });

export default SecretSharing;
