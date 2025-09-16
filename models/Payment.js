import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  workId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Work',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi'],
    required: true
  },
  notes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Update worker's pending amount after payment
paymentSchema.post('save', async function() {
  const Worker = mongoose.model('Worker');
  const worker = await Worker.findById(this.workerId);
  if (worker) {
    await worker.updateStats();
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;