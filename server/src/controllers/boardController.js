import mongoose from 'mongoose';
import { Board, BOARD_ROLES } from '../models/Board.js';
import { User } from '../models/User.js';
import { List } from '../models/List.js';
import { Card } from '../models/Card.js';
import { Activity } from '../models/Activity.js';
import { ApiError } from '../utils/ApiError.js';
import { logActivity } from '../utils/activity.js';
import { emitToBoard } from '../utils/emit.js';

export async function listBoards(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const filter = { 'members.user': req.user._id };

    const [boards, total] = await Promise.all([
      Board.find(filter)
        .sort({ updatedAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar'),
      Board.countDocuments(filter),
    ]);

    const nextOffset = offset + boards.length < total ? offset + boards.length : null;
    res.json({ success: true, boards, total, limit, offset, nextOffset });
  } catch (err) {
    next(err);
  }
}

export async function createBoard(req, res, next) {
  try {
    const { title, description, template = true } = req.body || {};
    if (!title || !String(title).trim()) {
      throw new ApiError(400, 'Board title is required');
    }

    const board = await Board.create({
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    // Auto-create standard Kanban columns if requested
    if (template) {
      const defaultLists = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];
      await List.insertMany(
        defaultLists.map((name, idx) => ({
          board: board._id,
          title: name,
          position: (idx + 1) * 1000,
        }))
      );
    }

    await board.populate('owner', 'name email avatar');
    await board.populate('members.user', 'name email avatar');

    await logActivity(req, board._id, 'board.created', `created board “${board.title}”`);
    res.status(201).json({ success: true, board });
  } catch (err) {
    next(err);
  }
}

export async function getBoard(req, res, next) {
  try {
    await req.board.populate('owner', 'name email avatar');
    await req.board.populate('members.user', 'name email avatar');

    const [lists, cards] = await Promise.all([
      List.find({ board: req.board._id }).sort({ position: 1 }),
      Card.find({ board: req.board._id })
        .sort({ position: 1 })
        .populate('assignee', 'name email avatar')
        .populate('createdBy', 'name email avatar'),
    ]);

    res.json({
      success: true,
      board: req.board,
      membership: req.membership,
      lists,
      cards,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateBoard(req, res, next) {
  try {
    const { title, description } = req.body || {};
    if (title !== undefined) {
      if (!String(title).trim()) throw new ApiError(400, 'Board title cannot be empty');
      req.board.title = String(title).trim();
    }
    if (description !== undefined) {
      req.board.description = String(description).trim();
    }

    await req.board.save();
    await req.board.populate('owner', 'name email avatar');
    await req.board.populate('members.user', 'name email avatar');

    emitToBoard(req, req.board._id, 'board:updated', { board: req.board });
    await logActivity(req, req.board._id, 'board.updated', `updated board details`);

    res.json({ success: true, board: req.board });
  } catch (err) {
    next(err);
  }
}

export async function deleteBoard(req, res, next) {
  const boardId = req.board._id;
  const wipe = (opts = {}) =>
    Promise.all([
      Card.deleteMany({ board: boardId }, opts),
      List.deleteMany({ board: boardId }, opts),
      Activity.deleteMany({ board: boardId }, opts),
      Board.deleteOne({ _id: boardId }, opts),
    ]);

  try {
    emitToBoard(req, boardId, 'board:deleted', { boardId: String(boardId) });

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(() => wipe({ session }));
    } finally {
      await session.endSession();
    }
    return res.status(204).end();
  } catch (err) {
    // Fall back to sequential deletes for standalone MongoDB instances without replica sets
    if (isTransactionUnsupported(err)) {
      await wipe();
      return res.status(204).end();
    }
    next(err);
  }
}

function isTransactionUnsupported(err) {
  const msg = String(err?.message || '');
  return (
    err?.code === 20 ||
    err?.codeName === 'IllegalOperation' ||
    /Transaction numbers are only allowed on a replica set/i.test(msg) ||
    /Transactions are not supported/i.test(msg) ||
    /replica set/i.test(msg)
  );
}

export async function addMember(req, res, next) {
  try {
    const { email, role = 'member' } = req.body || {};
    if (!email) throw new ApiError(400, 'Email is required');
    if (!BOARD_ROLES.includes(role)) {
      throw new ApiError(400, `Role must be one of: ${BOARD_ROLES.join(', ')}`);
    }

    const targetUser = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!targetUser) throw new ApiError(404, 'No registered user found with that email');

    if (req.board.membershipOf(targetUser._id)) {
      throw new ApiError(409, 'User is already a member of this board');
    }

    req.board.members.push({ user: targetUser._id, role });
    await req.board.save();

    await req.board.populate('members.user', 'name email avatar');
    const newMembership = req.board.members.find(
      (m) => String(m.user?._id || m.user) === String(targetUser._id)
    );

    emitToBoard(req, req.board._id, 'member:added', {
      member: newMembership,
      boardId: req.board._id,
    });
    await logActivity(
      req,
      req.board._id,
      'member.added',
      `added ${targetUser.name} (${targetUser.email}) as ${role}`
    );

    res.status(201).json({ success: true, member: newMembership, board: req.board });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req, res, next) {
  try {
    const { memberUserId } = req.params;
    const isSelfLeaving = String(req.user._id) === String(memberUserId);
    const isOwner = req.membership.role === 'owner';

    if (!isSelfLeaving && !isOwner) {
      throw new ApiError(403, 'Only board owners can remove members');
    }

    if (String(req.board.owner) === String(memberUserId)) {
      throw new ApiError(400, 'Board owner cannot be removed from the board');
    }

    const existingIndex = req.board.members.findIndex(
      (m) => String(m.user?._id || m.user) === String(memberUserId)
    );

    if (existingIndex === -1) {
      throw new ApiError(404, 'Member not found on this board');
    }

    const removed = req.board.members.splice(existingIndex, 1)[0];
    await req.board.save();

    emitToBoard(req, req.board._id, 'member:removed', {
      memberUserId,
      boardId: req.board._id,
    });
    await logActivity(
      req,
      req.board._id,
      'member.removed',
      isSelfLeaving ? `${req.user.name} left the board` : `removed a member from the board`
    );

    res.json({ success: true, message: 'Member removed successfully', board: req.board });
  } catch (err) {
    next(err);
  }
}

export async function updateMemberRole(req, res, next) {
  try {
    const { memberUserId } = req.params;
    const { role } = req.body;

    if (!BOARD_ROLES.includes(role)) {
      throw new ApiError(400, `Role must be one of: ${BOARD_ROLES.join(', ')}`);
    }

    if (String(req.board.owner) === String(memberUserId)) {
      throw new ApiError(400, 'Cannot change role of board owner');
    }

    const member = req.board.members.find(
      (m) => String(m.user?._id || m.user) === String(memberUserId)
    );
    if (!member) {
      throw new ApiError(404, 'Member not found on this board');
    }

    member.role = role;
    await req.board.save();
    await req.board.populate('members.user', 'name email avatar');

    emitToBoard(req, req.board._id, 'member:updated', {
      memberUserId,
      role,
      boardId: req.board._id,
    });
    await logActivity(req, req.board._id, 'member.roleChanged', `changed member role to ${role}`);

    res.json({ success: true, board: req.board });
  } catch (err) {
    next(err);
  }
}

export async function getActivity(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const query = { board: req.board._id };

    const { cursor } = req.query;
    if (cursor && mongoose.isValidObjectId(cursor)) {
      query._id = { $lt: cursor };
    }

    const rows = await Activity.find(query).sort({ _id: -1 }).limit(limit + 1);
    const hasMore = rows.length > limit;
    const activities = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? activities[activities.length - 1]._id : null;

    res.json({ success: true, activities, nextCursor });
  } catch (err) {
    next(err);
  }
}
