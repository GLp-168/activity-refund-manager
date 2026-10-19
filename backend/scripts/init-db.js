import { readFile } from 'node:fs/promises'
import mysql from 'mysql2/promise'
import { env } from '../src/config/env.js'

const connection = await mysql.createConnection({
  host: env.dbHost, port: env.dbPort, user: env.dbUser,
  password: env.dbPassword, database: env.dbName, multipleStatements: true,
})
try {
  const sql = await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8')
  await connection.query(sql.replace(/^\uFEFF/, ''))
  console.log('Schema initialized. Existing tables/data are not dropped or migrated.')
} finally {
  await connection.end()
}
