"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { authenticate } from "@/app/auth/actions";
import type { ActionState } from "@/lib/reports";
import { Icon } from "./icon";

const inputClass = "h-12 w-full rounded-xl border border-brand-border bg-white px-3.5 text-sm text-brand-heading placeholder:text-brand-secondary/50 transition focus:border-brand-cobalt focus:outline-none focus:ring-4 focus:ring-brand-cobalt/10";

function PasswordField({ confirmation = false, register }: { confirmation?: boolean; register: boolean }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return <div>
    <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-brand-heading">{confirmation ? "Konfirmasi password" : "Password"} <span className="text-brand-coral">*</span></label>
    <div className="relative">
      <input id={id} name={confirmation ? "confirmation" : "password"} type={visible ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} placeholder={confirmation ? "Ulangi password" : register ? "Buat password" : "Masukkan password"} required minLength={register ? 8 : undefined} aria-describedby={register && !confirmation ? `${id}-hint` : undefined} className={`${inputClass} pr-12`} />
      <button type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? "Sembunyikan" : "Tampilkan"} ${confirmation ? "konfirmasi password" : "password"}`} aria-pressed={visible} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-brand-secondary hover:text-brand-heading"><Icon name={visible ? "visibility_off" : "visibility"} className="text-[18px]" /></button>
    </div>
    {register && !confirmation && <p id={`${id}-hint`} className="mt-1 text-[11px] text-brand-secondary">Minimal 8 karakter</p>}
  </div>;
}

export function AuthForm({ mode, next = "/laporan-saya", configured = true }: { mode: "login" | "register"; next?: string; configured?: boolean }) {
  const register = mode === "register";
  const id = useId();
  const [state, action, pending] = useActionState<ActionState, FormData>(authenticate.bind(null, mode), {});

  return <div className="w-full max-w-[440px]">
    <div className="mb-6 text-center"><Link href="/" className="inline-flex items-center gap-2.5 rounded-xl p-1" aria-label="Kembali ke Beranda FindIt"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-cobalt text-white shadow-md shadow-brand-cobalt/20"><Icon name="search" className="text-[24px]" /></span><span className="text-2xl font-bold tracking-tight text-brand-heading">FindIt</span><span className="rounded bg-brand-cobalt/10 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-brand-cobalt uppercase">Kampus</span></Link></div>
    <div className="rounded-2xl border border-brand-border bg-white p-7 shadow-sm sm:p-9">
      <div className="mb-6 text-center"><h1 className="mb-2 text-2xl font-bold tracking-tight text-brand-heading">{register ? "Yuk, gabung FindIt!" : "Selamat datang kembali!"}</h1><p className="text-sm leading-relaxed text-brand-secondary">{register ? "Buat akun untuk mulai mencari dan melaporkan barang di kampus." : "Masuk untuk melanjutkan aktivitasmu di FindIt."}</p></div>
      {!configured && <p role="alert" className="mb-5 rounded-xl bg-brand-bg p-3 text-xs text-brand-secondary">Supabase belum dikonfigurasi. Hubungi pengelola aplikasi.</p>}
      {(state.error || state.message) && <p id={`${id}-feedback`} role={state.error ? "alert" : "status"} className={`mb-5 rounded-xl border p-3.5 text-xs leading-relaxed ${state.error ? "border-red-200 bg-red-50 text-red-800" : "border-brand-border bg-brand-bg text-brand-heading"}`}>{state.error || state.message}</p>}
      <form action={action} aria-describedby={state.error || state.message ? `${id}-feedback` : undefined}>
        <input type="hidden" name="next" value={next} />
        <fieldset disabled={pending || !configured} className="space-y-4 disabled:opacity-60">
          {register && <div><label htmlFor={`${id}-name`} className="mb-1.5 block text-xs font-semibold text-brand-heading">Nama tampilan <span className="text-brand-coral">*</span></label><input type="text" id={`${id}-name`} name="name" autoComplete="nickname" placeholder="Nama yang ingin ditampilkan" required maxLength={80} className={inputClass} /></div>}
          <div><label htmlFor={`${id}-email`} className="mb-1.5 block text-xs font-semibold text-brand-heading">Email <span className="text-brand-coral">*</span></label><input type="email" id={`${id}-email`} name="email" autoComplete="email" placeholder="nama@email.com" required className={inputClass} /></div>
          <PasswordField register={register} />
          {register && <PasswordField register confirmation />}
          {!register && <p className="py-1 text-xs text-brand-secondary">Sesi masuk dikelola secara aman melalui cookie.</p>}
          {register && <p className="pt-1 text-[11px] leading-relaxed text-brand-secondary">Jaga kejujuran informasi serah terima barang kampus. Password ditangani oleh Supabase Auth, bukan disimpan oleh FindIt.</p>}
          <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-cobalt text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover hover:shadow">{pending ? (register ? "Mendaftarkan..." : "Memverifikasi...") : register ? "Buat Akun" : "Masuk"}<Icon name="arrow_forward" className="text-[18px]" /></button>
        </fieldset>
      </form>
      <div className="mt-6 border-t border-brand-border pt-5 text-center"><p className="text-xs text-brand-secondary">{register ? "Sudah punya akun?" : "Belum punya akun?"} <Link href={`${register ? "/login" : "/register"}?next=${encodeURIComponent(next)}`} className="rounded font-semibold text-brand-cobalt underline underline-offset-4 hover:text-brand-hover">{register ? "Masuk" : "Daftar sekarang"}</Link></p></div>
    </div>
    <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-brand-secondary"><Icon name="lock" className="text-[16px] text-brand-cobalt" />Smart Campus Lost & Found · Supabase Auth</p>
  </div>;
}
