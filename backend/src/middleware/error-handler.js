import { AppError } from '../utils/errors.js'

export const notFound = (req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `资源不存在: ${req.method} ${req.path}`,
    data: null,
  })
}

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  const status = err instanceof AppError ? err.status : 500
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR'
  res.status(status).json({
    code,
    message: err.message || '服务器内部错误',
    data: null,
  })
}
