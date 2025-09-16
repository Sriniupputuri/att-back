import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day'],
    required: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['manual', 'qr', 'location'],
    default: 'manual'
  },
  location: {
    latitude: Number,
    longitude: Number
  }
}, {
  timestamps: true
});

// Ensure only one attendance record per worker per day
attendanceSchema.index({ workerId: 1, date: 1 }, { unique: true });

// Update worker stats after attendance is marked
attendanceSchema.post('save', async function() {
  const Worker = mongoose.model('Worker');
  const worker = await Worker.findById(this.workerId);
  if (worker) {
    await worker.updateStats();
  }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;