import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

export const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    operator_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    operator_role: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    target_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    target_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: false,
    underscored: true,
    indexes: [{ fields: ['action', 'created_at'] }, { fields: ['target_type', 'target_id'] }],
  },
)
