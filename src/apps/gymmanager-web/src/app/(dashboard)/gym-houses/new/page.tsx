import { redirect } from "next/navigation";
export default function NewGymHousePage() {
  redirect("/gym-houses?create=true");
}
