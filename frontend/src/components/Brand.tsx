"use client";

import { useId } from "react";

/**
 * Marca Saturno — o símbolo de gravidade, anéis e abundância.
 * Conceito: "tudo gira em torno do cliente". Poder & premium.
 *
 * SaturnMark  → versão colorida (planeta dourado, anéis, brilho)
 * SaturnMono  → versão monocromática (currentColor) p/ footer, favicon, baixa escala
 * BrandLogo   → lockup oficial: marca + wordmark "MySuperStore" (+ tagline)
 */

export function SaturnMark({ className = "" }: { className?: string }) {
  // IDs únicos por instância — evita colisão de gradientes/máscara quando há
  // múltiplas marcas no mesmo documento (header + footer, p.ex.)
  const uid = useId().replace(/[:]/g, "");
  const sph = `sph-${uid}`;
  const ring = `ring-${uid}`;
  const front = `front-${uid}`;

  return (
    <svg
      viewBox="15 25 370 220"
      className={className}
      role="img"
      aria-label="MySuperStore"
      overflow="visible"
    >
      <defs>
        <radialGradient id={sph} cx="38%" cy="30%" r="74%">
          <stop offset="0%" stopColor="#FCE6A0" />
          <stop offset="44%" stopColor="#E6B53C" />
          <stop offset="100%" stopColor="#A4711B" />
        </radialGradient>
        <linearGradient id={ring} x1="0" y1="0" x2="1" y2="0.22">
          <stop offset="0%" stopColor="#B9842A" />
          <stop offset="48%" stopColor="#F6D26A" />
          <stop offset="100%" stopColor="#E6B53C" />
        </linearGradient>
        <mask id={front}>
          <rect x="-80" y="135" width="560" height="240" fill="#fff" />
        </mask>
      </defs>

      {/* Anéis (traseira) */}
      <g transform="rotate(-20 200 135)" fill="none">
        <ellipse cx="200" cy="135" rx="158" ry="49" stroke="#7C7568" strokeWidth="2" />
        <ellipse cx="200" cy="135" rx="150" ry="43" stroke={`url(#${ring})`} strokeWidth="11" />
      </g>

      {/* Planeta */}
      <circle cx="200" cy="135" r="46" fill={`url(#${sph})`} />
      <ellipse cx="185" cy="119" rx="15" ry="10" fill="#FCE6A0" opacity="0.35" />

      {/* Anéis (frente, à frente do planeta) */}
      <g transform="rotate(-20 200 135)" fill="none" mask={`url(#${front})`}>
        <ellipse cx="200" cy="135" rx="158" ry="49" stroke="#7C7568" strokeWidth="2" />
        <ellipse cx="200" cy="135" rx="150" ry="43" stroke={`url(#${ring})`} strokeWidth="11" />
      </g>

      {/* Brilho / estrela de 4 pontas */}
      <path
        d="M334 62 l3.2 9.6 9.6 3.2 -9.6 3.2 -3.2 9.6 -3.2 -9.6 -9.6 -3.2 9.6 -3.2 z"
        fill="#FCE6A0"
      />
    </svg>
  );
}

export function SaturnMono({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="15 25 370 220" className={className} overflow="visible" aria-hidden="true">
      <g transform="rotate(-20 200 135)" fill="none" stroke="currentColor">
        <ellipse cx="200" cy="135" rx="158" ry="49" strokeWidth="2" opacity="0.5" />
        <ellipse cx="200" cy="135" rx="150" ry="43" strokeWidth="11" />
      </g>
      <circle cx="200" cy="135" r="46" fill="currentColor" />
    </svg>
  );
}

export function BrandLogo({
  tagline = false,
  className = "",
  markClassName = "h-10 w-auto",
}: {
  tagline?: boolean;
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <SaturnMark
        className={`${markClassName} shrink-0 drop-shadow-[0_2px_10px_rgba(230,181,60,0.28)] transition-transform duration-300 group-hover:scale-105`}
      />
      <span className="flex flex-col leading-none">
        <span className="font-display font-extrabold text-[1.3rem] tracking-[-0.02em] text-[#F3EFE6]">
          MySuperStore
        </span>
        {tagline && (
          <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-[#B98A2A] mt-1.5">
            marketplace · poder &amp; premium
          </span>
        )}
      </span>
    </span>
  );
}
