const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CollectionRequest = sequelize.define('CollectionRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  request_number: {
    type: DataTypes.STRING(20),
    // unique: true,
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  total_estimated_value: {              // ✅ RESTORED
    type: DataTypes.DECIMAL(10, 2)
  },
  address_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'user_addresses',
      key: 'id'
    }
  },
  total_weight: {
    type: DataTypes.DECIMAL(8, 2)
  },
//   total_estimated_value: {
//     type: DataTypes.DECIMAL(10, 2)
//   },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'scheduled', 'collected', 'cancelled'),
    defaultValue: 'pending'
  },
  pickup_date: {
    type: DataTypes.DATEONLY
  },
  pickup_time_slot: {
    type: DataTypes.STRING(50)
  },
  notes: {
    type: DataTypes.TEXT
  },
  rejection_reason: {
    type: DataTypes.TEXT
  },
  admin_notes: {
    type: DataTypes.TEXT
  },
  scheduled_pickup_time: {
    type: DataTypes.DATE
  },
  actual_pickup_time: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'collection_requests',
  timestamps: true,
  hooks: {
    beforeCreate: async (request) => {
      if (!request.request_number) {
        const year = new Date().getFullYear();
        const count = await CollectionRequest.count();
        request.request_number = `SCRP-${year}-${String(count + 1).padStart(5, '0')}`;
      }
    }
  }
});

module.exports = CollectionRequest;