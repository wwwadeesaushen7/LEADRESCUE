"use client";
import { useEffect, useId, useRef } from "react";
import { ZodError } from "zod";
import { X } from "lucide-react";
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className="workspace-dialog card"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const box = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            onClose();
        }
      }}
    >
      <div className="section-heading">
        <h2 id={id}>{title}</h2>
        <button
          className="icon-button"
          type="button"
          aria-label="Close details"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function FormError({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="notice error">
      {error}
    </p>
  ) : null;
}
export function errorText(error: unknown) {
  if (error instanceof ZodError) return error.issues[0].message;
  return error instanceof Error
    ? error.message
    : "Could not save. Please try again.";
}
