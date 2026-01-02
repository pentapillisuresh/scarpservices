
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(100),
    // unique: true,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    // unique: true,
    allowNull: true,
    validate: {
      len: [10, 20]
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  profile_image: {
    type: DataTypes.STRING(255)
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  otp: {
    type: DataTypes.STRING(6)
  },
  otp_expiry: {
    type: DataTypes.DATE
  },
  failed_otp_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_otp_verified: {
    type: DataTypes.DATE
  },
  verification_token: {
    type: DataTypes.STRING(100)
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    }
  }
});

User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

User.prototype.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  this.otp = otp;
  this.otp_expiry = expiry;
  
  return { otp, expiry };
};

User.prototype.verifyOTP = function(inputOTP) {
  if (!this.otp || !this.otp_expiry) {
    return { success: false, message: 'No OTP generated' };
  }
  
  if (new Date() > this.otp_expiry) {
    return { success: false, message: 'OTP expired' };
  }
  
  if (this.otp !== inputOTP) {
    this.failed_otp_attempts = (this.failed_otp_attempts || 0) + 1;
    return { 
      success: false, 
      message: 'Invalid OTP',
      attempts: this.failed_otp_attempts
    };
  }
  
  // Clear OTP on successful verification
  this.otp = null;
  this.otp_expiry = null;
  this.failed_otp_attempts = 0;
  this.last_otp_verified = new Date();
  this.is_verified = true;
  
  return { success: true, message: 'OTP verified successfully' };
};

module.exports = User;