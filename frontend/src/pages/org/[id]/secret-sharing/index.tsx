import { useState } from "react";
import Head from "next/head";

import { Button } from "@app/components/v2";
import { apiRequest } from "@app/config/request";
import { OrgPermissionActions, OrgPermissionSubjects } from "@app/context";
import { withPermission } from "@app/hoc";
import { SharedSecret } from "@app/hooks/api/sharedSecrets/types";
import { SecretLinksTable } from "@app/views/SecretSharing/components";

const SecretSharing = withPermission(
  () => {
    // const router = useRouter();
    const [iv] = useState(crypto.getRandomValues(new Uint8Array(12)));
    const [secretInput, setSecretInput] = useState("");
    const [key, setKey] = useState<CryptoKey | null>(null);
    const [keyString, setKeyString] = useState("");
    const [encrypted, setEncrypted] = useState("");
    const [decrypted, setDecrypted] = useState("");
    const [shareLink, setShareLink] = useState("");

    const bytesToBase64 = (bytes: Uint8Array) => {
      let binary = "";
      const len = bytes.byteLength;
      for (let i = 0; i < len; i += 1) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
      let binary = "";
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i += 1) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };
    const base64ToArrayBuffer = (base64: string) => {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    };
    const decryptString = async () => {
      if (!key) {
        return;
      }
      const buff = base64ToArrayBuffer(encrypted);
      try {
        const data = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv
          },
          key,
          buff
        );
        setDecrypted(atob(arrayBufferToBase64(data)));
      } catch (error) {
        console.log({ error });
      }
    };

    async function encryptString() {
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
      decryptString();
    }

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
    const onChangeHandler = (text: string) => {
      setSecretInput(text);
      if (!key) {
        generateKey();
      }
      encryptString();
    };

    const createSecret = async () => {
      const reqBody = {
        sharedSecret: {
          expiresAt: new Date(Date.now() + 1000 * 60 * 5),
          encryptedSecret: encrypted,
          jwk: JSON.parse(keyString)
        }
      };
      const { data } = await apiRequest.post<{ sharedSecret: SharedSecret }>(
        "/api/v1/shared-secrets",
        reqBody
      );
      const link = `/shared-secrets/${data.sharedSecret.id}#${bytesToBase64(iv)}`;
      setShareLink(link);
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
            <div className="mt-6 text-3xl font-semibold text-gray-200">Secret Sharing</div>
            <div className="mb-6 text-lg text-mineshaft-300">
              Share secrets through short lived, secure URLs.
            </div>
            <div className="relative mb-6 flex justify-between rounded-md border border-mineshaft-600 bg-mineshaft-800 p-6">
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
                <Button
                  variant="solid"
                  colorSchema="primary"
                  className="h-min py-2"
                  onClick={createSecret}
                >
                  Share
                </Button>
              </div>
              <div>
                <div>IV: {iv}</div>
                <div>Encrypted Input: {encrypted}</div>
                <div>Decrypted: {decrypted}</div>
                <div>Share Link: {shareLink}</div>
              </div>
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
