import Attendance from '../models/Attendance.js';
import Worker from '../models/Worker.js';
import Work from '../models/Work.js';

export const getAllAttendanceByOwner = async (req, res) => {
  try {
    // Get all works owned by the user
    const works = await Work.find({ owner: req.user.userId });

    if (!works || works.length === 0) {
      return res.status(404).json({ message: 'No works found for this owner' });
    }

    // Extract work IDs
    const workIds = works.map(work => work._id);

    // Get all workers associated with the work IDs
    const workers = await Worker.find({ workId: { $in: workIds, owner: req.user.userId } });
    const workerIds = workers.map(worker => worker._id);

    // Find all attendance records for these workers
    const attendanceRecords = await Attendance.find({ workerId: { $in: workerIds } })
      .populate('workerId', 'name phoneNumber')
      .populate('markedBy', 'name');

    // Transform attendance data for the frontend
    const transformedAttendance = attendanceRecords.map(record => ({
      id: record._id,
      workerId: record.workerId._id,
      workerName: record.workerId.name,
      phoneNumber: record.workerId.phoneNumber,
      workId: record.workId,
      date: record.date,
      status: record.status,
      markedBy: record.markedBy?.name || 'System',
      markedAt: record.markedAt,
      method: record.method,
      location: record.location,
    }));

    res.status(200).json(transformedAttendance);
  } catch (error) {
    console.error('Get all attendance by owner error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const { workId, workerId, date } = req.query;
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
    if (date) query.date = date;

    const attendance = await Attendance.find(query)
      .populate('workerId', 'name phoneNumber')
      .populate('markedBy', 'name');

    // Transform attendance data to match frontend requirements
    const transformedAttendance = attendance.map(record => ({
      id: record._id,
      workerId: record.workerId._id,
      workerName: record.workerId.name,
      workId: record.workId,
      date: record.date,
      status: record.status,
      markedBy: record.markedBy?.name || 'System',
      markedAt: record.markedAt,
      method: record.method,
      location: record.location
    }));

    res.status(200).json(transformedAttendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Failed to get attendance' });
  }
};

export const markAttendance = async (req, res) => {
  console.log("Received request body:", req.body);

  try {
    const attendanceResults = [];

    // Loop through each attendance object in the request body
    for (const record of req.body) {
      const { workerId, workId, date, status, method, location } = record;
      console.log("Processing attendance for workerId:", workerId, "workId:", workId);

      // Verify the worker exists and belongs to the work
      const worker = await Worker.findOne({ _id: workerId, workId, ownerId: req.user.userId });
      if (!worker) {
        attendanceResults.push({
          workerId,
          success: false,
          message: 'Worker not found for this work'
        });
        continue; // Skip to the next record
      }

      // Verify work ownership
      const work = await Work.findOne({
        _id: workId,
        owner: req.user.userId
      });
      if (!work) {
        attendanceResults.push({
          workerId,
          success: false,
          message: 'Work not found'
        });
        continue; // Skip to the next record
      }

      // Check for existing attendance
      const existingAttendance = await Attendance.findOne({ workerId, date });
      if (existingAttendance) {
        attendanceResults.push({
          workerId,
          success: false,
          message: 'Attendance already marked for this date'
        });
        continue; // Skip to the next record
      }

      // Create and save the attendance record
      const attendance = new Attendance({
        workerId,
        workId,
        date,
        status,
        method,
        location,
        markedBy: req.user.userId,
        owner: req.user.userId
      });

      await attendance.save();
      await worker.updateStats();

      // Populate and transform the saved attendance data
      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('workerId', 'name phoneNumber')
        .populate('markedBy', 'name');

      const transformedAttendance = {
        id: populatedAttendance._id,
        workerId: populatedAttendance.workerId._id,
        workerName: populatedAttendance.workerId.name,
        workId: populatedAttendance.workId,
        date: populatedAttendance.date,
        status: populatedAttendance.status,
        markedBy: populatedAttendance.markedBy?.name || 'System',
        markedAt: populatedAttendance.markedAt,
        method: populatedAttendance.method,
        location: populatedAttendance.location
      };

      attendanceResults.push({
        workerId,
        success: true,
        attendance: transformedAttendance
      });
    }

    // Respond with the results for all processed records
    res.status(200).json(attendanceResults);
  } catch (error) {
    console.error('Error processing attendance:', error);
    res.status(500).json({ message: 'Failed to process attendance', error });
  }
};


export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Verify work ownership
    const work = await Work.findOne({
      _id: attendance.workId,
      owner: req.user.userId
    });

    if (!work) {
      return res.status(403).json({ message: 'Not authorized to update this attendance record' });
    }

    attendance.status = status;
    await attendance.save();

    const worker = await Worker.findById(attendance.workerId);
    if (worker) {
      await worker.updateStats();
    }

    // Return transformed attendance data
    const updatedAttendance = await Attendance.findById(id)
      .populate('workerId', 'name phoneNumber')
      .populate('markedBy', 'name');

    const transformedAttendance = {
      id: updatedAttendance._id,
      workerId: updatedAttendance.workerId._id,
      workerName: updatedAttendance.workerId.name,
      workId: updatedAttendance.workId,
      date: updatedAttendance.date,
      status: updatedAttendance.status,
      markedBy: updatedAttendance.markedBy?.name || 'System',
      markedAt: updatedAttendance.markedAt,
      method: updatedAttendance.method,
      location: updatedAttendance.location
    };

    res.status(200).json(transformedAttendance);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Failed to update attendance' });
  }
};