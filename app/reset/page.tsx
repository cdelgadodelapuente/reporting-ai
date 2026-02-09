import Link from "next/link";
import { resetPasswordAction } from "../login/actions";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="min-h-screen landing-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md card">
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Password reset</div>
          <h1 className="text-xl font-semibold text-zinc-900">Reset your password</h1>
          <p className="text-sm text-zinc-600">
            We’ll email you a secure link to set a new password.
          </p>
        </div>

        <form action={resetPasswordAction} className="mt-6 space-y-3">
          <input
            name="email"
            className="input w-full"
            placeholder="Email"
            autoComplete="email"
            required
          />

          {sp?.error && <p className="text-sm text-red-600">{sp.error}</p>}
          {sp?.success && (
            <p className="text-sm text-emerald-600">
              Check your email for the reset link.
            </p>
          )}

          <button className="btn-primary w-full">
            Send reset link
          </button>

          <Link
            href="/login"
            className="block text-center text-sm text-zinc-700 hover:underline"
          >
            Back to login
          </Link>
        </form>
      </div>
    </div>
  );
}
