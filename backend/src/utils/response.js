export const sendSuccess = (res, data = null, message = 'success') => {
  res.json({
    code: 'OK',
    message,
    data,
  })
}
