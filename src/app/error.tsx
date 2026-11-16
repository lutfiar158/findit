"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" tabIndex={-1} className="page-container flex min-h-[60vh] flex-col items-center justify-center py-12 text-center"><h1 className="mb-3 text-2xl font-bold">Halaman belum dapat dimuat</h1><p className="mb-6 max-w-md text-on-surface-variant">Terjadi gangguan saat memuat halaman. Silakan coba lagi; data laporan tidak diubah oleh kegagalan ini.</p><button type="button" onClick={reset} className="button-primary">Coba Lagi</button></main>;
}
