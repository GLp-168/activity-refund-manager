import { createSmsRecord } from '../repositories/sms-repo.js'
import { listSignupsByIds, updateSignup } from '../repositories/signup-repo.js'
import { nowIso } from '../utils/ids.js'
import { AppError } from '../utils/errors.js'

export const sendSmsService = async (ids) => {
  if (!ids.length) {
    throw new AppError('短信通知列表为空', 400, 'VALIDATION_ERROR')
  }
  const signups = await listSignupsByIds(ids)
  const updated = []
  for (const signup of signups) {
    if (signup.refund_status !== 'success') {
      continue
    }
    if (!signup.phone_number) {
      continue
    }
    await createSmsRecord({
      signup_id: signup.id,
      phone_number: signup.phone_number,
      template_id: 'manual',
      content: `您好，报名${signup.signup_code}已完成打款。`,
      status: 'sent',
      provider_response: null,
      sent_at: nowIso(),
    })
    updated.push(
      await updateSignup(signup.id, {
        sms_sent: true,
      }),
    )
  }
  if (!updated.length) {
    throw new AppError('没有可发送短信的报名记录', 400, 'SMS_EMPTY')
  }
  return updated.filter(Boolean)
}
