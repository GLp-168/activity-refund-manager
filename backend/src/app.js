import express from 'express'
import cors from 'cors'
import portalRouter from './routes/portal.js'
import adminRouter from './routes/admin.js'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/error-handler.js'

export const createApp = () => {
  const app = express()

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api', portalRouter)
  app.use('/api/admin', adminRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
