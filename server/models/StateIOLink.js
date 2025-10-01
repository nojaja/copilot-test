const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StateIOLink = sequelize.define('StateIOLink', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  stateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'states',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  ioTermId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'state_io_terms',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  usageType: {
    type: DataTypes.ENUM('input', 'output'),
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'state_io_links',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['stateId', 'ioTermId', 'usageType']
    },
    {
      fields: ['ioTermId', 'usageType']
    }
  ]
});

module.exports = StateIOLink;
