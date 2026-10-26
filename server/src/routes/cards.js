import { Router } from 'express';
import { updateCard, deleteCard } from '../controllers/cardController.js';
import { requireAuth } from '../middleware/auth.js';
import { loadCard } from '../middleware/resourceAccess.js';
import { requireRole } from '../middleware/boardAccess.js';

const router = Router();

router.use(requireAuth);

router.route('/:cardId')
  .patch(loadCard, requireRole('member'), updateCard)
  .delete(loadCard, requireRole('member'), deleteCard);

export default router;
