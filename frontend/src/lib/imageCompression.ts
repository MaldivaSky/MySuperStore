// Compressão de imagem no navegador, sem dependências.
// Foto de celular (4–12MB) vira ~0.3–0.8MB em resolução web, sem perda visível.
// Resolve o limite de upload na origem, acelera o envio e economiza Cloudinary.

export interface CompressOptions {
  /** Maior lado da imagem final, em px. Produto fica ótimo até ~1600. */
  maxDimension?: number;
  /** Qualidade JPEG/WebP (0–1). 0.82 é o ponto doce qualidade/tamanho. */
  quality?: number;
  /** Tipo de saída. JPEG é o mais compatível e leve para fotos. */
  mimeType?: "image/jpeg" | "image/webp";
}

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1600,
  quality: 0.82,
  mimeType: "image/jpeg",
};

/** Carrega o arquivo como bitmap respeitando a orientação EXIF (fotos de celular vêm giradas). */
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" } as any);
    } catch {
      // alguns browsers não suportam a opção — cai no fallback
    }
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}

/**
 * Comprime/redimensiona uma imagem. Devolve um novo File menor.
 * Em qualquer falha (ou formato não rasterizável como GIF animado/SVG),
 * devolve o arquivo original — nunca bloqueia o usuário.
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const opts = { ...DEFAULTS, ...options };

  // Formatos que não devem (ou não dá) para rasterizar via canvas.
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const bitmap = await loadBitmap(file);
    const srcW = (bitmap as any).width as number;
    const srcH = (bitmap as any).height as number;
    if (!srcW || !srcH) return file;

    // Nunca faz upscale; só reduz se passar do limite.
    const scale = Math.min(1, opts.maxDimension / Math.max(srcW, srcH));
    const w = Math.round(srcW * scale);
    const h = Math.round(srcH * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // Fundo branco evita transparência virar preto ao converter para JPEG.
    if (opts.mimeType === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(bitmap as any, 0, 0, w, h);
    if ("close" in bitmap && typeof (bitmap as any).close === "function") {
      (bitmap as ImageBitmap).close();
    }

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, opts.mimeType, opts.quality)
    );
    if (!blob) return file;
    // Se a compressão não ajudou (imagem já otimizada), mantém o original.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + (opts.mimeType === "image/webp" ? ".webp" : ".jpg");
    return new File([blob], newName, { type: opts.mimeType, lastModified: Date.now() });
  } catch {
    return file;
  }
}
