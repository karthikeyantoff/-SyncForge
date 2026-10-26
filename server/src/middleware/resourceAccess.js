import { Board } from '../models/Board.js';
import { List } from '../models/List.js';
import { Card } from '../models/Card.js';
import { ApiError } from '../utils/ApiError.js';
import { assertMembership } from './boardAccess.js';

export async function loadList(req, _res, next) {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) throw new ApiError(404, 'List not found');

    const board = await Board.findById(list.board);
    if (!board) throw new ApiError(404, 'Board not found');

    req.list = list;
    req.board = board;
    req.membership = assertMembership(board, req.user._id);
    next();
  } catch (err) {
    if (err.name === 'CastError') return next(new ApiError(404, 'List not found'));
    next(err);
  }
}

export async function loadCard(req, _res, next) {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) throw new ApiError(404, 'Card not found');

    const board = await Board.findById(card.board);
    if (!board) throw new ApiError(404, 'Board not found');

    req.card = card;
    req.board = board;
    req.membership = assertMembership(board, req.user._id);
    next();
  } catch (err) {
    if (err.name === 'CastError') return next(new ApiError(404, 'Card not found'));
    next(err);
  }
}
