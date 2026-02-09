import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="landing-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-16">
        <header className="flex items-center justify-between">
          <Link href="/">
            <img src="/relay-logo.png" alt="Relay" className="h-12 w-auto" />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-zinc-700 hover:text-black">
              Home
            </Link>
            <Link href="/login" className="text-zinc-700 hover:text-black">
              Login
            </Link>
            <Link
              href="/signup"
              className="h-10 inline-flex items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Start 14-day trial →
            </Link>
          </nav>
        </header>

        <section className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900">
            Simple, transparent pricing
          </h1>
          <p className="text-sm text-zinc-600">
            Start with 14 days of Pro. No credit card required. Downgrade to Free anytime.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="card space-y-3">
            <div className="text-sm font-semibold text-zinc-900">FREE</div>
            <div className="text-3xl font-semibold text-zinc-900">€0/month forever</div>
            <div className="text-sm text-zinc-600">Perfect for light usage</div>
            <div className="text-sm text-zinc-700">✓ 3 reports per month</div>
            <div className="text-sm text-zinc-700">✓ Jira integration</div>
            <div className="text-sm text-zinc-700">✓ 3 audience templates</div>
            <div className="text-sm text-zinc-700">✓ Copy to clipboard</div>
            <div className="text-sm text-zinc-700">✓ 7 days history</div>
            <div className="text-sm text-zinc-500">✗ Can't edit reports</div>
            <div className="text-sm text-zinc-500">✗ No share links</div>
            <div className="text-sm text-zinc-500">✗ Limited history</div>
            <Link href="/signup" className="btn-secondary w-full inline-flex items-center justify-center">
              Start free →
            </Link>
          </div>

          <div className="card bg-black text-white border border-black space-y-3">
            <div className="text-sm font-semibold">PRO ⭐ Most popular</div>
            <div className="text-3xl font-semibold">€29/month</div>
            <div className="text-sm text-zinc-300">€290/year (save 17%)</div>
            <div className="text-sm text-zinc-200">Everything you need</div>
            <div className="text-sm text-zinc-300">✓ Unlimited reports</div>
            <div className="text-sm text-zinc-300">✓ Edit before sending</div>
            <div className="text-sm text-zinc-300">✓ Share public links</div>
            <div className="text-sm text-zinc-300">✓ Unlimited history</div>
            <div className="text-sm text-zinc-300">✓ Priority support</div>
            <div className="text-sm text-zinc-300">
              💰 Save 3h/week = ~€600/month vs €29/month = 20x ROI
            </div>
            <Link href="/signup" className="btn-secondary w-full inline-flex items-center justify-center bg-white text-black">
              Start 14-day trial →
            </Link>
            <div className="text-xs text-zinc-300">Then €29/month. No credit card required.</div>
          </div>

          <div className="card space-y-3">
            <div className="text-sm font-semibold text-zinc-900">TEAM</div>
            <div className="text-3xl font-semibold text-zinc-900">Coming Q2 2026</div>
            <div className="text-sm text-zinc-600">For growing teams</div>
            <div className="text-sm text-zinc-700">- Shared templates</div>
            <div className="text-sm text-zinc-700">- Team analytics</div>
            <div className="text-sm text-zinc-700">- Slack integration</div>
            <div className="text-sm text-zinc-700">- Admin controls</div>
            <button className="h-10 w-full rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-900 hover:bg-zinc-50">
              Notify me when ready →
            </button>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-900">Common questions</h2>
          <div className="space-y-2 text-sm text-zinc-700">
            <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <summary className="cursor-pointer font-medium">How does the free trial work?</summary>
              <div className="mt-2">
                Start with 14 days of Pro, completely free. No credit card required. After 14 days,
                you&apos;ll automatically move to the Free plan (3 reports/month) unless you choose to upgrade.
              </div>
            </details>
            <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <summary className="cursor-pointer font-medium">Can I cancel anytime?</summary>
              <div className="mt-2">
                Yes. Cancel with one click from your account settings. If you cancel mid-month, you keep access until the end of your billing period.
              </div>
            </details>
            <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <summary className="cursor-pointer font-medium">Do you offer refunds?</summary>
              <div className="mt-2">
                Yes. If you&apos;re not happy in the first 30 days, email us and we&apos;ll refund you. No complicated process.
              </div>
            </details>
            <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <summary className="cursor-pointer font-medium">What payment methods do you accept?</summary>
              <div className="mt-2">
                Credit card, debit card, and PayPal via Stripe. All payments are secure and encrypted.
              </div>
            </details>
            <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <summary className="cursor-pointer font-medium">Is my Jira data safe?</summary>
              <div className="mt-2">
                Yes. We only read data (never write). We don&apos;t store your Jira credentials. Your data is encrypted in transit and at rest. We&apos;re GDPR compliant.
              </div>
            </details>
            <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <summary className="cursor-pointer font-medium">Can I export reports?</summary>
              <div className="mt-2">
                Yes. Reports can be copied to clipboard, exported as Markdown, or shared via public link. PDF/PPT export coming soon.
              </div>
            </details>
          </div>
        </section>

        <section className="card text-center space-y-3">
          <h2 className="text-2xl font-semibold text-zinc-900">
            Ready to get your time back?
          </h2>
          <div className="text-sm text-zinc-600">
            Start with 14 days free. No credit card required.
          </div>
          <div>
            <Link href="/signup" className="btn-primary inline-flex items-center justify-center">
              Start 14-day trial →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
