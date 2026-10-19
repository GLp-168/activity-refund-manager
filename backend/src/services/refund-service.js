import { sequelize } from '../config/db.js'
import {
  createRefundRecords,
  getRefundRecordById,
  updateRefundRecord,
} from '../repositories/refund-repo.js'
import { listSignupsByIds, updateSignup } from '../repositories/signup-repo.js'
import { buildBatchNo, nowIso } from '../utils/ids.js'
import { AppError } from '../utils/errors.js'

const buildTransactionId = () => `ALI-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`

export const createRefundBatchService = async (ids, batchNo) =>
  sequelize.transaction(async (transaction) => {
    if (!ids.length) {
      throw new AppError('打款记录不能为空', 400, 'VALIDATION_ERROR')
    }
    const batch = batchNo || buildBatchNo()
    const now = nowIso()
    const signups = await listSignupsByIds(ids, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    })
    const recordsToCreate = []

    for (const signup of signups) {
      if (signup.status !== 'pending_refund') {
        continue
      }
      const refundAmount = signup.refund_amount ?? 0
      recordsToCreate.push({
        signup_id: signup.id,
        activity_id: signup.activity_id,
        batch_no: batch,
        refund_amount: refundAmount,
        status: 'success',
        transaction_id: buildTransactionId(),
        request_payload: {
          signup_id: signup.id,
          refund_amount: refundAmount,
          batch_no: batch,
        },
        response_payload: {
          status: 'success',
        },
        processed_at: now,
      })
    }

    if (!recordsToCreate.length) {
      throw new AppError('没有可打款的报名记录', 400, 'REFUND_EMPTY')
    }

    const records = await createRefundRecords(recordsToCreate, { transaction })

    for (const record of records) {
      await updateSignup(
        record.signup_id,
        {
          refund_status: record.status,
          refund_transaction_id: record.transaction_id,
          refunded_at: record.processed_at,
          status: 'refunded',
          sms_sent: false,
        },
        { transaction },
      )
    }

    return { batch_no: batch, records }
  })

export const retryRefundService = async (recordId) => {
  const record = await getRefundRecordById(recordId)
  if (!record) {
    throw new AppError('打款记录不存在', 404, 'NOT_FOUND')
  }
  if (record.status !== 'failed') {
    throw new AppError('仅失败记录可重试', 400, 'REFUND_STATUS_INVALID')
  }
  const now = nowIso()
  const updatedRecord = await updateRefundRecord(record.id, {
    status: 'success',
    transaction_id: buildTransactionId(),
    processed_at: now,
    error_message: null,
    response_payload: { status: 'success' },
  })
  await updateSignup(record.signup_id, {
    refund_status: 'success',
    refund_transaction_id: updatedRecord.transaction_id,
    refunded_at: updatedRecord.processed_at,
    status: 'refunded',
    sms_sent: false,
  })
  return updatedRecord
}
