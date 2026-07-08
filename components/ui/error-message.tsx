import { X } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

export function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  return (
    <div className="mb-4 p-4 rounded-lg flex items-start justify-between gap-3" style={{ backgroundColor: "var(--color-error-bg)", border: "1px solid var(--color-error)" }}>
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "var(--color-error)" }}>
          <span className="text-white text-xs font-bold">!</span>
        </div>
        <p className="text-sm" style={{ color: "var(--color-error)" }}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0"
        style={{ color: "var(--color-error)" }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
