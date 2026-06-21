"use client";

import { useState, useEffect } from "react";

const LETTERS: { char: string; color: string; delay: number }[] = [
  { char: "M", color: "#F3EFE6", delay: 1.00 },
  { char: "y", color: "#F3EFE6", delay: 1.05 },
  { char: "S", color: "#E6B53C", delay: 1.11 },
  { char: "u", color: "#E6B53C", delay: 1.17 },
  { char: "p", color: "#E6B53C", delay: 1.23 },
  { char: "e", color: "#E6B53C", delay: 1.29 },
  { char: "r", color: "#E6B53C", delay: 1.35 },
  { char: "S", color: "#F3EFE6", delay: 1.41 },
  { char: "t", color: "#F3EFE6", delay: 1.47 },
  { char: "o", color: "#F3EFE6", delay: 1.53 },
  { char: "r", color: "#F3EFE6", delay: 1.59 },
  { char: "e", color: "#F3EFE6", delay: 1.65 },
];

export function SplashScreen() {
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);

  const dismiss = () => {
    if (exiting || gone) return;
    setExiting(true);
    setTimeout(() => setGone(true), 700);
  };

  useEffect(() => {
    const handlePlay = () => {
      setGone(false);
      setExiting(false);
      setTimeout(dismiss, 3000);
    };
    window.addEventListener("play_splash", handlePlay);
    return () => window.removeEventListener("play_splash", handlePlay);
  }, [exiting, gone]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("splash_seen");
      if (seen) {
        setGone(true);
        return;
      }
      sessionStorage.setItem("splash_seen", "true");
    }
    const t = setTimeout(dismiss, 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <>
      <style>{`
        @keyframes mss-glow    {0%{opacity:0;transform:translate(-50%,-50%)scale(.55)}100%{opacity:.85;transform:translate(-50%,-50%)scale(1)}}
        @keyframes mss-breathe {0%,100%{opacity:.6;transform:translate(-50%,-50%)scale(.96)}50%{opacity:.95;transform:translate(-50%,-50%)scale(1.06)}}
        @keyframes mss-pop     {0%{opacity:0;transform:scale(.2)}100%{opacity:1;transform:scale(1)}}
        @keyframes mss-draw    {from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
        @keyframes mss-appear  {from{opacity:0}to{opacity:1}}
        @keyframes mss-glint   {0%{stroke-dashoffset:100;opacity:0}12%{opacity:1}88%{opacity:1}100%{stroke-dashoffset:0;opacity:0}}
        @keyframes mss-sparkle {0%{opacity:0;transform:scale(0)rotate(-50deg)}55%{opacity:1;transform:scale(1.25)rotate(0)}100%{opacity:.95;transform:scale(1)rotate(0)}}
        @keyframes mss-twinkle {0%,100%{opacity:.55;transform:scale(.9)}50%{opacity:1;transform:scale(1.12)}}
        @keyframes mss-letter  {from{opacity:0;transform:translateY(125%)}to{opacity:1;transform:translateY(0)}}
        @keyframes mss-tag     {from{opacity:0;letter-spacing:.08em;transform:translateY(10px)}to{opacity:1;letter-spacing:.34em;transform:translateY(0)}}
        @keyframes mss-shadow  {0%,100%{filter:drop-shadow(0 6px 22px rgba(230,181,60,.28))}50%{filter:drop-shadow(0 6px 34px rgba(230,181,60,.5))}}
        @keyframes mss-hint    {from{opacity:0}to{opacity:1}}
        @keyframes mss-exit    {to{opacity:0;transform:scale(1.04)}}
      `}</style>

      <div
        onClick={dismiss}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          cursor: "pointer",
          userSelect: "none",
          transition: "opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)",
          opacity: exiting ? 0 : 1,
          transform: exiting ? "scale(1.04)" : "scale(1)",
          pointerEvents: exiting ? "none" : "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(125% 95% at 50% 32%, #1A1626 0%, #0C0B11 62%)",
          fontFamily: "var(--font-sora, 'Sora', system-ui, sans-serif)",
          overflow: "hidden",
        }}
      >
        {/* Glow orb behind Saturn */}
        <div style={{
          position: "absolute",
          top: "43%", left: "50%",
          width: 640, height: 640,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(230,181,60,.18) 0%, rgba(230,181,60,.06) 38%, rgba(230,181,60,0) 68%)",
          animation: "mss-glow 1s ease-out .15s both, mss-breathe 5.5s ease-in-out 2.6s infinite",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Saturn logo */}
          <svg
            viewBox="0 0 400 300"
            style={{
              width: "clamp(220px, 50vw, 392px)",
              height: "auto",
              overflow: "visible",
              display: "block",
              animation: "mss-shadow 5s ease-in-out 2.4s infinite",
            }}
          >
            <defs>
              <radialGradient id="sp_sph" cx="38%" cy="30%" r="74%">
                <stop offset="0%"   stopColor="#FCE6A0" />
                <stop offset="44%"  stopColor="#E6B53C" />
                <stop offset="100%" stopColor="#A4711B" />
              </radialGradient>
              <linearGradient id="sp_ring" x1="0" y1="0" x2="1" y2="0.22">
                <stop offset="0%"   stopColor="#B9842A" />
                <stop offset="48%"  stopColor="#F6D26A" />
                <stop offset="100%" stopColor="#E6B53C" />
              </linearGradient>
              <mask id="sp_front">
                <rect x="-80" y="135" width="560" height="240" fill="#fff" />
              </mask>
            </defs>

            {/* Ring — back layer */}
            <g transform="rotate(-20 200 135)" fill="none">
              <ellipse cx="200" cy="135" rx="158" ry="49" stroke="#7C7568" strokeWidth="2"
                style={{ animation: "mss-appear .9s ease-out .2s both" }} />
              <ellipse cx="200" cy="135" rx="150" ry="43" stroke="url(#sp_ring)" strokeWidth="11"
                pathLength="100" strokeDasharray="100" strokeLinecap="round"
                style={{ animation: "mss-draw 1.05s cubic-bezier(.45,0,.15,1) .1s both" }} />
            </g>

            {/* Planet sphere */}
            <g style={{ transformBox: "fill-box", transformOrigin: "center",
              animation: "mss-pop .8s cubic-bezier(.34,1.5,.5,1) 0s both" } as React.CSSProperties}>
              <circle cx="200" cy="135" r="46" fill="url(#sp_sph)" />
              <ellipse cx="185" cy="119" rx="15" ry="10" fill="#FCE6A0" opacity="0.35" />
            </g>

            {/* Ring — front layer (masked by planet) */}
            <g transform="rotate(-20 200 135)" fill="none" mask="url(#sp_front)">
              <ellipse cx="200" cy="135" rx="158" ry="49" stroke="#7C7568" strokeWidth="2"
                style={{ animation: "mss-appear .9s ease-out .2s both" }} />
              <ellipse cx="200" cy="135" rx="150" ry="43" stroke="url(#sp_ring)" strokeWidth="11"
                pathLength="100" strokeDasharray="100" strokeLinecap="round"
                style={{ animation: "mss-draw 1.05s cubic-bezier(.45,0,.15,1) .1s both" }} />
            </g>

            {/* Glint travelling around ring */}
            <g transform="rotate(-20 200 135)" fill="none">
              <ellipse cx="200" cy="135" rx="150" ry="43" stroke="#FFF7DE" strokeWidth="5"
                pathLength="100" strokeDasharray="9 91" strokeLinecap="round"
                style={{ animation: "mss-glint 1.15s cubic-bezier(.4,0,.2,1) .5s both" }} />
            </g>

            {/* Star sparkle */}
            <g style={{ transformBox: "fill-box", transformOrigin: "center",
              animation: "mss-sparkle .65s cubic-bezier(.34,1.5,.5,1) .85s both, mss-twinkle 3.4s ease-in-out 1.7s infinite",
            } as React.CSSProperties}>
              <path d="M334 60 l3.4 10.2 10.2 3.4 -10.2 3.4 -3.4 10.2 -3.4 -10.2 -10.2 -3.4 10.2 -3.4 z" fill="#FCE6A0" />
            </g>
          </svg>

          {/* Wordmark — letter-by-letter reveal */}
          <div style={{
            display: "inline-flex",
            alignItems: "flex-end",
            marginTop: "clamp(16px, 4vw, 30px)",
            fontWeight: 800,
            fontSize: "clamp(32px, 9vw, 62px)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}>
            {LETTERS.map(({ char, color, delay }, i) => (
              <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.16em" }}>
                <span style={{ display: "inline-block", color, animation: `mss-letter .6s cubic-bezier(.22,1,.36,1) ${delay}s both` }}>
                  {char}
                </span>
              </span>
            ))}
          </div>

          {/* Tagline */}
          <div style={{
            marginTop: "clamp(14px, 3vw, 22px)",
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "#D2A23A",
            animation: "mss-tag .85s cubic-bezier(.22,1,.36,1) 1.8s both",
          }}>
            Onde tudo orbita você
          </div>
        </div>

        {/* Skip hint */}
        <div style={{
          position: "absolute",
          bottom: 24, right: 28,
          fontFamily: "var(--font-mono, 'Space Mono', monospace)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(243,239,230,.32)",
          animation: "mss-hint 1s ease-out 2.0s both",
          pointerEvents: "none",
        }}>
          toque para pular
        </div>
      </div>
    </>
  );
}
