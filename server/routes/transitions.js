const express = require('express');
const { body, validationResult } = require('express-validator');
const { Transition, State, User } = require('../models');

const router = express.Router();

// Get transitions for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const transitions = await Transition.findAll({
      where: { projectId: req.params.projectId },
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
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(transitions);
  } catch (error) {
    console.error('Error fetching transitions:', error);
    res.status(500).json({ error: 'Failed to fetch transitions' });
  }
});

// Create transition
router.post('/', [
  body('fromStateId').isUUID(),
  body('toStateId').isUUID(),
  body('eventName').trim().isLength({ min: 1, max: 255 }),
  body('projectId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fromStateId, toStateId, eventName, eventDescription, conditions, projectId } = req.body;

    // Check for existing transition
    const existingTransition = await Transition.findOne({
      where: { fromStateId, toStateId, eventName }
    });

    if (existingTransition) {
      return res.status(400).json({ error: 'Transition already exists' });
    }

    const transition = await Transition.create({
      fromStateId,
      toStateId,
      eventName,
      eventDescription,
      conditions,
      projectId,
      createdBy: req.user.id
    });

    const transitionWithStates = await Transition.findByPk(transition.id, {
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
    });

    res.status(201).json(transitionWithStates);
  } catch (error) {
    console.error('Error creating transition:', error);
    res.status(500).json({ error: 'Failed to create transition' });
  }
});

// Update transition
router.put('/:id', async (req, res) => {
  try {
    const transition = await Transition.findByPk(req.params.id);
    if (!transition) {
      return res.status(404).json({ error: 'Transition not found' });
    }

    if (transition.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await transition.update(req.body);
    res.json(transition);
  } catch (error) {
    console.error('Error updating transition:', error);
    res.status(500).json({ error: 'Failed to update transition' });
  }
});

// Delete transition
router.delete('/:id', async (req, res) => {
  try {
    const transition = await Transition.findByPk(req.params.id);
    if (!transition) {
      return res.status(404).json({ error: 'Transition not found' });
    }

    if (transition.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await transition.destroy();
    res.json({ message: 'Transition deleted successfully' });
  } catch (error) {
    console.error('Error deleting transition:', error);
    res.status(500).json({ error: 'Failed to delete transition' });
  }
});

module.exports = router;