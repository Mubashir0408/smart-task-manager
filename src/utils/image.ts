export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export function isSupportedImageFile(file: File): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

export interface LoadedImage {
  image: HTMLImageElement;
  objectUrl: string;
}

/**
 * Decodes a File into an HTMLImageElement using an object URL rather than a
 * base64 data URL, which avoids the memory/CPU cost of base64-encoding large
 * images. Caller owns the returned objectUrl and must revoke it when done.
 */
export function loadImageFromFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This image could not be loaded. The file may be corrupted."));
    };

    image.src = objectUrl;
  });
}

/**
 * Scales (naturalWidth x naturalHeight) down to fit within
 * (maxWidth x maxHeight) while preserving aspect ratio. Never upscales past
 * the image's natural size, so small images stay crisp.
 */
export function computeContainedSize(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const safeMaxWidth = maxWidth > 0 ? maxWidth : naturalWidth;
  const safeMaxHeight = maxHeight > 0 ? maxHeight : naturalHeight;
  const ratio = Math.min(safeMaxWidth / naturalWidth, safeMaxHeight / naturalHeight, 1);

  return {
    width: Math.max(1, Math.round(naturalWidth * ratio)),
    height: Math.max(1, Math.round(naturalHeight * ratio)),
  };
}
