import express from 'express';
import {
  getAllAttendanceByOwner,
  getAttendance,
  markAttendance,
  updateAttendance,
} from '../controllers/attendance.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getAttendance);
router.get('/', authorize('owner'), getAllAttendanceByOwner);
router.post('/', authorize('owner', 'admin'), markAttendance);
router.patch('/:id', authorize('owner', 'admin'), updateAttendance);

export default router;