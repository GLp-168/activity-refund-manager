import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

export const ActivityStoreLink = sequelize.define(
  'ActivityStoreLink',
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
    product_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
  },
  {
    tableName: 'activity_store_links',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['activity_id', 'store_id'],
      },
      {
        fields: ['store_id'],
      },
    ],
  },
)
