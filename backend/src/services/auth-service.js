import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'

const adminUser = {
  id: 1,
  username: env.adminUsername,
  role: 'admin',
}

export const authenticateAdmin = (username, password) => {
  if (username !== env.adminUsername || password !== env.adminPassword) {
    throw new AppError('账号或密码不正确', 401, 'AUTH_FAILED')
  }
  const token = jwt.sign({ id: adminUser.id, role: adminUser.role }, env.jwtSecret, {
    expiresIn: env.tokenExpiresIn,
  })
  return {
    token,
    user: adminUser,
  }
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret)
  } catch {
    throw new AppError('登录已失效，请重新登录', 401, 'AUTH_INVALID')
  }
}
