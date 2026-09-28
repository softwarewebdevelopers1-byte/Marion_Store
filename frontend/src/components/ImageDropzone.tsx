import { useCallback, useId, useRef, useState } from "react";
import { Icons } from "./ui";
import {
  IMAGE_ACCEPT,
  IMAGE_MAX_COUNT,
  describeRejections,
  partitionImageFiles,
} from "../utils/imageUpload";

type Props = {
  onFiles: (files: File[]) => void | Promise<void>;
  multiple?: boolean;
  remaining?: number;
  uploading?: boolean;
  disabled?: boolean;
  label?: string;
  hint?: string;
  accept?: string;
  className?: string;
  id?: string;
};

/**
 * Drag-and-drop image picker. Handles both dropped files and click-to-browse,
 * highlights on drag enter/leave, and rejects unsupported files up front.
 */
export default function ImageDropzone({
  onFiles,
  multiple = true,
  remaining = IMAGE_MAX_COUNT,
  uploading = false,
  disabled = false,
  label = "Drop image files here or click to browse",
  hint,
  accept = IMAGE_ACCEPT,
  className = "",
  id,
}: Props) {
  const autoId = useId();
  const inputId = id ?? `dropzone-${autoId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [, setDepth] = useState(0);
  const [rejected, setRejected] = useState<string>("");

  const full = remaining <= 0;
  const blocked = disabled || uploading || full;

  const handle = useCallback(
    async (list: FileList | null | undefined) => {
      if (!list || blocked) return;
      const { accepted, rejected: bad } = partitionImageFiles(
        list,
        remaining,
      );
      setRejected(describeRejections(bad));
      if (accepted.length > 0) await onFiles(accepted);
    },
    [blocked, onFiles, remaining],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    setDepth(0);
    if (e.dataTransfer?.files?.length) void handle(e.dataTransfer.files);
  }

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (blocked) return;
    setDepth((d) => d + 1);
    setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDepth((d) => {
      const next = Math.max(0, d - 1);
      if (next === 0) setDragOver(false);
      return next;
    });
  }

  function onBrowse() {
    if (blocked) return;
    inputRef.current?.click();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onBrowse();
    }
  }

  const text = uploading
    ? "Uploading…"
    : full
      ? `Limit reached (${IMAGE_MAX_COUNT} images)`
      : label;

  return (
    <div className={`dropzone-wrap ${className}`.trim()}>
      <div
        role="button"
        tabIndex={blocked ? -1 : 0}
        aria-disabled={blocked}
        aria-label={text}
        className={`dropzone ${dragOver ? "drag-over" : ""} ${
          blocked ? "is-disabled" : ""
        }`}
        onClick={onBrowse}
        onKeyDown={onKeyDown}
        onDragEnter={onDragEnter}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = blocked ? "none" : "copy";
        }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="dropzone-icon">
          {uploading ? (
            <Icons.Arrow size={24} className="spin" />
          ) : (
            <Icons.Box size={24} />
          )}
        </div>
        <div className="small muted">{text}</div>
        {hint && <div className="tiny muted">{hint}</div>}
        {!uploading && !full && (
          <div className="tiny muted">
            JPEG, PNG or WebP · max 5 MB each
            {remaining > 1 && remaining !== IMAGE_MAX_COUNT
              ? ` · ${remaining} left`
              : ""}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        className="dropzone-input"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={blocked}
        onChange={(e) => {
          void handle(e.target.files);
          e.target.value = "";
        }}
      />
      {rejected && !dragOver && (
        <div className="field-error" style={{ marginTop: 6 }}>
          {rejected}
        </div>
      )}
    </div>
  );
}
