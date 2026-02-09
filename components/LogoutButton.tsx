"use client";

export function LogoutButton() {
  const onLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <button
      onClick={onLogout}
      className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100"
    >
      Logout
    </button>
  );
}
