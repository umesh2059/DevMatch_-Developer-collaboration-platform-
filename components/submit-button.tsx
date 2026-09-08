"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";

type Props = ComponentProps<"button"> & {
  pendingLabel?: string;
};

export function SubmitButton({ children, pendingLabel, className, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} {...props}>
      {pending ? pendingLabel ?? "Saving..." : children}
    </button>
  );
}
