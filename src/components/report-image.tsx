"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

export function ReportImage({ id, hasImage, alt, children }: { id: string; hasImage: boolean; alt: string; children: ReactNode }) {
  const [failedId, setFailedId] = useState<string | null>(null);
  return hasImage && failedId !== id
    ? <Image src={`/api/report-image/${id}`} alt={alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized className="object-cover" onError={() => setFailedId(id)} />
    : <>{children}</>;
}
