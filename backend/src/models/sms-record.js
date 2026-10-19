import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

export const SmsRecord = sequelize.define(
  'SmsRecord',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    signup_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    template_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      defaultValue: 'pending',
    },
    provider_response: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'sms_records',
    timestamps: false,
    underscored: true,
    indexes: [{ fields: ['status', 'created_at'] }],
  },
)
