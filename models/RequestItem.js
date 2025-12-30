const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RequestItem = sequelize.define('RequestItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  request_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'collection_requests',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2)
  },
  estimated_value: {
    type: DataTypes.DECIMAL(10, 2)
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'request_items',
  timestamps: true
});

module.exports = RequestItem;