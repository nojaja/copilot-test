const { Op } = require('sequelize');
const { State, StateIOTerm, StateIOLink } = require('../models');

const sanitizeIds = (ids = []) => {
  const seen = new Set();
  const orderedUnique = [];
  ids.forEach((id) => {
    if (!id) return;
    if (seen.has(id)) return;
    seen.add(id);
    orderedUnique.push(id);
  });
  return orderedUnique;
};

const fetchTermsByIds = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return [];
  const terms = await StateIOTerm.findAll({
    where: { id: { [Op.in]: uniqueIds } }
  });

  if (terms.length !== uniqueIds.length) {
    const foundIds = terms.map(t => t.id);
    const missing = uniqueIds.filter(id => !foundIds.includes(id));
    const error = new Error(`State IO terms not found: ${missing.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const termMap = new Map(terms.map(term => [term.id, term]));
  return uniqueIds.map(id => termMap.get(id));
};

const syncUsageTerms = async (state, termIds, usageType, transaction) => {
  if (!Array.isArray(termIds)) return;

  const orderedIds = sanitizeIds(termIds);

  if (orderedIds.length) {
    // 存在確認。失敗時は例外を投げてロールバックされる。
    await fetchTermsByIds(orderedIds);
  }

  await StateIOLink.destroy({
    where: { stateId: state.id, usageType },
    transaction
  });

  if (!orderedIds.length) return;

  const rows = orderedIds.map((ioTermId, index) => ({
    stateId: state.id,
    ioTermId,
    usageType,
    order: index
  }));

  await StateIOLink.bulkCreate(rows, { transaction });
};

const syncStateTerms = async (state, { inputTermIds, outputTermIds }, options = {}) => {
  const { transaction } = options;

  await syncUsageTerms(state, inputTermIds, 'input', transaction);
  await syncUsageTerms(state, outputTermIds, 'output', transaction);

  return state;
};

const recalculateStateAggregations = async (stateIds, options = {}) => {
  if (!Array.isArray(stateIds) || stateIds.length === 0) return;
  const uniqueIds = [...new Set(stateIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  const states = await State.findAll({
    where: { id: { [Op.in]: uniqueIds } },
    include: [
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
    transaction: options.transaction,
    lock: options.lock
  });

  for (const state of states) {
    const sortByOrder = (terms = []) =>
      [...terms].sort((a, b) => {
        const orderA = a.StateIOLink?.order ?? a.state_io_links?.order ?? 0;
        const orderB = b.StateIOLink?.order ?? b.state_io_links?.order ?? 0;
        return orderA - orderB;
      });

    const inputs = sortByOrder(state.inputTerms).map(term => term.label).join(', ');
    const outputs = sortByOrder(state.outputTerms).map(term => term.label).join(', ');

    await state.update(
      {
        inputConditions: inputs,
        outputResults: outputs
      },
      { transaction: options.transaction }
    );
  }
};

module.exports = {
  syncStateTerms,
  recalculateStateAggregations
};
