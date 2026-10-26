import { Router } from 'express';
import { updateList, deleteList } from '../controllers/listController.js';
import { createCard } from '../controllers/cardController.js';
import { requireAuth } from '../middleware/auth.js';
import { loadList } from '../middleware/resourceAccess.js';
import { requireRole } from '../middleware/boardAccess.js';

const router = Router();

router.use(requireAuth);

router.route('/:listId')
  .patch(loadList, requireRole('member'), updateList)
  .delete(loadList, requireRole('member'), deleteList);

// Create card inside list
router.post('/:listId/cards', loadList, requireRole('member'), createCard);

export default router;
