const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transition = sequelize.define('Transition', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fromStateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'states',
      key: 'id'
    }
  },
  toStateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'states',
      key: 'id'
    }
  },
  eventName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Trigger event or action that causes the transition'
  },
  eventDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  conditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Conditions that must be met for this transition'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'review', 'approved', 'archived'),
    defaultValue: 'draft'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Priority when multiple transitions are possible'
  }
}, {
  tableName: 'transitions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['fromStateId', 'toStateId', 'eventName']
    }
  ]
});

module.exports = Transition;