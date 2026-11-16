import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jakarta = localFont({
  src: "../../public/fonts/jakarta.woff2",
  variable: "--font-jakarta",
  weight: "400 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "FindIt — Smart Campus Lost & Found", template: "%s | FindIt" },
  description: "Cari barang hilang dan bantu teman kampus menemukan kembali barang mereka dengan mudah, cepat, dan aman.",
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-xl focus:bg-white focus:p-4">Lewati ke konten</a>
        {children}
      </body>
    </html>
  );
}
