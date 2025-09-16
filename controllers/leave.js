import Leave from '../models/Leave.js';
import Worker from '../models/Worker.js';

export const getLeaves = async (req, res) => {
  try {
    const { workerId, status } = req.query;
    const query = {};

    if (workerId) query.workerId = workerId;
    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate('workerId', 'userId')
      .populate('reviewedBy', 'name');

    res.status(200).json(leaves);
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ message: 'Failed to get leaves' });
  }
};

export const createLeave = async (req, res) => {
  try {
    const { workerId, startDate, endDate, type, reason, attachment } = req.body;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const leave = new Leave({
      workerId,
      startDate,
      endDate,
      type,
      reason,
      attachment,
    });

    await leave.save();
    res.status(201).json(leave);
  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({ message: 'Failed to create leave' });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { status, comments } = req.body;

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          comments,
          reviewedBy: req.user.userId,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    res.status(200).json(leave);
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ message: 'Failed to update leave status' });
  }
};