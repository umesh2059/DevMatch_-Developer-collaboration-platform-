// Custom server: wraps Next.js' request handler and attaches a Socket.IO
// server for real-time team chat. See IMPLEMENTATION.md for why this exists
// (Route Handlers can't hold a persistent WebSocket connection).
import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { decryptSession, SESSION_COOKIE } from "./lib/session-crypto";
import { prisma } from "./lib/prisma";
import { requireTeamMembership } from "./lib/teams";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./lib/socket-events";

const port = Number.parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

function parseCookieHeader(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const pair of header.split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (!key) continue;
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: "/socket.io",
  });

  io.on("connection", async (socket) => {
    const cookies = parseCookieHeader(socket.handshake.headers.cookie);
    const session = await decryptSession(cookies[SESSION_COOKIE]);

    if (!session?.userId) {
      socket.emit("chat:error", "Not authenticated.");
      socket.disconnect(true);
      return;
    }
    const userId = session.userId;

    socket.on("team:join", async (teamId) => {
      try {
        await requireTeamMembership(teamId, userId);
        socket.join(`team:${teamId}`);
      } catch {
        socket.emit("chat:error", "You are not a member of this team.");
      }
    });

    socket.on("chat:send", async ({ teamId, content }) => {
      const trimmed = content.trim().slice(0, 2000);
      if (!trimmed) return;

      try {
        await requireTeamMembership(teamId, userId);
      } catch {
        socket.emit("chat:error", "You are not a member of this team.");
        return;
      }

      const message = await prisma.message.create({
        data: { teamId, senderId: userId, content: trimmed },
        include: { sender: { select: { id: true, name: true } } },
      });

      io.to(`team:${teamId}`).emit("chat:message", {
        id: message.id,
        teamId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
      });
    });
  });

  httpServer.listen(port, () => {
    console.log(`> DevMatch ready on http://localhost:${port} (${dev ? "development" : "production"})`);
  });
});
