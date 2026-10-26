import { Activity } from '../models/Activity.js';
import { emitToBoard } from './emit.js';

export async function logActivity(req, boardId, type, text) {
  try {
    const activity = await Activity.create({
      board: boardId,
      actor: req.user._id,
      actorName: req.user.name,
      type,
      text,
    });
    emitToBoard(req, boardId, 'activity:created', { activity });
    return activity;
  } catch (err) {
    // Non-fatal: do not block the primary operation if activity logging encounters an issue
    console.error('[Activity Log Error]', err.message);
  }
}
