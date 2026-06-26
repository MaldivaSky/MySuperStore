// Gera os ícones do PWA a partir da arte oficial da marca (MySuperStore Marca.html).
// Símbolo: "planeta" dourado com anéis (Saturno) — o centro de gravidade comercial.
// Uso: node scripts/generate-pwa-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const BG = '#0C0B11'; // fundo da marca
const GOLD = '#E6B53C';
const RING = '#7C7568';
const HILITE = '#FCE6A0';
const TEXT = '#F3EFE6';

// Símbolo do planeta + anéis, centralizado num viewBox quadrado.
// Mantém o conteúdo dentro da "safe zone" (~80% central) exigida por ícones maskable.
function planet({ scale = 1, cx = 256, cy = 256 } = {}) {
  return `
    <g transform="translate(${cx} ${cy}) scale(${scale})">
      <g transform="rotate(-20)" fill="none">
        <ellipse rx="200" ry="58" stroke="${RING}" stroke-width="9"/>
        <ellipse rx="190" ry="50" stroke="${GOLD}" stroke-width="22"/>
      </g>
      <circle r="86" fill="${GOLD}"/>
      <ellipse cx="-28" cy="-23" rx="27" ry="18" fill="${HILITE}" opacity="0.45"/>
    </g>`;
}

// Ícone do app: planeta grande centralizado + wordmark discreto embaixo.
// "any maskable" => o planeta sozinho já sobrevive ao recorte circular do Android/iOS.
const appIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${BG}"/>
  ${planet({ scale: 0.92, cy: 232 })}
  <text x="256" y="430" text-anchor="middle" font-family="-apple-system, Segoe UI, sans-serif"
        font-weight="800" font-size="52" letter-spacing="-2" fill="${TEXT}">My<tspan fill="${GOLD}">Super</tspan>Store</text>
</svg>`;

// Badge da notificação: precisa ser monocromático (branco) em transparência.
// Android pinta o badge com a cor de acento do sistema usando o canal alfa.
const badgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 512 512">
  <g transform="translate(256 256)">
    <g transform="rotate(-20)" fill="none">
      <ellipse rx="200" ry="58" stroke="#FFFFFF" stroke-width="14"/>
    </g>
    <circle r="96" fill="#FFFFFF"/>
  </g>
</svg>`;

async function render(svg, size, file) {
  const out = join(publicDir, file);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log(`✓ ${file} (${size}x${size})`);
}

await render(appIconSvg, 512, 'icon-512x512.png');
await render(appIconSvg, 192, 'icon-192x192.png');
await render(badgeSvg, 72, 'badge-72x72.png');
// Atalho útil para o iOS (apple-touch-icon) — sem cantos arredondados, o iOS aplica os seus.
const appleSvg = appIconSvg.replace('rx="96"', 'rx="0"');
await render(appleSvg, 180, 'apple-touch-icon.png');
console.log('Pronto.');
