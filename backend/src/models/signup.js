import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

export const Signup = sequelize.define(
  'Signup',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    activity_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    store_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    signup_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    wechat_nickname: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    order_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    alipay_account: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    alipay_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('signed_up', 'ordered', 'pending_refund', 'refunded', 'voided'),
      defaultValue: 'signed_up',
    },
    void_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    comment_fetch_status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending',
    },
    comment_result: {
      type: DataTypes.ENUM('unknown', 'good', 'bad'),
      defaultValue: 'unknown',
    },
    comment_rating: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    comment_content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    comment_images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    comment_fetched_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    refund_status: {
      type: DataTypes.ENUM('pending', 'processing', 'success', 'failed'),
      allowNull: true,
    },
    refund_transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sms_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'signups',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['activity_id', 'wechat_nickname', 'phone_number'],
      },
      {
        fields: ['activity_id', 'status'],
      },
      {
        fields: ['order_number'],
      },
    ],
  },
)
