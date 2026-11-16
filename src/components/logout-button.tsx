"use client";

import { useActionState } from "react";
import { logout } from "@/app/auth/actions";
import type { ActionState } from "@/lib/reports";

export function LogoutButton() {
  const [state, action, pending] = useActionState<ActionState, FormData>(logout, {});
  return <form action={action}><button type="submit" disabled={pending} className="min-h-10 rounded-xl px-3 text-label-md font-semibold text-primary hover:bg-primary-fixed disabled:opacity-60">{pending ? "Keluar..." : "Keluar"}</button>{state.error && <p role="alert" className="max-w-48 text-body-sm text-error">{state.error}</p>}</form>;
}
