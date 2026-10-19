import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

export const RefundRecord = sequelize.define(
  'RefundRecord',
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
    activity_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    batch_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'success', 'failed'),
      defaultValue: 'pending',
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    request_payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    response_payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'refund_records',
    timestamps: false,
    underscored: true,
    indexes: [{ fields: ['status', 'created_at'] }, { fields: ['batch_no'] }],
  },
)
