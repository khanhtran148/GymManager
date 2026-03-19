import { redirect } from "next/navigation";
export default function NewTransactionPage() {
  redirect("/finance/transactions?create=true");
}
