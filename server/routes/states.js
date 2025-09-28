const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { State, User, Project, Transition } = require('../models');
const { requireProjectAccess } = require('../middleware/auth');

const router = express.Router();

// Get states for a project
router.get('/project/:projectId', requireProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { department, status, search } = req.query;

    let whereClause = { projectId };

    if (department) {
      whereClause.department = department;
    }
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const states = await State.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: 'lastModifier',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// Get single state
router.get('/:id', async (req, res) => {
  try {
    const state = await State.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: 'lastModifier',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Transition,
          as: 'outgoingTransitions',
          include: [
            {
              model: State,
              as: 'toState',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Transition,
          as: 'incomingTransitions',
          include: [
            {
              model: State,
              as: 'fromState',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }

    res.json(state);
  } catch (error) {
    console.error('Error fetching state:', error);
    res.status(500).json({ error: 'Failed to fetch state' });
  }
});

// Create state
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('projectId').isUUID(),
  body('description').optional().trim(),
  body('inputConditions').optional().trim(),
  body('outputResults').optional().trim(),
  body('department').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, projectId, description, inputConditions, outputResults, department, tags, position } = req.body;

    // Check if state name already exists in project
    const existingState = await State.findOne({
      where: { name, projectId }
    });

    if (existingState) {
      return res.status(400).json({ error: 'State with this name already exists in the project' });
    }

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const state = await State.create({
      name,
      projectId,
      description,
      inputConditions,
      outputResults,
      department: department || req.user.department,
      tags: tags || [],
      position: position || { x: 0, y: 0 },
      ownerId: req.user.id,
      lastModifiedBy: req.user.id
    });

    const stateWithOwner = await State.findByPk(state.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'department']
        }
      ]
    });

    res.status(201).json(stateWithOwner);
  } catch (error) {
    console.error('Error creating state:', error);
    res.status(500).json({ error: 'Failed to create state' });
  }
});

// Update state
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('inputConditions').optional().trim(),
  body('outputResults').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const state = await State.findByPk(req.params.id);
    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }

    // Check if user has permission to update (owner, admin, or same department)
    if (state.ownerId !== req.user.id && 
        req.user.role !== 'admin' && 
        state.department !== req.user.department) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // If name is being changed, check for duplicates
    if (req.body.name && req.body.name !== state.name) {
      const existingState = await State.findOne({
        where: { 
          name: req.body.name, 
          projectId: state.projectId,
          id: { [Op.ne]: state.id }
        }
      });
      
      if (existingState) {
        return res.status(400).json({ error: 'State with this name already exists in the project' });
      }
    }

    await state.update({
      ...req.body,
      lastModifiedBy: req.user.id
    });

    const updatedState = await State.findByPk(state.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: User,
          as: 'lastModifier',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedState);
  } catch (error) {
    console.error('Error updating state:', error);
    res.status(500).json({ error: 'Failed to update state' });
  }
});

// Delete state
router.delete('/:id', async (req, res) => {
  try {
    const state = await State.findByPk(req.params.id);
    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }

    // Check permissions
    if (state.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Check if state has transitions
    const transitionCount = await Transition.count({
      where: {
        [Op.or]: [
          { fromStateId: state.id },
          { toStateId: state.id }
        ]
      }
    });

    if (transitionCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete state with existing transitions. Delete transitions first.' 
      });
    }

    await state.destroy();
    res.json({ message: 'State deleted successfully' });
  } catch (error) {
    console.error('Error deleting state:', error);
    res.status(500).json({ error: 'Failed to delete state' });
  }
});

// Validate states (check for missing IN/OUT data)
router.get('/project/:projectId/validate', requireProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;

    const states = await State.findAll({
      where: { projectId },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    const validation = {
      missingInput: [],
      missingOutput: [],
      missingBoth: [],
      complete: []
    };

    states.forEach(state => {
      const hasInput = state.inputConditions && state.inputConditions.trim();
      const hasOutput = state.outputResults && state.outputResults.trim();

      if (!hasInput && !hasOutput) {
        validation.missingBoth.push(state);
      } else if (!hasInput) {
        validation.missingInput.push(state);
      } else if (!hasOutput) {
        validation.missingOutput.push(state);
      } else {
        validation.complete.push(state);
      }
    });

    res.json({
      projectId,
      totalStates: states.length,
      validation,
      completionRate: states.length > 0 ? 
        (validation.complete.length / states.length * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Error validating states:', error);
    res.status(500).json({ error: 'Failed to validate states' });
  }
});

module.exports = router;