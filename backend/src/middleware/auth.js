import { verifyToken } from '../services/auth-service.js'

export const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return res.status(401).json({
      code: 'AUTH_REQUIRED',
      message: '请先登录',
      data: null,
    })
  }
  try {
    const payload = verifyToken(token)
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({
      code: err.code || 'AUTH_INVALID',
      message: err.message || '登录已失效',
      data: null,
    })
  }
}
