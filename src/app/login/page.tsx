import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/navigation";
import type { SearchParams } from "@/lib/reports";

export const metadata: Metadata = { title: "Masuk" };

async function LoginContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (await getCurrentUser()) redirect(next);
  return <AuthForm mode="login" next={next} configured={Boolean(getSupabaseConfig())} />;
}

export default function Login({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <div className="flex min-h-screen flex-col bg-brand-bg"><main id="main-content" tabIndex={-1} className="flex flex-1 items-center justify-center p-4 py-10 sm:p-8"><Suspense fallback={<p role="status" className="text-brand-secondary">Menyiapkan halaman masuk...</p>}><LoginContent searchParams={searchParams} /></Suspense></main><footer className="border-t border-brand-border/60 px-4 py-4 text-center text-xs text-brand-secondary">© 2026 FindIt Indonesia · Smart Campus Lost & Found · <Link href="/#panduan-keamanan" className="hover:text-brand-heading">Panduan Keamanan</Link></footer></div>;
}
