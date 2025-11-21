import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Change the model name if needed
    required: true
  },
  workId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Work',
    required: true
  },
  dailyWage: {
    type: Number,
    required: true,
    min: 0
  },
  profileImage: String,
  totalDaysWorked: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update worker stats after attendance
workerSchema.methods.updateStats = async function() {
  const Attendance = mongoose.model('Attendance');

  const attendanceCount = await Attendance.countDocuments({
    workerId: this._id,
    status: 'present'
  });

  const halfDayCount = await Attendance.countDocuments({
    workerId: this._id,
    status: 'half-day'
  });

  this.totalDaysWorked = attendanceCount + (halfDayCount * 0.5);
  this.totalEarnings = (this.totalDaysWorked * this.dailyWage);

  const Payment = mongoose.model('Payment');
  const totalPaid = await Payment.aggregate([
    { $match: { workerId: this._id } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  this.pendingAmount = this.totalEarnings - (totalPaid[0]?.total || 0);

  await this.save();
};

const Worker = mongoose.model('Worker', workerSchema);

export default Worker;
