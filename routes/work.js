import express from 'express';
import {
  getWorks,
  createWork,
  getWorkById,
  updateWork,
} from '../controllers/work.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getWorks);
router.post('/', authorize('owner', 'admin'), createWork);
router.get('/:id', getWorkById);
router.patch('/:id', authorize('owner', 'admin'), updateWork);

export default router;