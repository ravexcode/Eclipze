import AuthPage from "@/components/pages/auth";
import { getGoogleOAuthErrorMessage } from "@/utils/google-oauth";

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthPage
      type="in"
      initialError={getGoogleOAuthErrorMessage(params.error)} />
  );
}
