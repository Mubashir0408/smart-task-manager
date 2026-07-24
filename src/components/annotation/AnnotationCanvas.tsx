"use client";

import type { MouseEvent, RefObject } from "react";
import { cn } from "@/utils/cn";

interface AnnotationCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
  imageCanvasRef: RefObject<HTMLCanvasElement | null>;
  drawCanvasRef: RefObject<HTMLCanvasElement | null>;
  hasImage: boolean;
  isLoading: boolean;
  size: { width: number; height: number } | null;
  onMouseDown: (event: MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (event: MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

export function AnnotationCanvas({
  containerRef,
  imageCanvasRef,
  drawCanvasRef,
  hasImage,
  isLoading,
  size,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
}: AnnotationCanvasProps) {
  return (
    <div
      ref={containerRef}
      className="flex min-h-80 w-full items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-4"
    >
      {!hasImage && (
        <p className="text-sm text-slate-500">
          {isLoading ? "Loading image…" : "Upload an image to start annotating."}
        </p>
      )}
      {/*
        Two stacked canvases of identical size:
          1. imageCanvasRef — the uploaded image, redrawn only on
             upload/resize.
          2. drawCanvasRef — a transparent layer the user draws on.
        Keeping annotations on their own layer means "Clear" can wipe the
        drawing without ever touching the image underneath.
      */}
      <div
        className="relative"
        style={size ? { width: size.width, height: size.height } : undefined}
      >
        <canvas
          ref={imageCanvasRef}
          className={cn("absolute left-0 top-0 rounded-lg", !hasImage && "hidden")}
        />
        <canvas
          ref={drawCanvasRef}
          className={cn(
            "absolute left-0 top-0 rounded-lg",
            !hasImage && "hidden",
            hasImage && "cursor-crosshair"
          )}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />
      </div>
    </div>
  );
}
