import Work from '../models/Work.js';
import Worker from '../models/Worker.js';

export const getWorks = async (req, res) => {
  try {
    // Find works owned by the user
    const works = await Work.find({ owner: req.user.userId })
      .populate('owner', 'name');

    // Enrich works with total spent and pending amount
    const enrichedWorks = await Promise.all(
      works.map(async (work) => {
        // Find all workers for this work
        const workers = await Worker.find({ workId: work._id });

        // Calculate total spent by summing up workers' total earnings
        const totalSpent = workers.reduce((sum, worker) => sum + worker.totalEarnings, 0);

        // Calculate total pending amount by summing up all workers' pending amounts
        const totalPendingAmount = workers.reduce((sum, worker) => sum + worker.pendingAmount, 0);

        return {
          id: work._id,
          title: work.title,
          name: work.name,
          owner: work.owner,
          description: work.description,
          startDate: work.startDate,
          endDate: work.endDate,
          totalWorkers: workers.length,
          status: work.status,
          budget: work.budget,
          totalSpent, // Total amount paid to workers
          pendingAmount: totalPendingAmount, // Total amount still pending to workers
        };
      })
    );

    res.status(200).json(enrichedWorks);
  } catch (error) {
    console.error('Get works error:', error);
    res.status(500).json({ message: 'Failed to get works' });
  }
};

export const createWork = async (req, res) => {
  try {
    const work = new Work({
      ...req.body,
      owner: req.user.userId,
      status: 'active',
    });

    await work.save();
    res.status(201).json(work);
  } catch (error) {
    console.error('Create work error:', error);
    res.status(500).json({ message: 'Failed to create work' });
  }
};

export const getWorkById = async (req, res) => {
  try {
    const work = await Work.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    })
      .populate('owner', 'name')
      .populate('totalWorkers');

    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    res.status(200).json(work);
  } catch (error) {
    console.error('Get work error:', error);
    res.status(500).json({ message: 'Failed to get work' });
  }
};

export const updateWork = async (req, res) => {
  try {
    const work = await Work.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.userId,
      },
      { $set: req.body },
      { new: true }
    );

    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    res.status(200).json(work);
  } catch (error) {
    console.error('Update work error:', error);
    res.status(500).json({ message: 'Failed to update work' });
  }
};