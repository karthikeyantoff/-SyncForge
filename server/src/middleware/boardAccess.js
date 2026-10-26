import { Board } from '../models/Board.js';
import { ApiError } from '../utils/ApiError.js';

export function assertMembership(board, userId) {
  const membership = board.membershipOf(userId);
  if (!membership) {
    throw new ApiError(403, 'You do not have access to this board');
  }
  return membership;
}

export async function loadBoard(req, _res, next) {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      throw new ApiError(404, 'Board not found');
    }

    req.board = board;
    req.membership = assertMembership(board, req.user._id);
    next();
  } catch (err) {
    if (err.name === 'CastError') return next(new ApiError(404, 'Board not found'));
    next(err);
  }
}

/**
 * Require a minimum role level on the board:
 * 'viewer': owner, member, viewer allowed (read-only)
 * 'member': owner and member allowed (mutations)
 * 'owner': owner only (administrative)
 */
export function requireRole(minRole) {
  return (req, _res, next) => {
    const userRole = req.membership?.role;
    if (!userRole) {
      return next(new ApiError(403, 'Access denied'));
    }

    if (minRole === 'viewer') {
      return next(); // Any valid member (owner, member, viewer) passes
    }

    if (minRole === 'member') {
      if (userRole === 'owner' || userRole === 'member') {
        return next();
      }
      return next(new ApiError(403, 'Viewers have read-only access to this board'));
    }

    if (minRole === 'owner') {
      if (userRole === 'owner') {
        return next();
      }
      return next(new ApiError(403, 'Requires board owner privileges'));
    }

    next();
  };
}
