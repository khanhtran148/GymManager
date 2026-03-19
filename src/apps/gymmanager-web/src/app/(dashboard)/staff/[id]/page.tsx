import { redirect } from "next/navigation";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/staff?view=${id}`);
}
