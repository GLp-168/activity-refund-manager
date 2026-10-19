import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

export const Store = sequelize.define(
  'Store',
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
      type: DataTypes.ENUM('taobao', 'jd', 'pdd', 'other'),
      defaultValue: 'taobao',
    },
  },
  {
    tableName: 'stores',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
)
