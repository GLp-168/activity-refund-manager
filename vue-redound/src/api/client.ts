import type {
  Activity,
  ActivityInput,
  ActivityStatus,
  LoginResult,
  RefundRecord,
  RefundStatus,
  Signup,
  SignupCreateInput,
  SignupCreateResult,
  SignupStatus,
  SignupUpdateInput,
  SignupView,
  Store,
  StoreInput,
  WeightConfig,
  WeightConfigInput,
  CommentInput,
} from '@/types'

const STORAGE_KEY = 'activity-refund-manager-admin-session'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)
const API_PREFIX = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
}

const buildQuery = (params: Record<string, unknown>) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }
    searchParams.append(key, String(value))
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const getAdminToken = () => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as LoginResult
    return parsed?.token ?? null
  } catch {
    return null
  }
}

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, auth = false } = options
  const headers: Record<string, string> = {}
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (auth) {
    const token = getAdminToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }
  const response = await fetch(`${API_PREFIX}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload || payload.code !== 'OK') {
    throw new Error(payload?.message || '请求失败')
  }
  return payload.data as T
}

export const adminLogin = async (username: string, password: string): Promise<LoginResult> =>
  request<LoginResult>('/admin/auth/login', {
    method: 'POST',
    body: {
      username,
      password,
    },
  })

export const fetchActivities = async (status?: ActivityStatus) => {
  const pageSize = 100
  const query = buildQuery({ status: status ?? 'all', page: 1, size: pageSize })
  const first = await request<{ items: Activity[]; total: number }>(`/activities${query}`)
  const items = [...first.items]
  const total = Number(first.total || items.length)
  const pageCount = Math.ceil(total / pageSize)
  for (let page = 2; page <= pageCount; page += 1) {
    const nextQuery = buildQuery({ status: status ?? 'all', page, size: pageSize })
    const next = await request<{ items: Activity[] }>(`/activities${nextQuery}`)
    items.push(...next.items)
  }
  return items
}

export const getActivityById = async (id: number) => request<Activity>(`/activities/${id}`)

export const createSignup = async (input: SignupCreateInput): Promise<SignupCreateResult> =>
  request<SignupCreateResult>('/signups', {
    method: 'POST',
    body: input,
  })

export const querySignups = async (
  activityId: number | undefined,
  wechatNickname: string,
  phoneNumber: string,
) => {
  if (!activityId) {
    return []
  }
  const query = buildQuery({
    activity_id: activityId,
    wechat_nickname: wechatNickname,
    phone_number: phoneNumber,
  })
  const data = await request<{ items: SignupView[] }>(`/signups/query${query}`)
  return data.items
}

export const updateSignup = async (id: number, input: SignupUpdateInput) =>
  request<Signup>(`/signups/${id}`, {
    method: 'PUT',
    body: input,
  })

export const adminListStores = async () => {
  const data = await request<{ items: Store[] }>('/admin/stores', { auth: true })
  return data.items
}

export const adminCreateStore = async (input: StoreInput) =>
  request<Store>('/admin/stores', {
    method: 'POST',
    body: input,
    auth: true,
  })

export const adminUpdateStore = async (id: number, input: StoreInput) =>
  request<Store>(`/admin/stores/${id}`, {
    method: 'PUT',
    body: input,
    auth: true,
  })

export const adminDeleteStore = async (id: number) =>
  request<boolean>(`/admin/stores/${id}`, {
    method: 'DELETE',
    auth: true,
  })

export const adminListActivities = async () => {
  const data = await request<{ items: Activity[] }>('/admin/activities', { auth: true })
  return data.items
}

export const adminCreateActivity = async (input: ActivityInput) =>
  request<Activity>('/admin/activities', {
    method: 'POST',
    body: input,
    auth: true,
  })

export const adminUpdateActivity = async (id: number, input: ActivityInput) =>
  request<Activity>(`/admin/activities/${id}`, {
    method: 'PUT',
    body: input,
    auth: true,
  })

export const adminDeleteActivity = async (id: number) =>
  request<boolean>(`/admin/activities/${id}`, {
    method: 'DELETE',
    auth: true,
  })

export const adminListSignups = async (filters: {
  activity_id?: number
  status?: SignupStatus
  comment_result?: Signup['comment_result']
  refund_status?: RefundStatus
}) => {
  if (!filters.activity_id) {
    return []
  }
  const query = buildQuery({
    status: filters.status,
    comment_result: filters.comment_result,
    refund_status: filters.refund_status,
  })
  const data = await request<{ items: SignupView[] }>(
    `/admin/activities/${filters.activity_id}/signups${query}`,
    { auth: true },
  )
  return data.items
}

export const adminUpdateSignup = async (id: number, payload: Partial<Signup>) =>
  request<Signup>(`/admin/signups/${id}`, {
    method: 'PUT',
    body: payload,
    auth: true,
  })

export const adminBulkUpdateStatus = async (
  ids: number[],
  status: SignupStatus,
  voidReason?: string,
) => {
  await request<{ items: Signup[] }>('/admin/signups/bulk-status', {
    method: 'POST',
    body: {
      signup_ids: ids,
      status,
      void_reason: voidReason,
    },
    auth: true,
  })
  return true
}

export const adminFetchComments = async (comments: CommentInput[]) =>
  (
    await request<{ items: Signup[] }>('/admin/comments/fetch', {
      method: 'POST',
      body: {
        comments,
      },
      auth: true,
    })
  ).items

export const adminCreateRefundBatch = async (ids: number[], batchNo?: string) =>
  request<{ batch_no: string; records: RefundRecord[] }>('/admin/refunds/batch', {
    method: 'POST',
    body: {
      signup_ids: ids,
      batch_no: batchNo,
    },
    auth: true,
  })

export const adminListRefundRecords = async (filters: {
  status?: RefundStatus
  batch_no?: string
  date_range?: string
}) => {
  const query = buildQuery({
    status: filters.status,
    batch_no: filters.batch_no,
    date_range: filters.date_range,
  })
  const data = await request<{ items: RefundRecord[] }>(`/admin/refunds${query}`, { auth: true })
  return data.items
}

export const adminRetryRefund = async (id: number) =>
  request<RefundRecord>(`/admin/refunds/${id}/retry`, {
    method: 'POST',
    auth: true,
  })

export const adminNotifySms = async (ids: number[]) =>
  (
    await request<{ items: Signup[] }>('/admin/refunds/notify', {
      method: 'POST',
      body: {
        signup_ids: ids,
      },
      auth: true,
    })
  ).items

export const adminListWeightConfigs = async () => {
  const data = await request<{ items: WeightConfig[] }>('/admin/weight-configs', { auth: true })
  return data.items
}

export const adminCreateWeightConfig = async (input: WeightConfigInput) =>
  request<WeightConfig>('/admin/weight-configs', {
    method: 'POST',
    body: input,
    auth: true,
  })

export const adminUpdateWeightConfig = async (id: number, input: WeightConfigInput) =>
  request<WeightConfig>(`/admin/weight-configs/${id}`, {
    method: 'PUT',
    body: input,
    auth: true,
  })

export const adminDeleteWeightConfig = async (id: number) =>
  request<boolean>(`/admin/weight-configs/${id}`, {
    method: 'DELETE',
    auth: true,
  })
