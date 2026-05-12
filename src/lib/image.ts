// Compress + resize an image client-side before upload.
// Returns a JPEG/WebP Blob no larger than `maxSize` on its longest edge.
export async function compressImage(
  file: File,
  {
    maxSize = 512,
    quality = 0.85,
    mime = "image/webp",
  }: { maxSize?: number; quality?: number; mime?: string } = {},
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Compression failed"))), mime, quality);
  });
}
