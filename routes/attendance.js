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

// Normal attendance with filters (workId, workerId, date)
router.get('/', getAttendance);

// All attendance belonging ONLY to the owner
router.get('/owner', authorize('owner'), getAllAttendanceByOwner);

router.post('/', authorize('owner', 'admin'), markAttendance);
router.patch('/:id', authorize('owner', 'admin'), updateAttendance);

export default router;
