import { redirect } from "next/navigation";

export default async function GymHouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/gym-houses?view=${id}`);
}
