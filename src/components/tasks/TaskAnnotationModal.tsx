"use client";

import { Modal } from "../ui/Modal";
import { AnnotationToolbar } from "../annotation/AnnotationToolbar";
import { AnnotationCanvas } from "../annotation/AnnotationCanvas";
import { useAnnotationCanvas } from "@/hooks/useAnnotationCanvas";
import type { Task } from "@/types/task";

interface TaskAnnotationModalProps {
  task: Task;
  onClose: () => void;
}

/**
 * Per-task image annotation tool. Mounted only while open (see TasksPage /
 * DashboardPage, which render this conditionally on `annotatingTask`), so a
 * fresh useAnnotationCanvas instance — and therefore a blank canvas — is
 * guaranteed every time it's opened for a task, rather than carrying over
 * whatever was drawn for a previously annotated task.
 *
 * The uploaded image and any strokes never leave the browser: nothing here
 * touches Supabase, and no task field is read or written by this component.
 */
export function TaskAnnotationModal({ task, onClose }: TaskAnnotationModalProps) {
  const {
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
  } = useAnnotationCanvas();

  return (
    <Modal
      open
      onClose={onClose}
      title={`Annotate image — ${task.title}`}
      maxWidthClassName="max-w-4xl"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-400">
          Upload a screenshot or reference image for this task and draw directly on top of it.
          The image stays in your browser for this session only — it is not saved to the task or
          uploaded anywhere.
        </p>

        <AnnotationToolbar
          color={color}
          brushSize={brushSize}
          hasImage={hasImage}
          onColorChange={setColor}
          onBrushSizeChange={setBrushSize}
          onClear={clearAnnotations}
          onDownload={downloadImage}
          onUpload={loadImage}
        />

        <AnnotationCanvas
          containerRef={containerRef}
          imageCanvasRef={imageCanvasRef}
          drawCanvasRef={drawCanvasRef}
          hasImage={hasImage}
          isLoading={isLoading}
          size={size}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </Modal>
  );
}
