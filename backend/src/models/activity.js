import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

export const Activity = sequelize.define(
  'Activity',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    product_intro: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    product_images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    max_participants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    current_participants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'ended', 'cancelled'),
      defaultValue: 'draft',
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    weight_config_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: 'activities',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ fields: ['status', 'start_time', 'end_time'] }],
  },
)
