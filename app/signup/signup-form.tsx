"use client";

import { useState } from "react";
import { signupAction } from "../login/actions";

export default function EmailSignupForm() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="btn-secondary w-full">
        Continue with email →
      </button>
    );
  }

  return (
    <form action={signupAction} className="space-y-3">
      <input
        name="email"
        className="input w-full"
        placeholder="Email"
        autoComplete="email"
        required
      />
      <div className="relative">
        <input
          name="password"
          className="input w-full pr-16"
          placeholder="Password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      <button className="btn-primary w-full">
        Create account →
      </button>
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="w-full text-center text-sm text-gray-600 hover:underline"
      >
        ← Back to other options
      </button>
    </form>
  );
}
