import { Card } from '../models/Card.js';
import { List } from '../models/List.js';
import { ApiError } from '../utils/ApiError.js';
import { appendPosition, between } from '../utils/position.js';
import { emitToBoard } from '../utils/emit.js';
import { logActivity } from '../utils/activity.js';

export async function createCard(req, res, next) {
  try {
    const { title, description, assignee, priority, labels, dueDate } = req.body || {};
    if (!title || !String(title).trim()) {
      throw new ApiError(400, 'Card title is required');
    }

    const last = await Card.findOne({ list: req.list._id }).sort({ position: -1 });
    const card = await Card.create({
      board: req.board._id,
      list: req.list._id,
      title: String(title).trim(),
      description: description ? String(description) : '',
      position: appendPosition(last?.position),
      createdBy: req.user._id,
      assignee: assignee || null,
      priority: priority || 'medium',
      labels: Array.isArray(labels) ? labels : [],
      dueDate: dueDate ? new Date(dueDate) : null,
      version: 0,
    });

    await card.populate('assignee', 'name email avatar');
    await card.populate('createdBy', 'name email avatar');

    emitToBoard(req, req.board._id, 'card:created', { card });
    await logActivity(
      req,
      req.board._id,
      'card.created',
      `added “${card.title}” to ${req.list.title}`
    );

    res.status(201).json({ success: true, card });
  } catch (err) {
    next(err);
  }
}

export async function updateCard(req, res, next) {
  try {
    const {
      title,
      description,
      list,
      position,
      before,
      after,
      version,
      assignee,
      priority,
      labels,
      dueDate,
    } = req.body || {};

    // Optimistic Concurrency Control (OCC) Check
    if (version !== undefined && Number(version) !== req.card.version) {
      await req.card.populate('assignee', 'name email avatar');
      await req.card.populate('createdBy', 'name email avatar');
      return res.status(409).json({
        success: false,
        error: 'This card was modified by another collaborator',
        card: req.card,
      });
    }

    let contentEdited = false;
    let movedToTitle = null;

    if (title !== undefined) {
      if (!String(title).trim()) throw new ApiError(400, 'Card title cannot be empty');
      req.card.title = String(title).trim();
      contentEdited = true;
    }

    if (description !== undefined) {
      req.card.description = String(description);
      contentEdited = true;
    }

    if (priority !== undefined) {
      req.card.priority = priority;
      contentEdited = true;
    }

    if (labels !== undefined) {
      req.card.labels = Array.isArray(labels) ? labels : [];
      contentEdited = true;
    }

    if (dueDate !== undefined) {
      req.card.dueDate = dueDate ? new Date(dueDate) : null;
      contentEdited = true;
    }

    if (assignee !== undefined) {
      req.card.assignee = assignee || null;
      contentEdited = true;
    }

    // Move to a different list on the same board
    if (list !== undefined && String(list) !== String(req.card.list)) {
      const targetList = await List.findOne({ _id: list, board: req.board._id });
      if (!targetList) throw new ApiError(400, 'Target list is not on this board');
      req.card.list = targetList._id;
      movedToTitle = targetList.title;
    }

    // Reorder position
    if (position !== undefined) {
      req.card.position = Number(position);
    } else if (before !== undefined || after !== undefined) {
      req.card.position = between(before ?? null, after ?? null);
    }

    // Bump monotonic version counter on mutation
    req.card.version += 1;
    await req.card.save();

    await req.card.populate('assignee', 'name email avatar');
    await req.card.populate('createdBy', 'name email avatar');

    emitToBoard(req, req.board._id, 'card:updated', { card: req.card });

    if (movedToTitle) {
      await logActivity(
        req,
        req.board._id,
        'card.moved',
        `moved “${req.card.title}” to ${movedToTitle}`
      );
    } else if (contentEdited) {
      await logActivity(req, req.board._id, 'card.edited', `edited “${req.card.title}”`);
    }

    res.json({ success: true, card: req.card });
  } catch (err) {
    next(err);
  }
}

export async function deleteCard(req, res, next) {
  try {
    const cardId = String(req.card._id);
    const listId = String(req.card.list);
    const cardTitle = req.card.title;

    await req.card.deleteOne();

    emitToBoard(req, req.board._id, 'card:deleted', { cardId, listId });
    await logActivity(req, req.board._id, 'card.deleted', `deleted “${cardTitle}”`);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
