import { redirect } from "next/navigation";
export default function NewBookingPage() {
  redirect("/bookings?create=true");
}
