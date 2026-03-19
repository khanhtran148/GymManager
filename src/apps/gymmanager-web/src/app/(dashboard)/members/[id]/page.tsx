import { redirect } from "next/navigation";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/members?view=${id}`);
}
