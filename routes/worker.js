import express from 'express';
import {
  getWorkers,
  createWorker,
  getWorkerById,
  getAllWorkersByOwner,
  deleteWorker,
  updateWorker,
} from '../controllers/worker.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getWorkers);
router.post('/add', authorize('owner', 'admin'), createWorker);
router.post('/:id', authorize('owner', 'admin'), updateWorker);
router.delete('/', authorize('owner', 'admin'), deleteWorker);
router.get('/', authorize('owner'), getAllWorkersByOwner);
router.get('/:id', getWorkerById);
// router.patch('/:id', authorize('owner', 'admin'), updateWorker);

export default router;