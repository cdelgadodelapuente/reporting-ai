import Link from "next/link";
import { oauthAction, signupAction } from "../login/actions";
import EmailSignupForm from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="min-h-screen landing-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md card">
        <div className="space-y-2 text-center">
          <div className="text-xs text-gray-500">Start 14-day trial</div>
          <h1 className="text-2xl font-bold text-gray-900">Start your 14-day trial</h1>
          <div className="text-sm text-gray-600 space-y-1">
            <div>✓ 14 days Pro access, then Free plan</div>
            <div>✓ No credit card required</div>
            <div>✓ 2 minute setup</div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <form action={oauthAction}>
            <input type="hidden" name="provider" value="google" />
            <button className="btn-secondary w-full">
              Continue with Google →
            </button>
          </form>

          <EmailSignupForm />

          {sp?.error && <p className="text-sm text-red-600">{sp.error}</p>}

          <p className="text-xs text-gray-500 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>

          <Link
            href="/login"
            className="block text-center text-sm text-gray-700 hover:underline"
          >
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
