import { Router } from 'express';
import {
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember,
  updateMemberRole,
  getActivity,
} from '../controllers/boardController.js';
import { createList } from '../controllers/listController.js';
import { requireAuth } from '../middleware/auth.js';
import { loadBoard, requireRole } from '../middleware/boardAccess.js';

const router = Router();

router.use(requireAuth);

router.route('/')
  .get(listBoards)
  .post(createBoard);

router.route('/:boardId')
  .get(loadBoard, requireRole('viewer'), getBoard)
  .patch(loadBoard, requireRole('owner'), updateBoard)
  .delete(loadBoard, requireRole('owner'), deleteBoard);

// Member management
router.post('/:boardId/members', loadBoard, requireRole('owner'), addMember);
router.delete('/:boardId/members/:memberUserId', loadBoard, removeMember);
router.patch('/:boardId/members/:memberUserId', loadBoard, requireRole('owner'), updateMemberRole);

// Activity feed
router.get('/:boardId/activity', loadBoard, requireRole('viewer'), getActivity);

// Create list under board
router.post('/:boardId/lists', loadBoard, requireRole('member'), createList);

export default router;
