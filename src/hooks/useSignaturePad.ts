"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useCanvasDrawing } from "@/hooks/useCanvasDrawing";
import {
  clearCanvasContents,
  downloadCanvasAsPng,
  resizeCanvasPreservingContent,
} from "@/utils/canvas";

const SIGNATURE_HEIGHT = 180;
const SIGNATURE_COLOR = "#1e293b"; // slate-800 — reads as ink against the white pad
const SIGNATURE_LINE_WIDTH = 2.5;

/**
 * A minimal signature pad built directly on the Canvas 2D API. It reuses
 * useCanvasDrawing (the same freehand-stroke controller that powers the
 * task image-annotation tool) so the mouse-event-to-stroke logic lives in
 * exactly one place — the pad itself only owns sizing, clear, and export.
 */
export function useSignaturePad() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const {
    handleMouseDown: startStroke,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useCanvasDrawing({
    canvasRef,
    color: SIGNATURE_COLOR,
    brushSize: SIGNATURE_LINE_WIDTH,
    enabled: true,
  });

  // Wrap mousedown so the first stroke also flips hasSignature, enabling
  // the Clear/Download controls.
  const handleMouseDown = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      setHasSignature(true);
      startStroke(event);
    },
    [startStroke]
  );

  // Size (and resize) the canvas backing store to fill the available
  // container width at a fixed pad height, preserving any existing
  // signature so a viewport resize doesn't erase it.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const applySize = (width: number, preserve: boolean) => {
      const dpr = window.devicePixelRatio || 1;
      resizeCanvasPreservingContent(canvas, width, SIGNATURE_HEIGHT, dpr, preserve);
    };

    applySize(container.clientWidth, false);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      applySize(Math.floor(entry.contentRect.width), true);
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    clearCanvasContents(canvas);
    setHasSignature(false);
  }, []);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    // The canvas background is left transparent (no fillRect before
    // drawing), so the exported PNG has a transparent background — the
    // white area on screen comes from a CSS background on the element,
    // not from pixels in the bitmap.
    downloadCanvasAsPng(canvas, "signature.png");
  }, [hasSignature]);

  return {
    containerRef,
    canvasRef,
    hasSignature,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    clear,
    download,
  };
}
