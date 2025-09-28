const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const State = sequelize.define('State', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  inputConditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'IN: Prerequisites and conditions to enter this state'
  },
  outputResults: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'OUT: Outputs and results produced in this state'
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'File attachments and links'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  position: {
    type: DataTypes.JSONB,
    defaultValue: { x: 0, y: 0 },
    comment: 'Position for diagram visualization'
  },
  status: {
    type: DataTypes.ENUM('draft', 'review', 'approved', 'archived'),
    defaultValue: 'draft'
  },
  lastModifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'states',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['projectId', 'name']
    }
  ]
});

module.exports = State;