import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import workRoutes from './routes/work.js';
import workerRoutes from './routes/worker.js';
import attendanceRoutes from './routes/attendance.js';
import leaveRoutes from './routes/leave.js';
import paymentRoutes from './routes/payment.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50000 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/works', workRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payments', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong!';
  res.status(statusCode).json({ message });
});

// Connect to MongoDB
console.log("process.env.MONGODB_URI", process.env.MONGODB_URI)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });