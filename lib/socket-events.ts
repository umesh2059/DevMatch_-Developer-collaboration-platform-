// Shared between the Socket.IO server (server.ts) and the browser client
// (components/teams/chat.tsx) so both sides agree on event names & payloads.

export type ChatMessagePayload = {
  id: string;
  teamId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
};

export type ClientToServerEvents = {
  "team:join": (teamId: string) => void;
  "chat:send": (payload: { teamId: string; content: string }) => void;
};

export type ServerToClientEvents = {
  "chat:message": (payload: ChatMessagePayload) => void;
  "chat:error": (message: string) => void;
};
