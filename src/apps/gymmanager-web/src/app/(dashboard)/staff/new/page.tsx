import { redirect } from "next/navigation";
export default function NewStaffPage() {
  redirect("/staff?create=true");
}
