const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Category = require('./Category');
const UserAddress = require('./UserAddress');
const CollectionRequest = require('./CollectionRequest');
const RequestItem = require('./RequestItem');
const RequestImage = require('./RequestImage');
const Notification = require('./Notification');

// Define associations
User.hasMany(UserAddress, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserAddress.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(CollectionRequest, { foreignKey: 'user_id', onDelete: 'CASCADE' });
CollectionRequest.belongsTo(User, { foreignKey: 'user_id' });

UserAddress.hasMany(CollectionRequest, { foreignKey: 'address_id', onDelete: 'CASCADE' });
CollectionRequest.belongsTo(UserAddress, { foreignKey: 'address_id' });

Category.hasMany(RequestItem, { foreignKey: 'category_id', onDelete: 'CASCADE' });
RequestItem.belongsTo(Category, { foreignKey: 'category_id' });

CollectionRequest.hasMany(RequestItem, { foreignKey: 'request_id', onDelete: 'CASCADE' });
RequestItem.belongsTo(CollectionRequest, { foreignKey: 'request_id' });

RequestItem.hasMany(RequestImage, { foreignKey: 'request_item_id', onDelete: 'CASCADE' });
RequestImage.belongsTo(RequestItem, { foreignKey: 'request_item_id' });

User.hasMany(Notification, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

CollectionRequest.hasMany(Notification, { foreignKey: 'related_request_id', onDelete: 'SET NULL' });
Notification.belongsTo(CollectionRequest, { foreignKey: 'related_request_id' });

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error; // 👈 VERY IMPORTANT
  }
};

module.exports = {
  User,
  Category,
  UserAddress,
  CollectionRequest,
  RequestItem,
  RequestImage,
  Notification,
  syncDatabase
};