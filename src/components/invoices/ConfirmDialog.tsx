"use client";

import React, { useEffect, useRef, useState } from "react";
import { inputClass, labelClass } from "./types";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Shows an optional free-text reason field, passed to onConfirm. */
  reasonLabel?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/**
 * Native modal <dialog>: the browser handles focus containment, Esc / back
 * gesture, the inert page and returning focus to the button that opened it.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Keep it",
  reasonLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const handleClose = () => {
    const dialog = ref.current;
    const choice = dialog?.returnValue;
    // Esc sets no value and browsers differ on clearing the old one, so reset it
    if (dialog) dialog.returnValue = "";
    if (choice === "confirm") onConfirm(reason.trim());
    else onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="invoice-confirm-title"
      onClose={handleClose}
      // Click-outside dismissal where supported; Esc works everywhere
      {...{ closedby: "any" }}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-slate-300 bg-white p-0 shadow-2xl backdrop:bg-slate-950/50"
    >
      <form method="dialog" className="p-6 space-y-4">
        <h2 id="invoice-confirm-title" className="text-base font-bold text-slate-900">
          {title}
        </h2>
        <p className="text-xs font-semibold text-slate-600 leading-relaxed">{message}</p>

        {reasonLabel && (
          <div>
            <label htmlFor="invoice-confirm-reason" className={labelClass}>
              {reasonLabel}
            </label>
            <input
              id="invoice-confirm-reason"
              className={inputClass}
              value={reason}
              maxLength={300}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          {/* Focus starts on the safe choice */}
          <button
            value="cancel"
            autoFocus
            className="px-4 py-2.5 text-xs font-bold text-slate-700 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            value="confirm"
            className="px-4 py-2.5 text-xs font-bold text-white rounded-xl bg-rose-600 hover:bg-rose-700 cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
