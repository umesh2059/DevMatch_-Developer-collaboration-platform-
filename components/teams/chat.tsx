"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ChatMessagePayload,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/socket-events";
import { reportMessageAction } from "@/app/actions/reports";

type Props = {
  teamId: string;
  currentUserId: string;
  initialMessages: ChatMessagePayload[];
};

export function Chat({ teamId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<ChatMessagePayload[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const [isReporting, startReportTransition] = useTransition();

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: "/socket.io",
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("team:join", teamId);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("chat:message", (message) => {
      setMessages((prev) => [...prev, message]);
    });
    socket.on("chat:error", (message) => setError(message));

    return () => {
      socket.disconnect();
    };
  }, [teamId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function send() {
    const content = draft.trim();
    if (!content || !socketRef.current) return;
    socketRef.current.emit("chat:send", { teamId, content });
    setDraft("");
  }

  function submitReport(messageId: string) {
    if (reportReason.trim().length < 3) return;
    startReportTransition(async () => {
      const result = await reportMessageAction(messageId, reportReason);
      setReportNotice(result.error ?? result.message ?? null);
      setReportingId(null);
      setReportReason("");
    });
  }

  return (
    <div className="card flex h-[28rem] flex-col p-0">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <span className="text-sm font-medium">Team chat</span>
        <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-zinc-400"}`} />
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500">No messages yet. Say hello.</p>
        )}
        {messages.map((m) => {
          const isOwn = m.sender.id === currentUserId;
          return (
            <div key={m.id} className={isOwn ? "text-right" : ""}>
              <p className="text-xs text-zinc-500">
                {isOwn ? "You" : m.sender.name}
                {!isOwn && (
                  <button
                    type="button"
                    onClick={() => setReportingId(reportingId === m.id ? null : m.id)}
                    className="ml-2 text-zinc-400 hover:text-red-500"
                  >
                    Report
                  </button>
                )}
              </p>
              <p className="inline-block max-w-[85%] rounded-md bg-zinc-100 px-3 py-1.5 text-sm dark:bg-zinc-800">
                {m.content}
              </p>
              {reportingId === m.id && (
                <div className="mt-1 flex flex-col items-end gap-1.5">
                  <input
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Why report this message?"
                    className="input !py-1 text-xs"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={isReporting || reportReason.trim().length < 3}
                      onClick={() => submitReport(m.id)}
                      className="btn-secondary !px-2 !py-1 text-xs text-red-600"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportingId(null)}
                      className="btn-secondary !px-2 !py-1 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reportNotice && <p className="px-4 text-xs text-zinc-500">{reportNotice}</p>}
      {error && <p className="px-4 text-xs text-red-600">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="input"
          placeholder="Message your team..."
        />
        <button type="submit" className="btn-primary !px-3">
          Send
        </button>
      </form>
    </div>
  );
}
