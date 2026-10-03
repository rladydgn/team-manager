"use client";

import Image from "next/image";
import { useState } from "react";
import { API_BASE_URL } from "@/shared/config/api";

export function TeamLogo({ logoUrl, name, className = "size-12", priority = false }: {
  logoUrl?: string | null;
  name: string;
  className?: string;
  priority?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = logoUrl?.startsWith("/teams/logos/") ? `${API_BASE_URL}${logoUrl}` : logoUrl;
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-brand-soft font-semibold text-brand-ink ${className}`}>
      {logoUrl && failedUrl !== logoUrl ? (
        <Image src={src!} alt={`${name} 로고`} fill unoptimized priority={priority} className="object-contain p-1" onError={() => setFailedUrl(logoUrl)} />
      ) : <span aria-hidden="true">{name.trim().slice(0, 2) || "팀"}</span>}
    </span>
  );
}
