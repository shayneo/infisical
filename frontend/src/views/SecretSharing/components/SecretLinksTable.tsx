import { Table, TableContainer, TBody, Td, Th, THead, Tr } from "@app/components/v2";
import { useGetSharedSecrets } from "@app/hooks/api/sharedSecrets";

export const SecretLinksTable = () => {
  const { data } = useGetSharedSecrets();

  return (
    <TableContainer className="mt-8">
      <Table>
        <THead>
          <Tr>
            <Th className="flex-1">ID</Th>
            <Th className="flex-1">Created At</Th>
            <Th className="flex-1">Expires At</Th>
            <Th className="w-5" />
          </Tr>
        </THead>
        <TBody>
          {data &&
            data?.map((secret) => {
              return (
                <Tr key={secret.id} className="h-10">
                  <Td>{secret.id}</Td>
                  <Td>{secret.createdAt}</Td>
                  <Td>{secret.expiresAt}</Td>
                </Tr>
              );
            })}
        </TBody>
      </Table>
    </TableContainer>
  );
};
