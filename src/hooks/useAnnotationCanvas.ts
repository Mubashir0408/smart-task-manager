"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useCanvasDrawing } from "@/hooks/useCanvasDrawing";
import { computeContainedSize, isSupportedImageFile, loadImageFromFile } from "@/utils/image";
import { clearCanvasContents, downloadBlob, resizeCanvasPreservingContent } from "@/utils/canvas";

const MAX_CANVAS_HEIGHT = 600;
// Matches the p-4 (1rem) padding on each side of the canvas container.
const CONTAINER_PADDING = 32;
const DEFAULT_COLOR = "#ef4444";
const DEFAULT_BRUSH_SIZE = 4;

interface CanvasSize {
  width: number;
  height: number;
}

/**
 * Owns everything needed to run the Image Annotation feature: the image
 * layer, the annotation layer stacked on top of it, brush settings, and the
 * clear/download/upload actions. Two separate <canvas> elements are used
 * (rather than one) so annotations can be cleared without ever touching the
 * uploaded image pixels underneath.
 */
export function useAnnotationCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const sizeRef = useRef<CanvasSize | null>(null);

  const [size, setSize] = useState<CanvasSize | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);

  const { showToast } = useToast();

  // Paints the source image onto the image-layer canvas at the given CSS
  // size, backed by a devicePixelRatio-scaled pixel buffer so it stays sharp
  // on high-DPI screens instead of blurring like a plain CSS-stretched image.
  const paintImage = useCallback((width: number, height: number) => {
    const canvas = imageCanvasRef.current;
    const image = imageRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !image || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
  }, []);

  // Resizes the annotation-layer canvas. When `preserve` is true (a viewport
  // resize), existing strokes are captured first and redrawn scaled onto the
  // new size so resizing the window doesn't wipe the user's drawing.
  const sizeDrawCanvas = useCallback((width: number, height: number, preserve: boolean) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    resizeCanvasPreservingContent(canvas, width, height, dpr, preserve);
  }, []);

  // Applies a new display size to both canvas layers and keeps sizeRef in
  // sync so the resize observer can compare against it without depending on
  // React state (which would require re-subscribing on every resize).
  const applySize = useCallback(
    (nextSize: CanvasSize, preserve: boolean) => {
      sizeRef.current = nextSize;
      setSize(nextSize);
      paintImage(nextSize.width, nextSize.height);
      sizeDrawCanvas(nextSize.width, nextSize.height, preserve);
    },
    [paintImage, sizeDrawCanvas]
  );

  const loadImage = useCallback(
    async (file: File | undefined) => {
      if (!file) {
        showToast("error", "No image selected. Please choose a file to upload.");
        return;
      }
      if (!isSupportedImageFile(file)) {
        showToast("error", "Unsupported file type. Please upload a PNG, JPG, or WEBP image.");
        return;
      }

      setIsLoading(true);
      try {
        const { image, objectUrl } = await loadImageFromFile(file);

        // Release the previous image's object URL before adopting the new
        // one so browser memory isn't leaked across repeated uploads.
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = objectUrl;
        imageRef.current = image;

        const containerWidth = (containerRef.current?.clientWidth ?? image.naturalWidth) - CONTAINER_PADDING;
        const nextSize = computeContainedSize(
          image.naturalWidth,
          image.naturalHeight,
          containerWidth,
          MAX_CANVAS_HEIGHT
        );

        applySize(nextSize, false);
        setHasImage(true);
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Failed to load the image.");
      } finally {
        setIsLoading(false);
      }
    },
    [applySize, showToast]
  );

  const clearAnnotations = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    clearCanvasContents(canvas);
  }, []);

  const downloadImage = useCallback(() => {
    const imageCanvas = imageCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!hasImage || !imageCanvas || !drawCanvas) {
      showToast("error", "Upload an image before downloading.");
      return;
    }

    // Composite the image layer and the annotation layer into a single
    // offscreen canvas, at full backing-store resolution, for export.
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = imageCanvas.width;
    exportCanvas.height = imageCanvas.height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) {
      showToast("error", "Failed to export the image. Please try again.");
      return;
    }
    ctx.drawImage(imageCanvas, 0, 0);
    ctx.drawImage(drawCanvas, 0, 0);

    exportCanvas.toBlob((blob) => {
      if (!blob) {
        showToast("error", "Failed to export the image. Please try again.");
        return;
      }
      downloadBlob(blob, "annotated-image.png");
    }, "image/png");
  }, [hasImage, showToast]);

  const { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } = useCanvasDrawing({
    canvasRef: drawCanvasRef,
    color,
    brushSize,
    enabled: hasImage,
  });

  // Keep the canvas sized to the available container width as the viewport
  // changes, so the tool stays usable across desktop/laptop window sizes.
  useEffect(() => {
    if (!hasImage) return;
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      // contentRect is already the content-box width (padding excluded),
      // unlike clientWidth used below in loadImage — no extra subtraction here.
      const containerWidth = Math.floor(entry.contentRect.width);
      const nextSize = computeContainedSize(
        image.naturalWidth,
        image.naturalHeight,
        containerWidth,
        MAX_CANVAS_HEIGHT
      );

      const current = sizeRef.current;
      if (current && current.width === nextSize.width && current.height === nextSize.height) {
        return;
      }
      applySize(nextSize, true);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [hasImage, applySize]);

  // Release the current image's object URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  return {
    containerRef,
    imageCanvasRef,
    drawCanvasRef,
    size,
    hasImage,
    isLoading,
    color,
    setColor,
    brushSize,
    setBrushSize,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    loadImage,
    clearAnnotations,
    downloadImage,
  };
}
