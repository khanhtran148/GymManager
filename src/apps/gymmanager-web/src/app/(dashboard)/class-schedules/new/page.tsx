import { redirect } from "next/navigation";
export default function NewClassSchedulePage() {
  redirect("/class-schedules?create=true");
}
