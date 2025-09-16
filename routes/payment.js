import express from 'express';
import { getPayments, createPayment } from '../controllers/payment.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getPayments);
router.post('/', authorize('owner', 'admin'), createPayment);

export default router;