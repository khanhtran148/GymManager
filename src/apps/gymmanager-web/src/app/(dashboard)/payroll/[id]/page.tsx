import { redirect } from "next/navigation";

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/payroll?view=${id}`);
}
