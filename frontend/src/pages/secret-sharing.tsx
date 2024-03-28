import { useEffect } from "react";
import { useRouter } from "next/router";

export default function SecretSharing() {
  const router = useRouter();

  useEffect(() => {
    router.push(
      `${router.asPath.split("secret-sharing")[0]}/org/${localStorage.getItem(
        "orgData.id"
      )}/secret-sharing${router.asPath.split("secret-sharing")[1]}`
    );
  }, []);

  return <div />;
}

SecretSharing.requireAuth = false;
