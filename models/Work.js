import mongoose from 'mongoose';

const workSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'pending'],
    default: 'active'
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total workers
workSchema.virtual('totalWorkers', {
  ref: 'Worker',
  localField: '_id',
  foreignField: 'workId',
  count: true
});

const Work = mongoose.model('Work', workSchema);

export default Work;