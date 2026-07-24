"use client";

import { useSignaturePad } from "@/hooks/useSignaturePad";
import { Button } from "./Button";

/**
 * Generic, reusable signature pad. Knows nothing about tasks — it's a plain
 * canvas UI primitive (like Button or Modal) that any feature can drop in.
 * Currently used inside the task edit form.
 */
export function SignaturePad() {
  const {
    containerRef,
    canvasRef,
    hasSignature,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    clear,
    download,
  } = useSignaturePad();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Signature</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={clear}
            disabled={!hasSignature}
          >
            Clear Signature
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={download}
            disabled={!hasSignature}
          >
            Download PNG
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="w-full">
        <canvas
          ref={canvasRef}
          className="w-full touch-none rounded-lg border border-slate-300 bg-white shadow-sm"
          style={{ cursor: "crosshair" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      <p className="text-xs text-slate-400">
        Sign above with your mouse. Kept in your browser only — not saved with the task.
      </p>
    </div>
  );
}
