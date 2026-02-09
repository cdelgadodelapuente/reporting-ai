import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <main className="landing-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-20">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/relay-logo.png" alt="Relay" className="h-12 w-auto" />
            </Link>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="#features" className="text-zinc-700 hover:text-black">
              Features
            </Link>
            <Link href="/pricing" className="text-zinc-700 hover:text-black">
              Pricing
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="h-10 inline-flex items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-zinc-700 hover:text-black">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary inline-flex items-center justify-center"
                >
                  Start 14-day trial →
                </Link>
              </>
            )}
          </nav>
        </header>

        <section className="card bg-gradient-to-b from-gray-50 to-white">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl lg:text-[48px]">
                  Your weekly status report, written in 90 seconds
                </h1>
                <p className="text-lg text-gray-600 sm:text-xl">
                  Stop spending 3 hours every Friday writing the same update.
                  Let AI do it for you.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link href="/signup" className="btn-primary inline-flex items-center justify-center">
                    Start 14-day trial →
                  </Link>
                  <Link href="#demo" className="btn-secondary inline-flex items-center justify-center">
                    See example report
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span>✓ No credit card required</span>
                  <span>✓ Full Pro access for 14 days</span>
                  <span>✓ Then €0/month (Free plan)</span>
                </div>
              </div>

              <div className="card">
                <div className="text-xs text-gray-500">Generated Report</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  Sprint 42 — Executive Summary
                </div>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <p className="font-medium text-gray-900">
                    This week we shipped the new payment flow and resolved
                    critical bugs. We’re 92% through Q1 roadmap with 2 weeks
                    remaining.
                  </p>
                  <div>
                    <div className="font-semibold text-gray-900">Key Wins</div>
                    <ul className="mt-1 space-y-1">
                      <li>• Checkout flow live — 40% faster, +15% conversions</li>
                      <li>• Fixed 3 critical bugs affecting 2,000 users</li>
                      <li>• Mobile performance up 40% (3s → 1.2s)</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Next Week</div>
                    <ul className="mt-1 space-y-1">
                      <li>• Launch analytics dashboard to beta users</li>
                      <li>• Complete email notifications and UAT</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-500">
                  Generated in 18s
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-900">You know this pain...</h2>
          <div className="space-y-2 text-sm text-zinc-700">
            <div>Every week:</div>
            <div>😫 2 hours writing exec summary for your CEO</div>
            <div>😫 1 hour writing technical update for your team</div>
            <div>😫 1 hour writing client update for stakeholders</div>
          </div>
          <div className="text-sm text-zinc-700">Same work. Different formats. Tedious as hell.</div>
          <div className="text-sm text-zinc-700">
            Meanwhile, your Jira has all the data already. You&apos;re just... reformatting it.
            Again.
          </div>
        </section>

        <section id="features" className="card space-y-6">
          <h2 className="text-2xl font-semibold text-zinc-900">
            From Jira to report in 3 clicks
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 text-sm text-zinc-700">
            <div className="space-y-1">
              <div className="font-semibold text-zinc-900">1️⃣ Connect Jira</div>
              <div>One-time setup</div>
              <div>Takes 60 seconds</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-zinc-900">2️⃣ Choose audience</div>
              <div>Executive, Technical, or Client</div>
              <div>AI adapts the tone</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-zinc-900">3️⃣ Send</div>
              <div>Copy, edit, or share</div>
              <div>Your report is ready</div>
            </div>
          </div>
          <div className="text-sm text-zinc-700">
            That&apos;s it. No training. No complexity.
          </div>
          <div className="text-sm text-zinc-700">
            From "ugh, I need to write that report" to done in 90 seconds.
          </div>
        </section>

        <section className="card space-y-6">
          <h2 className="text-2xl font-semibold text-zinc-900">Before / After</h2>
          <div className="grid gap-6 sm:grid-cols-2 text-sm text-zinc-700">
            <div className="space-y-2">
              <div className="font-semibold text-zinc-900">❌ The old way</div>
              <div>1. Open Jira</div>
              <div>2. Review 30+ tickets</div>
              <div>3. Open Google Doc</div>
              <div>4. Write from scratch</div>
              <div>5. Format manually</div>
              <div>6. Adjust tone for audience</div>
              <div>7. Repeat for each stakeholder</div>
              <div className="mt-2">⏱️ 3 hours</div>
              <div>😫 Tedious</div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-zinc-900">✅ With Relay</div>
              <div>1. Connect Jira (one-time)</div>
              <div>2. Select sprint</div>
              <div>3. Choose audience</div>
              <div>4. AI generates report</div>
              <div>5. Copy & send</div>
              <div className="mt-2">⏱️ 90 seconds</div>
              <div>😌 Effortless</div>
            </div>
          </div>
        </section>

        <section id="demo" className="card space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900">See what you get</h2>
            <p className="text-sm text-zinc-600">Same sprint, 3 different audiences:</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">For your CEO</span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">For your team</span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">For clients</span>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 whitespace-pre-wrap">
            {`## Sprint 42 Update

This week we shipped the new payment flow and resolved critical security issues. We're 92% through Q1 roadmap with 2 weeks remaining.

## Key Wins
- Payment flow live - Checkout 40% faster, 15% more conversions
- Fixed 3 critical bugs affecting 2,000 users
- Mobile performance up 40% (3s → 1.2s load time)

## In Progress
- Analytics dashboard (70% done, ships March 10)
- Email notifications (60% done, March 15)

## Risk
- GDPR legal review delayed - could push EU launch to March 22

## Next Week
- Launch analytics to 100 beta users
- Complete email system`}
          </div>
          <div className="text-sm text-zinc-700">
            Notice: Same data, perfect tone for each audience. No more rewriting the same update 3 times.
          </div>
        </section>

        <section className="card space-y-6">
          <h2 className="text-2xl font-semibold text-zinc-900">Start with 14 days of Pro. Upgrade when ready.</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card">
              <div className="text-sm font-semibold text-zinc-900">FREE</div>
              <div className="text-2xl font-semibold text-zinc-900">€0/month</div>
              <div className="text-sm text-zinc-600">✓ 3 reports per month</div>
              <div className="text-sm text-zinc-600">✓ Perfect for trying it out</div>
              <div className="text-sm text-zinc-600">✓ All core features</div>
              <Link href="/signup" className="btn-secondary inline-flex w-full items-center justify-center">
                Start free →
              </Link>
            </div>
            <div className="card bg-black text-white border border-black">
              <div className="text-sm font-semibold">PRO ⭐</div>
              <div className="text-2xl font-semibold">€29/month</div>
              <div className="text-sm text-zinc-300">✓ Unlimited reports</div>
              <div className="text-sm text-zinc-300">✓ Report history</div>
              <div className="text-sm text-zinc-300">✓ Priority support</div>
              <Link href="/signup" className="btn-secondary inline-flex w-full items-center justify-center bg-white text-black">
                Start 14-day trial →
              </Link>
              <div className="text-xs text-zinc-300">No credit card required</div>
            </div>
          </div>
          <div className="text-sm text-zinc-700">
            💰 ROI: Save 3h/week = ~€600/month vs €29 cost
          </div>
        </section>

        <section className="card text-center space-y-3">
          <h2 className="text-2xl font-semibold text-zinc-900">
            Get your Friday afternoons back
          </h2>
          <div className="text-sm text-zinc-600">
            Join PMs who stopped wasting time on reports
          </div>
          <div>
            <Link href="/signup" className="btn-primary inline-flex items-center justify-center">
              Start 14-day trial →
            </Link>
          </div>
          <div className="text-sm text-zinc-500">
            ✓ No credit card required &nbsp; ✓ 2 minute setup &nbsp; ✓ Cancel anytime
          </div>
        </section>

        <footer className="border-t border-zinc-200 pt-8 text-sm text-zinc-600">
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="space-y-2">
              <div className="font-semibold text-zinc-900">Relay</div>
              <div>Made with love by PMs, for PMs</div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-zinc-900">Product</div>
              <div>Features</div>
              <div>Pricing</div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-zinc-900">Company</div>
              <div>About</div>
              <div>Blog</div>
              <div>Contact</div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-zinc-900">Legal</div>
              <div>Terms</div>
              <div>Privacy</div>
            </div>
          </div>
          <div className="mt-6 text-xs text-zinc-500">© 2026 Relay. All rights reserved.</div>
        </footer>
      </div>
    </main>
  );
}
