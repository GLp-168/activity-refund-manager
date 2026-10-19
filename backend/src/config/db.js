import { Sequelize } from 'sequelize'
import { env } from './env.js'

export const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
  host: env.dbHost,
  port: env.dbPort,
  dialect: 'mysql',
  logging: env.dbLogging ? console.log : false,
  timezone: '+08:00',
})

export const connectDatabase = async () => {
  await sequelize.authenticate()
}

export const syncDatabase = async ({ force = false, alter = false } = {}) => {
  if (!env.dbSync && !force && !alter) {
    return
  }
  await sequelize.sync({
    force,
    alter: alter && !force,
  })
}

export const closeDatabase = async () => {
  await sequelize.close()
}
