// Logo horizontal para e-mails (PNG, fundo transparente) a partir da arte da marca.
// E-mail não renderiza SVG — por isso geramos PNG e referenciamos por URL.
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const GOLD = "#E6B53C";
const RING = "#7C7568";
const HILITE = "#FCE6A0";
const TEXT = "#F3EFE6";

// Lockup horizontal: planeta à esquerda + wordmark à direita. Fundo transparente
// (assenta sobre o header escuro do e-mail). 2x para nitidez em telas retina.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="280" viewBox="0 0 1040 280">
  <g transform="translate(150 140)">
    <g transform="rotate(-20)" fill="none">
      <ellipse rx="120" ry="35" stroke="${RING}" stroke-width="6"/>
      <ellipse rx="114" ry="30" stroke="${GOLD}" stroke-width="14"/>
    </g>
    <circle r="52" fill="${GOLD}"/>
    <ellipse cx="-17" cy="-14" rx="16" ry="11" fill="${HILITE}" opacity="0.45"/>
  </g>
  <text x="310" y="172" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-weight="800" font-size="108" letter-spacing="-3" fill="${TEXT}">My<tspan fill="${GOLD}">Super</tspan>Store</text>
</svg>`;

await sharp(Buffer.from(svg)).resize(520).png().toFile(join(publicDir, "email-logo.png"));
console.log("✓ email-logo.png gerado");
