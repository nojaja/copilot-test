const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StateIOTerm = sequelize.define('StateIOTerm', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'state_io_terms',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['label']
    }
  ]
});

module.exports = StateIOTerm;
