import { createApp } from './app.js'
import './models/index.js'
import { connectDatabase, syncDatabase } from './config/db.js'
import { env } from './config/env.js'

const app = createApp()

const start = async () => {
  await connectDatabase()
  await syncDatabase({ alter: env.dbSync })
  app.listen(env.port, env.host, () => {
    console.log(`服务已启动: http://${env.host}:${env.port}`)
  })
}

start().catch((error) => {
  console.error('服务启动失败', error)
  process.exit(1)
})
