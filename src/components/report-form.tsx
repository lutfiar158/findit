"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { createReport } from "@/app/reports/actions";
import { categories, locations } from "@/lib/catalog";
import type { ActionState, ReportInput } from "@/lib/reports";
import { Icon } from "./icon";

const fieldClass = "w-full rounded-xl border border-outline-variant/60 bg-white px-3.5 py-3 text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-4 focus:ring-primary-container/10";

export function ReportForm({ initialType }: { initialType: "LOST" | "FOUND" }) {
  const id = useId();
  const [state, action, pending] = useActionState<ActionState, FormData>(createReport, {});
  const [values, setValues] = useState<ReportInput>({ type: initialType, title: "", category: "", color: "", location: "", event_date: "", description: "" });
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  function clearPhoto() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
  }

  return <form action={action} className="rounded-2xl bg-white p-5 shadow-sm sm:p-8" aria-describedby={state.error ? `${id}-error` : undefined}>
    {state.error && <p id={`${id}-error`} role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{state.error}</p>}
    <fieldset disabled={pending} className="space-y-6 disabled:opacity-60">
      <legend className="sr-only">Detail laporan barang</legend>
      <div className="grid grid-cols-2 gap-3">
        {[["LOST", "Barang Hilang", "search"], ["FOUND", "Barang Ditemukan", "volunteer_activism"]].map(([type, label, icon]) => <label key={type} className={`flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 font-semibold ${values.type === type ? "border-primary-container bg-primary-fixed/40 text-primary" : "border-outline-variant/40 text-on-surface-variant"}`}><input type="radio" name="type" value={type} checked={values.type === type} onChange={() => setValues({ ...values, type: type === "FOUND" ? "FOUND" : "LOST" })} className="accent-primary-container" /><Icon name={icon} /><span>{label}</span></label>)}
      </div>
      <div><label htmlFor={`${id}-title`} className="mb-2 block font-semibold">Judul laporan <span className="text-secondary">*</span></label><input id={`${id}-title`} name="title" required minLength={3} maxLength={120} placeholder="Contoh: Dompet kulit hitam" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} className={fieldClass} /></div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div><label htmlFor={`${id}-category`} className="mb-2 block font-semibold">Kategori <span className="text-secondary">*</span></label><select id={`${id}-category`} name="category" required value={values.category} onChange={(event) => setValues({ ...values, category: event.target.value })} className={fieldClass}><option value="">Pilih kategori</option>{categories.map((category) => <option key={category.name}>{category.name}</option>)}</select></div>
        <div><label htmlFor={`${id}-color`} className="mb-2 block font-semibold">Warna <span className="text-secondary">*</span></label><input id={`${id}-color`} name="color" required maxLength={60} placeholder="Contoh: Hitam" value={values.color} onChange={(event) => setValues({ ...values, color: event.target.value })} className={fieldClass} /></div>
        <div><label htmlFor={`${id}-location`} className="mb-2 block font-semibold">Lokasi kampus <span className="text-secondary">*</span></label><select id={`${id}-location`} name="location" required value={values.location} onChange={(event) => setValues({ ...values, location: event.target.value })} className={fieldClass}><option value="">Pilih lokasi</option>{locations.map((location) => <option key={location.value} value={location.value}>{location.label}</option>)}</select></div>
        <div><label htmlFor={`${id}-date`} className="mb-2 block font-semibold">Tanggal kejadian <span className="text-secondary">*</span></label><input id={`${id}-date`} name="event_date" type="date" required value={values.event_date} onChange={(event) => setValues({ ...values, event_date: event.target.value })} className={fieldClass} /></div>
      </div>
      <div><label htmlFor={`${id}-description`} className="mb-2 block font-semibold">Deskripsi & kronologi <span className="text-secondary">*</span></label><textarea id={`${id}-description`} name="description" required minLength={10} maxLength={3000} rows={5} placeholder="Jelaskan ciri barang, waktu dan area kejadian. Jangan sertakan nomor identitas atau kontak pribadi." value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} className={fieldClass} /><p className="mt-2 text-body-sm text-on-surface-variant">10–3000 karakter. Tulis ruangan/titik lokasi lebih rinci di sini. Foto tidak diperlukan.</p></div>
      <div><label htmlFor={`${id}-image`} className="mb-2 block font-semibold">Foto barang (opsional)</label><input ref={inputRef} id={`${id}-image`} name="image" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby={`${id}-image-help${photoError ? ` ${id}-image-error` : ""}`} className={fieldClass} onChange={(event) => {
        if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
        setPreview(null);
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024 || !file.size || !/\.(jpe?g|png|webp)$/i.test(file.name) || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setPhotoError("Pilih foto JPEG, PNG, atau WebP dengan ukuran maksimal 3 MB.");
          event.currentTarget.value = "";
          return;
        }
        setPhotoError("");
        previewRef.current = URL.createObjectURL(file);
        setPreview(previewRef.current);
      }} /><p id={`${id}-image-help`} className="mt-2 text-body-sm text-on-surface-variant">Satu foto JPEG, PNG, atau WebP; maksimal 3 MB. Hindari foto identitas atau kontak pribadi.</p>{photoError && <p id={`${id}-image-error`} role="alert" className="mt-2 text-body-sm text-secondary">{photoError}</p>}{preview && <div className="mt-3 flex flex-wrap items-center gap-4"><div className="relative h-28 w-40 overflow-hidden rounded-xl bg-surface-container"><Image src={preview} alt="Pratinjau foto pilihan" fill unoptimized className="object-cover" /></div><button type="button" onClick={() => { clearPhoto(); setPhotoError(""); }} className="min-h-10 rounded-xl px-3 font-semibold text-secondary hover:bg-secondary-fixed">Hapus foto pilihan</button></div>}</div>
      <div className="flex flex-col gap-4 border-t border-surface-container pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-sm text-body-sm text-on-surface-variant">Laporan aktif dapat dilihat publik. Anda dapat menandainya selesai atau mengarsipkannya di Laporan Saya.</p><button type="submit" className="button-primary shrink-0">{pending ? "Menyimpan..." : "Terbitkan Laporan"}<Icon name="arrow_forward" className="text-[18px]" /></button></div>
    </fieldset>
  </form>;
}
