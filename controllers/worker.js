import Worker from '../models/Worker.js';
import Work from '../models/Work.js';

export const getAllWorkersByOwner = async (req, res) => {
  try {
    // Get all works owned by the user
    const works = await Work.find({ owner: req.user.userId });

    if (!works || works.length === 0) {
      return res.status(404).json({ message: 'No works found for this owner' });
    }

    // Extract work IDs
    const workIds = works.map(work => work._id);

    // Find all workers associated with the work IDs
    const workers = await Worker.find({ workId: { $in: workIds } });

    // Transform the data to match frontend requirements
    const transformedWorkers = workers.map(worker => ({
      id: worker._id,
      name: worker.name,
      phoneNumber: worker.phoneNumber,
      profileImage: worker.profileImage,
      workId: worker.workId,
      dailyWage: worker.dailyWage,
      totalDaysWorked: worker.totalDaysWorked,
      totalEarnings: worker.totalEarnings,
      pendingAmount: worker.pendingAmount,
    }));

    res.status(200).json(transformedWorkers);
  } catch (error) {
    console.error('Get all workers by owner error:', error);
    res.status(500).json({ message: 'Failed to fetch workers' });
  }
};

export const getWorkers = async (req, res) => {
  try {
    const { workId } = req.query;
    let query = {};

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

    const workers = await Worker.find(query);

    // Transform the data to match the frontend requirements
    const transformedWorkers = workers.map(worker => ({
      id: worker._id,
      name: worker.name,
      phoneNumber: worker.phoneNumber,
      profileImage: worker.profileImage,
      workId: worker.workId,
      dailyWage: worker.dailyWage,
      totalDaysWorked: worker.totalDaysWorked,
      totalEarnings: worker.totalEarnings,
      pendingAmount: worker.pendingAmount
    }));

    res.status(200).json(transformedWorkers);
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ message: 'Failed to get workers' });
  }
};

export const createWorker = async (req, res) => {
  try {
    const { name, phoneNumber, dailyWage, workId, profileImage } = req.body;

    // Validate work ownership
    const work = await Work.findOne({
      _id: workId,
      owner: req.user.userId
    });

    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    // Create worker
    const worker = new Worker({
      name,
      phoneNumber,
      workId,
      dailyWage,
      profileImage,
      totalDaysWorked: 0,
      totalEarnings: 0,
      pendingAmount: 0
    });
    await worker.save();

    res.status(201).json(worker);
  } catch (error) {
    console.error('Create worker error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }
    res.status(500).json({ message: 'Failed to create worker' });
  }
};

export const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const work = await Work.findOne({
      _id: worker.workId,
      owner: req.user.userId
    });

    if (!work) {
      return res.status(403).json({ message: 'Not authorized to view this worker' });
    }

    res.status(200).json(worker);
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({ message: 'Failed to get worker' });
  }
};

export const deleteWorker = async (req, res) => {
  try {
    const  {id}  = req.query;
    // Find the worker by ID
    const worker = await Worker.findById(id);
    
    console.log("worker", worker)
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }


    // Validate work ownership
    const work = await Work.findOne({
      _id: worker.workId,
      owner: req.user.userId
    });

    if (!work) {
      return res.status(403).json({ message: "Not authorized to delete this worker" });
    }

    // Check if the worker has any pending amount
    if (worker.pendingAmount > 0) {
      return res.status(400).json({ message: "Worker cannot be deleted. Pending amount must be 0" });
    }

    // Delete the worker
    await Worker.findByIdAndDelete(id);

    res.status(200).json({ message: "Worker deleted successfully" });
  } catch (error) {
    console.error("Delete worker error:", error);
    res.status(500).json({ message: "Failed to delete worker" });
  }
};

export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, dailyWage, profileImage } = req.body;

    // Find the worker by ID
    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Validate work ownership
    const work = await Work.findOne({
      _id: worker.workId,
      owner: req.user.userId,
    });

    if (!work) {
      return res.status(403).json({ message: "Not authorized to update this worker" });
    }

    // Update worker fields if provided
    if (name) worker.name = name;
    if (phoneNumber) worker.phoneNumber = phoneNumber;
    if (dailyWage) worker.dailyWage = dailyWage;
    if (profileImage) worker.profileImage = profileImage;

    // If dailyWage is updated, recalculate pending amount
    if (dailyWage) {
      await worker.updateStats(); // Recalculate total earnings & pending amount
    } else {
      await worker.save();
    }

    res.status(200).json({ message: "Worker updated successfully", worker });
  } catch (error) {
    console.error("Update worker error:", error);
    res.status(500).json({ message: "Failed to update worker" });
  }
};

