import type { AdminViewServerProps } from "payload";
import { AdminPage } from "./AdminPage";
import { LiveBoard } from "./LiveBoard";

export function Live(props: AdminViewServerProps) {
  if (!props.initPageResult.req.user) {
    return (
      <AdminPage {...props}>
        <p className="kc-empty">Zaloguj się, aby zobaczyć, kto jest w sklepie.</p>
      </AdminPage>
    );
  }
  return (
    <AdminPage {...props}>
      <LiveBoard />
    </AdminPage>
  );
}
