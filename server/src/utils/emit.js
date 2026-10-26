import { boardRoom } from '../sockets/index.js';

export function emitToBoard(req, boardId, event, payload) {
  const io = req.app.get('io');
  if (!io) return;
  io.to(boardRoom(boardId)).emit(event, payload);
}
