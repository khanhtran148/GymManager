import { redirect } from "next/navigation";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/bookings?view=${id}`);
}
