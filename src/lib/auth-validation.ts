export type AuthValues = { name?: string; email: string; password: string; confirmation?: string };

export function validateAuth(values: AuthValues, mode: "login" | "register"): string | null {
  if (mode === "register" && !values.name?.trim()) return "Nama tampilan wajib diisi.";
  if (mode === "register" && values.name!.trim().length > 80) return "Nama tampilan maksimal 80 karakter.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return "Gunakan format email yang valid.";
  if (!values.password) return "Kata sandi wajib diisi.";
  if (mode === "register" && values.password.length < 8) return "Password minimal 8 karakter.";
  if (mode === "register" && values.confirmation !== values.password) return "Konfirmasi password tidak cocok.";
  return null;
}
