"use client";

import { useTransition } from "react";
import { respondToRequestAction } from "@/app/actions/projects";

export function RespondButtons({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => respondToRequestAction(requestId, "ACCEPTED"))}
        className="btn-primary !px-3 !py-1.5"
      >
        Accept
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => respondToRequestAction(requestId, "DECLINED"))}
        className="btn-secondary !px-3 !py-1.5"
      >
        Decline
      </button>
    </div>
  );
}
