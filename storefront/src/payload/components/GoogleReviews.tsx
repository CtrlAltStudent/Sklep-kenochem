import type { AdminViewServerProps } from "payload";
import { AdminPage } from "./AdminPage";
import { GoogleReviewsBoard } from "./GoogleReviewsBoard";

export function GoogleReviews(props: AdminViewServerProps) {
  return (
    <AdminPage {...props}>
      <GoogleReviewsBoard />
    </AdminPage>
  );
}
