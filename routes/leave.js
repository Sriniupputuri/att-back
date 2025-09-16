import express from 'express';
import {
  getLeaves,
  createLeave,
  updateLeaveStatus,
} from '../controllers/leave.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getLeaves);
router.post('/', createLeave);
router.patch('/:id', authorize('owner', 'admin'), updateLeaveStatus);

export default router;