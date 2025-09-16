import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['sick', 'personal', 'emergency'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  attachment: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  comments: String
}, {
  timestamps: true
});

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;