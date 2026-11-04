import type { AdminViewServerProps } from "payload";
import { AdminPage } from "./AdminPage";
import { MissingBoard } from "./MissingBoard";

export function MissingPages(props: AdminViewServerProps) {
  return (
    <AdminPage {...props}>
      <MissingBoard />
    </AdminPage>
  );
}
