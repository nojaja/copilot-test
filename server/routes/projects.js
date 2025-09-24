const express = require('express');
const { body, validationResult } = require('express-validator');
const { Project, State, Transition, User } = require('../models');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all projects for user
router.get('/', async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    // Add progress statistics
    const projectsWithStats = await Promise.all(projects.map(async (project) => {
      const stateCount = await State.count({ where: { projectId: project.id } });
      const transitionCount = await Transition.count({ where: { projectId: project.id } });
      
      const statesWithMissingData = await State.count({
        where: {
          projectId: project.id,
          $or: [
            { inputConditions: null },
            { inputConditions: '' },
            { outputResults: null },
            { outputResults: '' }
          ]
        }
      });

      return {
        ...project.toJSON(),
        statistics: {
          totalStates: stateCount,
          totalTransitions: transitionCount,
          incompletStates: statesWithMissingData,
          completionRate: stateCount > 0 ? ((stateCount - statesWithMissingData) / stateCount * 100).toFixed(1) : 0
        }
      };
    }));

    res.json(projectsWithStats);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: State,
          as: 'states',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: Transition,
          as: 'transitions',
          include: [
            {
              model: State,
              as: 'fromState',
              attributes: ['id', 'name']
            },
            {
              model: State,
              as: 'toState',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim().isLength({ max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, settings } = req.body;

    const project = await Project.create({
      name,
      description,
      createdBy: req.user.id,
      settings: settings || {}
    });

    const projectWithCreator = await Project.findByPk(project.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(projectWithCreator);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim().isLength({ max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has permission to update (creator or admin)
    if (project.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await project.update(req.body);

    const updatedProject = await Project.findByPk(project.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;