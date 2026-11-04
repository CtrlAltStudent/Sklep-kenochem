import type { AdminViewServerProps } from "payload";
import { AdminPage } from "./AdminPage";
import { PromoBoard } from "./PromoBoard";

export function Promotions(props: AdminViewServerProps) {
  return (
    <AdminPage {...props}>
      <PromoBoard />
    </AdminPage>
  );
}
