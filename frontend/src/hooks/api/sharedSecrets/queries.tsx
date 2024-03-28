import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

import { SharedSecret } from "./types";

const fetchSharedSecrets = async () => {
  const { data } = await apiRequest.get<{ sharedSecrets: SharedSecret[] }>(
    "/api/v1/shared-secrets"
  );

  return data.sharedSecrets;
};

export const useGetSharedSecrets = () => {
  return useQuery({
    queryFn: () => fetchSharedSecrets(),
    enabled: true
  });
};
