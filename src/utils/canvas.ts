/**
 * Shared low-level helpers for working with <canvas> elements directly via
 * the Canvas 2D API. Used by both the task image-annotation tool and the
 * signature pad, so the resize/clear/export logic exists in exactly one
 * place instead of being copy-pasted between the two features.
 */

/**
 * Resizes a canvas's backing pixel buffer to (width x height) CSS pixels at
 * the given devicePixelRatio. Setting canvas.width/height always clears the
 * canvas immediately, so when `preserve` is true the current contents are
 * first copied onto an offscreen snapshot canvas and then redrawn, scaled,
 * onto the freshly-sized canvas — this is what lets a signature or
 * annotation survive a container resize instead of being wiped.
 */
export function resizeCanvasPreservingContent(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number,
  preserve: boolean
): void {
  let snapshot: HTMLCanvasElement | null = null;
  if (preserve && canvas.width > 0 && canvas.height > 0) {
    snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    snapshot.getContext("2d")?.drawImage(canvas, 0, 0);
  }

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Every draw call after this is issued in CSS-pixel coordinates; the
  // transform maps them onto the higher-resolution backing store.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (snapshot) {
    ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, width, height);
  }
}

/** Wipes a canvas's full backing-store area, regardless of any active transform. */
export function clearCanvasContents(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

/** Triggers a browser file download for an in-memory Blob, then cleans up. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Exports a canvas as a PNG file download. */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(blob, filename);
  }, "image/png");
}
