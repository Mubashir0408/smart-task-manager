"use client";

import { useCallback, useRef, type MouseEvent, type RefObject } from "react";

interface Point {
  x: number;
  y: number;
}

interface UseCanvasDrawingOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  color: string;
  brushSize: number;
  enabled: boolean;
}

/**
 * Generic freehand-drawing controller for a single 2D canvas. Knows nothing
 * about images or layers — it only turns mouse events into strokes on
 * whichever canvas it's given, using the native Canvas 2D Context.
 */
function getCanvasPoint(canvas: HTMLCanvasElement, event: MouseEvent<HTMLCanvasElement>): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function useCanvasDrawing({ canvasRef, color, brushSize, enabled }: UseCanvasDrawingOptions) {
  // Drawing state lives in refs, not React state, so a 60fps mousemove
  // stream never triggers a re-render — only the pixels on the canvas change.
  const isDrawingRef = useRef(false);

  const handleMouseDown = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (!enabled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const point = getCanvasPoint(canvas, event);
      isDrawingRef.current = true;

      // beginPath()/moveTo() opens a fresh path at the click position so
      // this stroke doesn't connect back to wherever the last one ended.
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    },
    [canvasRef, enabled]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (!enabled || !isDrawingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const point = getCanvasPoint(canvas, event);

      // Brush settings are re-applied on every segment so color/size changes
      // take effect immediately, even mid-stroke.
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // lineTo() + stroke() draws just the segment from the last point to
      // this one, then beginPath()/moveTo() restarts the path from here.
      // Drawing segment-by-segment (instead of re-stroking one ever-growing
      // path) keeps movement smooth no matter how long the stroke gets.
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    },
    [canvasRef, color, brushSize, enabled]
  );

  const endStroke = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  return {
    handleMouseDown,
    handleMouseMove,
    // Mouse Up and Mouse Leave both simply end the current stroke, per spec.
    handleMouseUp: endStroke,
    handleMouseLeave: endStroke,
  };
}
