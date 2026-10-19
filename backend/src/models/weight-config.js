import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

export const WeightConfig = sequelize.define(
  'WeightConfig',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    platform_type: {
      type: DataTypes.ENUM('taobao', 'jd', 'pdd', 'all'),
      defaultValue: 'all',
    },
    config: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'weight_configs',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
)
