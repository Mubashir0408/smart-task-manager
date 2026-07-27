"use client";

import { useRef, type ChangeEvent } from "react";
import { Button } from "../ui/Button";
import { ACCEPTED_IMAGE_TYPES } from "@/utils/image";

interface AnnotationToolbarProps {
  color: string;
  brushSize: number;
  hasImage: boolean;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onDownload: () => void;
  onUpload: (file: File | undefined) => void;
}

export function AnnotationToolbar({
  color,
  brushSize,
  hasImage,
  onColorChange,
  onBrushSizeChange,
  onClear,
  onDownload,
  onUpload,
}: AnnotationToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onUpload(event.target.files?.[0]);
    // Reset the input so selecting the same file again still fires onChange.
    event.target.value = "";
  };

  return (
    <div className="glass-panel flex flex-wrap items-end gap-4 rounded-2xl p-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="brush-color" className="text-sm font-medium text-slate-300">
          Color
        </label>
        <input
          id="brush-color"
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-white/15 p-1"
          aria-label="Brush color"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="brush-size" className="text-sm font-medium text-slate-300">
          Brush size: {brushSize}px
        </label>
        <input
          id="brush-size"
          type="range"
          min={1}
          max={50}
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="w-40 accent-cyan-400"
          aria-label="Brush size"
        />
      </div>

      <div className="ml-auto flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onClear} disabled={!hasImage}>
          Clear
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onDownload} disabled={!hasImage}>
          Download
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          {hasImage ? "Upload new image" : "Upload image"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
