import Payment from '../models/Payment.js';
import Worker from '../models/Worker.js';
import Work from '../models/Work.js';

export const getPayments = async (req, res) => {
  try {
    const { workerId, workId } = req.query;
    const query = {};

    if (workId) {
      const work = await Work.findOne({
        _id: workId,
        owner: req.user.userId
      });

      if (!work) {
        return res.status(404).json({ message: 'Work not found' });
      }

      query.workId = workId;
    }

    if (workerId) query.workerId = workerId;

    const payments = await Payment.find(query)
      .populate("workerId", "name phone profileImage userId")   // ⬅ NEW
      .populate("processedBy", "name");

    res.status(200).json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Failed to get payments' });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { workerId, workId, amount, paymentMode, notes } = req.body;

    const work = await Work.findOne({
      _id: workId,
      owner: req.user.userId
    });

    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    if (amount > worker.pendingAmount) {
      return res.status(400).json({
        message: 'Payment amount cannot exceed pending amount',
      });
    }

    const payment = new Payment({
      workerId,
      workId,
      amount,
      date: new Date(),
      paymentMode,
      notes,
      processedBy: req.user.userId,
    });

    await payment.save();
    await worker.updateStats();

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Failed to create payment' });
  }
};