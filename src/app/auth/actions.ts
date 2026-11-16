"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateAuth } from "@/lib/auth-validation";
import { safeNextPath } from "@/lib/navigation";
import { formString, type ActionState } from "@/lib/reports";

export async function authenticate(mode: "login" | "register", _state: ActionState, form: FormData): Promise<ActionState> {
  const name = formString(form, "name").trim();
  const email = formString(form, "email").trim();
  const password = formString(form, "password");
  const error = validateAuth({ name, email, password, confirmation: formString(form, "confirmation") }, mode);
  if (error) return { error };
  const client = await createSupabaseServerClient();
  if (!client) return { error: "Supabase belum dikonfigurasi. Hubungi pengelola aplikasi." };
  try {
    if (mode === "register") {
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { display_name: name } } });
      if (error) return { error: "Pendaftaran belum berhasil. Periksa data, coba masuk jika sudah punya akun, atau hubungi pengelola bila masalah berlanjut." };
      if (!data.session) return { message: "Supabase belum memberikan sesi masuk. Jika verifikasi email diaktifkan, ikuti tautan verifikasi pada email lalu masuk kembali." };
    } else {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) return { error: error.code === "email_not_confirmed" ? "Email perlu diverifikasi sesuai pengaturan Supabase. Periksa email Anda, lalu masuk kembali." : "Tidak dapat masuk. Periksa email/password atau coba lagi jika layanan sedang bermasalah." };
    }
  } catch { return { error: "Layanan autentikasi belum dapat dihubungi. Silakan coba lagi." }; }
  revalidatePath("/", "layout");
  redirect(safeNextPath(formString(form, "next")));
}

export async function logout(): Promise<ActionState> {
  const client = await createSupabaseServerClient();
  if (!client) return { error: "Layanan belum dikonfigurasi; keluar belum dapat diproses." };
  try {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) return { error: "Belum dapat keluar. Silakan coba lagi." };
  } catch { return { error: "Layanan belum dapat dihubungi. Silakan coba keluar kembali." }; }
  revalidatePath("/", "layout");
  redirect("/login");
}
