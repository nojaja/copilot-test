const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { State, User, Project, Transition, StateIOTerm } = require('../models');
const { requireProjectAccess } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const { syncStateTerms, recalculateStateAggregations } = require('../services/stateIoService');

const router = express.Router();

const formatTerms = (terms = []) => {
  return terms
    .map(term => {
      const through = term.StateIOLink || term.state_io_links || term.stateIoLink;
      const json = term.toJSON ? term.toJSON() : term;
      const sanitized = { ...json };
      delete sanitized.StateIOLink;
      delete sanitized.state_io_links;
      delete sanitized.stateIoLink;
      return {
        ...sanitized,
        order: through?.order ?? 0
      };
    })
    .sort((a, b) => a.order - b.order);
};

const formatStateResponse = (state) => {
  if (!state) return state;
  const json = state.toJSON ? state.toJSON() : state;
  return {
    ...json,
    inputTerms: formatTerms(json.inputTerms),
    outputTerms: formatTerms(json.outputTerms)
  };
};

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
        },
        {
          model: StateIOTerm,
          as: 'inputTerms',
          through: { attributes: ['order'] }
        },
        {
          model: StateIOTerm,
          as: 'outputTerms',
          through: { attributes: ['order'] }
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json(states.map(formatStateResponse));
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
        },
        {
          model: StateIOTerm,
          as: 'inputTerms',
          through: { attributes: ['order'] }
        },
        {
          model: StateIOTerm,
          as: 'outputTerms',
          through: { attributes: ['order'] }
        }
      ]
    });

    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }

  res.json(formatStateResponse(state));
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
  body('department').optional().trim(),
  body('inputTermIds').optional().isArray(),
  body('inputTermIds.*').isUUID().withMessage('Each inputTermId must be a valid UUID'),
  body('outputTermIds').optional().isArray(),
  body('outputTermIds.*').isUUID().withMessage('Each outputTermId must be a valid UUID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      projectId,
      description,
      inputConditions,
      outputResults,
      department,
      tags,
      position,
      inputTermIds,
      outputTermIds
    } = req.body;

    const createdState = await sequelize.transaction(async (transaction) => {
      const existingState = await State.findOne({
        where: { name, projectId },
        transaction
      });

      if (existingState) {
        const error = new Error('State with this name already exists in the project');
        error.status = 400;
        throw error;
      }

      const project = await Project.findByPk(projectId, { transaction });
      if (!project) {
        const error = new Error('Project not found');
        error.status = 404;
        throw error;
      }

      const state = await State.create({
        name,
        projectId,
        description,
        inputConditions: Array.isArray(inputTermIds) ? '' : inputConditions,
        outputResults: Array.isArray(outputTermIds) ? '' : outputResults,
        department: department || req.user.department,
        tags: tags || [],
        position: position || { x: 0, y: 0 },
        ownerId: req.user.id,
        lastModifiedBy: req.user.id
      }, { transaction });

      await syncStateTerms(state, { inputTermIds, outputTermIds }, { transaction });

      if (Array.isArray(inputTermIds) || Array.isArray(outputTermIds)) {
        await recalculateStateAggregations([state.id], { transaction });
      }

      return state;
    });

    const stateWithRelations = await State.findByPk(createdState.id, {
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
          model: StateIOTerm,
          as: 'inputTerms',
          through: { attributes: ['order'] }
        },
        {
          model: StateIOTerm,
          as: 'outputTerms',
          through: { attributes: ['order'] }
        }
      ]
    });

    res.status(201).json(formatStateResponse(stateWithRelations));
  } catch (error) {
    console.error('Error creating state:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.status ? error.message : 'Failed to create state' });
  }
});

// Update state
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('inputConditions').optional().trim(),
  body('outputResults').optional().trim(),
  body('inputTermIds').optional().isArray(),
  body('inputTermIds.*').isUUID().withMessage('Each inputTermId must be a valid UUID'),
  body('outputTermIds').optional().isArray(),
  body('outputTermIds.*').isUUID().withMessage('Each outputTermId must be a valid UUID')
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

    const {
      name,
      description,
      inputConditions,
      outputResults,
      department,
      tags,
      position,
      status,
      inputTermIds,
      outputTermIds
    } = req.body;

    await sequelize.transaction(async (transaction) => {
      const stateForUpdate = await State.findByPk(state.id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      const updatePayload = { lastModifiedBy: req.user.id };

      if (name !== undefined) updatePayload.name = name;
      if (description !== undefined) updatePayload.description = description;
      if (department !== undefined) updatePayload.department = department;
      if (Array.isArray(tags)) updatePayload.tags = tags;
      if (position !== undefined) updatePayload.position = position;
      if (status !== undefined) updatePayload.status = status;

      if (Array.isArray(inputTermIds)) {
        updatePayload.inputConditions = '';
      } else if (inputConditions !== undefined) {
        updatePayload.inputConditions = inputConditions;
      }

      if (Array.isArray(outputTermIds)) {
        updatePayload.outputResults = '';
      } else if (outputResults !== undefined) {
        updatePayload.outputResults = outputResults;
      }

      await stateForUpdate.update(updatePayload, { transaction });

      if (Array.isArray(inputTermIds) || Array.isArray(outputTermIds)) {
        await syncStateTerms(stateForUpdate, { inputTermIds, outputTermIds }, { transaction });
        await recalculateStateAggregations([stateForUpdate.id], { transaction });
      }
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
        },
        {
          model: StateIOTerm,
          as: 'inputTerms',
          through: { attributes: ['order'] }
        },
        {
          model: StateIOTerm,
          as: 'outputTerms',
          through: { attributes: ['order'] }
        }
      ]
    });

    res.json(formatStateResponse(updatedState));
  } catch (error) {
    console.error('Error updating state:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.status ? error.message : 'Failed to update state' });
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