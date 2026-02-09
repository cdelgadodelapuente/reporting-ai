import Link from "next/link";
import { loginAction, oauthAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="min-h-screen landing-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md card">
        <div className="space-y-1">
          <div className="text-xs text-zinc-500">Welcome back</div>
          <h1 className="text-xl font-semibold text-zinc-900">Login</h1>
          <p className="text-sm text-zinc-600">Access your reporting dashboard.</p>
        </div>

        <div className="mt-6 space-y-3">
          <form action={oauthAction} className="grid gap-2">
            <input type="hidden" name="provider" value="google" />
            <button className="btn-secondary w-full">
              Continue with Google
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-zinc-500">or</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <form action={loginAction} className="space-y-3">
            <input
              name="email"
              className="input w-full"
              placeholder="Email"
              autoComplete="email"
              required
            />
            <input
              name="password"
              className="input w-full"
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              required
            />

          {sp?.error && <p className="text-sm text-red-600">{sp.error}</p>}

          <button className="btn-primary w-full">
            Login
          </button>

          <Link
            href="/signup"
            className="block text-center text-sm text-zinc-700 hover:underline"
          >
            No account? Sign up
          </Link>
          <Link
            href="/reset"
            className="block text-center text-sm text-zinc-600 hover:underline"
          >
            Forgot your password?
          </Link>
          <Link
            href="/reports?demo=1"
            className="block text-center text-sm text-zinc-600 hover:underline"
          >
            Try demo without connecting Jira
          </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
