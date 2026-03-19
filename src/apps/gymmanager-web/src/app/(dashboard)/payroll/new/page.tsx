import { redirect } from "next/navigation";
export default function NewPayrollPage() {
  redirect("/payroll?create=true");
}
