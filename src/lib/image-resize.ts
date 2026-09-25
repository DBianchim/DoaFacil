/**
 * Redimensiona fotos no navegador antes do envio (ver CLAUDE.md): lado maior
 * até 1600px em WebP (ou JPEG, se o navegador não gerar WebP), mais uma
 * miniatura de 600px para os cards. Respeita a rotação da câmera (EXIF) e
 * descarta metadados como localização GPS, já que o canvas não os copia.
 */

import { PHOTO_MAX_BYTES, PHOTO_MAX_SIDE, THUMB_MAX_BYTES, THUMB_MAX_SIDE } from "./publish-rules";

export type ResizedPhoto = { full: Blob; thumb: Blob; previewUrl: string };

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // alguns formatos só abrem pelo <img> (ex.: HEIC no Safari)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function encode(source: ImageBitmap | HTMLImageElement, maxSide: number, maxBytes: number): Promise<Blob> {
  const w = "naturalWidth" in source ? source.naturalWidth : source.width;
  const h = "naturalHeight" in source ? source.naturalHeight : source.height;

  let side = maxSide;
  let quality = 0.82;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, side / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas indisponível");
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    let blob = await toBlob(canvas, "image/webp", quality);
    // Navegadores sem encoder WebP devolvem PNG: usa JPEG no lugar.
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
    if (!blob) throw new Error("falha ao gerar imagem");
    if (blob.size <= maxBytes) return blob;

    // Ainda grande: reduz qualidade e depois tamanho.
    if (quality > 0.6) quality -= 0.1;
    else side = Math.round(side * 0.8);
  }
  throw new Error("imagem grande demais");
}

export async function resizePhoto(file: File): Promise<ResizedPhoto> {
  const source = await decode(file);
  try {
    const full = await encode(source, PHOTO_MAX_SIDE, PHOTO_MAX_BYTES);
    const thumb = await encode(source, THUMB_MAX_SIDE, THUMB_MAX_BYTES);
    return { full, thumb, previewUrl: URL.createObjectURL(thumb) };
  } finally {
    if ("close" in source) source.close();
  }
}
