const express = require('express');
const { Op, fn, col } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { StateIOTerm, StateIOLink } = require('../models');
const { sequelize } = require('../config/database');
const { recalculateStateAggregations } = require('../services/stateIoService');

const router = express.Router();

const mapTermResponse = (term, usageCount = 0) => ({
  ...term.toJSON(),
  usageCount
});

router.get('/', async (req, res) => {
  try {
    const { search, limit = 20 } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 50);

    const where = {};
    if (search) {
      where.label = { [Op.iLike]: `%${search}%` };
    }

    const terms = await StateIOTerm.findAll({
      where,
      order: [['label', 'ASC']],
      limit: parsedLimit
    });

    if (!terms.length) {
      return res.json([]);
    }

    const termIds = terms.map(term => term.id);
    const counts = await StateIOLink.findAll({
      attributes: ['ioTermId', [fn('COUNT', col('ioTermId')), 'usageCount']],
      where: { ioTermId: { [Op.in]: termIds } },
      group: ['ioTermId']
    });

    const usageMap = new Map(counts.map(row => [row.ioTermId, parseInt(row.get('usageCount'), 10)]));

    res.json(terms.map(term => mapTermResponse(term, usageMap.get(term.id) || 0)));
  } catch (error) {
    console.error('Error fetching IO terms:', error);
    res.status(500).json({ error: 'Failed to fetch IO terms' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const term = await StateIOTerm.findByPk(req.params.id);
    if (!term) {
      return res.status(404).json({ error: 'IO term not found' });
    }

    const usageCount = await StateIOLink.count({ where: { ioTermId: term.id } });
    res.json(mapTermResponse(term, usageCount));
  } catch (error) {
    console.error('Error fetching IO term:', error);
    res.status(500).json({ error: 'Failed to fetch IO term' });
  }
});

router.post('/', [
  body('label').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim().isLength({ max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { label, description } = req.body;

    const term = await sequelize.transaction(async (transaction) => {
      const existing = await StateIOTerm.findOne({
        where: sequelize.where(sequelize.fn('LOWER', col('label')), label.toLowerCase()),
        transaction
      });

      if (existing) {
        const error = new Error('IO term with this label already exists');
        error.status = 400;
        throw error;
      }

      return StateIOTerm.create({
        label,
        description,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }, { transaction });
    });

    res.status(201).json(mapTermResponse(term, 0));
  } catch (error) {
    console.error('Error creating IO term:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.status ? error.message : 'Failed to create IO term' });
  }
});

router.put('/:id', [
  body('label').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim().isLength({ max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { label, description } = req.body;

    const term = await StateIOTerm.findByPk(req.params.id);
    if (!term) {
      return res.status(404).json({ error: 'IO term not found' });
    }

    await sequelize.transaction(async (transaction) => {
      if (label && label.toLowerCase() !== term.label.toLowerCase()) {
        const duplicate = await StateIOTerm.findOne({
          where: sequelize.where(sequelize.fn('LOWER', col('label')), label.toLowerCase()),
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (duplicate) {
          const error = new Error('IO term with this label already exists');
          error.status = 400;
          throw error;
        }
      }

      await term.update({
        ...(label !== undefined ? { label } : {}),
        ...(description !== undefined ? { description } : {}),
        updatedBy: req.user.id
      }, { transaction });

      const links = await StateIOLink.findAll({
        where: { ioTermId: term.id },
        attributes: ['stateId'],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      const stateIds = [...new Set(links.map(link => link.stateId))];
      if (stateIds.length) {
        await recalculateStateAggregations(stateIds, { transaction });
      }
    });

    const usageCount = await StateIOLink.count({ where: { ioTermId: term.id } });
    res.json(mapTermResponse(term, usageCount));
  } catch (error) {
    console.error('Error updating IO term:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.status ? error.message : 'Failed to update IO term' });
  }
});

module.exports = router;
