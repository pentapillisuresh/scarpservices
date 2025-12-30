const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RequestImage = sequelize.define('RequestImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  request_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'request_items',
      key: 'id'
    }
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  image_type: {
    type: DataTypes.ENUM('scrap', 'additional'),
    defaultValue: 'scrap'
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'request_images',
  timestamps: true,
  createdAt: 'uploaded_at',
  updatedAt: false
});

module.exports = RequestImage;