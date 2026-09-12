import { ResetPasswordPage } from "@/components/pages/recovery";
export default async function Page({ searchParams }: { searchParams: Promise<{ email?: string }> }) { const params = await searchParams; return <ResetPasswordPage initialEmail={params.email ?? ""} />; }
