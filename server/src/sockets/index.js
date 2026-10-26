import { verifyToken, TOKEN_COOKIE } from '../utils/token.js';
import { Board } from '../models/Board.js';

export const boardRoom = (boardId) => `board:${boardId}`;

function tokenFromHandshake(socket) {
  // Check auth object from socket client
  const fromAuth = socket.handshake.auth?.token;
  if (fromAuth) return fromAuth;

  // Check HTTP-only cookie
  const cookieHeader = socket.handshake.headers?.cookie || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${TOKEN_COOKIE}=`));

  return match ? decodeURIComponent(match.slice(TOKEN_COOKIE.length + 1)) : null;
}

export function registerSockets(io) {
  // Handshake authentication middleware
  io.use((socket, next) => {
    const token = tokenFromHandshake(socket);
    if (!token) {
      return next(new Error('Authentication required for real-time connection'));
    }

    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid or expired real-time authentication token'));
    }
  });

  io.on('connection', (socket) => {
    // Join board room with authorization check
    socket.on('board:join', async (boardId, ack) => {
      try {
        const board = await Board.findById(boardId);
        if (!board || !board.membershipOf(socket.userId)) {
          if (ack) ack({ ok: false, error: 'Unauthorized access to board room' });
          return;
        }

        socket.join(boardRoom(boardId));
        if (ack) ack({ ok: true, room: boardRoom(boardId) });
      } catch (err) {
        if (ack) ack({ ok: false, error: 'Failed to join board room' });
      }
    });

    socket.on('board:leave', (boardId) => {
      socket.leave(boardRoom(boardId));
    });
  });
}
