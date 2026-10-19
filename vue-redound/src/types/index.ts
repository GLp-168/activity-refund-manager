export type PlatformType = 'taobao' | 'jd' | 'pdd' | 'other'
export type ActivityStatus = 'draft' | 'active' | 'ended' | 'cancelled'
export type SignupStatus = 'signed_up' | 'ordered' | 'pending_refund' | 'refunded' | 'voided'
export type CommentFetchStatus = 'pending' | 'success' | 'failed'
export type CommentResult = 'unknown' | 'good' | 'bad'
export type RefundStatus = 'pending' | 'processing' | 'success' | 'failed'

export interface Store {
  id: number
  name: string
  platform_type: PlatformType
  created_at: string
  updated_at: string
}

export interface ActivityStoreLink {
  id: number
  activity_id: number
  store_id: number
  store_name: string
  store_platform: PlatformType
  product_url: string
}

export interface Activity {
  id: number
  name: string
  product_intro: string
  product_images: string[]
  store_links: ActivityStoreLink[]
  max_participants: number
  current_participants: number
  status: ActivityStatus
  start_time?: string
  end_time?: string
  weight_config_id?: number
  created_at: string
  updated_at: string
}

export interface Signup {
  id: number
  activity_id: number
  store_id: number
  signup_code: string
  wechat_nickname: string
  phone_number: string
  order_number?: string
  alipay_account?: string
  alipay_name?: string
  status: SignupStatus
  void_reason?: string
  comment_fetch_status: CommentFetchStatus
  comment_result: CommentResult
  comment_rating?: number
  comment_content?: string
  comment_images?: string[]
  comment_fetched_at?: string
  refund_amount?: number
  refund_status?: RefundStatus
  refund_transaction_id?: string
  refunded_at?: string
  sms_sent?: boolean
  created_at: string
  updated_at: string
}

export interface SignupView extends Signup {
  activity_name: string
  store_name: string
  store_platform: PlatformType
  product_url: string
}

export interface CommentInput {
  signup_id: number
  rating: number
  content: string
  images: string[]
}

export interface RefundRecord {
  id: number
  signup_id: number
  activity_id: number
  batch_no: string
  refund_amount: number
  status: RefundStatus
  transaction_id?: string
  error_message?: string
  request_payload?: Record<string, unknown>
  response_payload?: Record<string, unknown>
  processed_at?: string
  created_at: string
}

export interface WeightConfig {
  id: number
  name: string
  platform_type: PlatformType | 'all'
  config: {
    min_rating: number
    keyword_rules: Array<{ keyword: string; weight: number }>
    image_rule: {
      min_images: number
      score: number
    }
    passing_score: number
  }
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: number
  username: string
  role: 'admin'
}

export interface LoginResult {
  token: string
  user: AdminUser
}

export interface SignupCreateInput {
  activity_id: number
  store_id: number
  wechat_nickname: string
  phone_number: string
}

export interface SignupCreateResult {
  signup_id: number
  signup_code: string
  status: SignupStatus
  product_url: string
}

export interface SignupUpdateInput {
  order_number?: string
  alipay_account?: string
  alipay_name?: string
}

export interface ActivityInput {
  name: string
  product_intro: string
  product_images: string[]
  store_links: Array<{
    store_id: number
    product_url: string
  }>
  max_participants: number
  status: ActivityStatus
  start_time?: string
  end_time?: string
  weight_config_id?: number
}

export interface StoreInput {
  name: string
  platform_type: PlatformType
}

export interface WeightConfigInput {
  name: string
  platform_type: PlatformType | 'all'
  config: WeightConfig['config']
  is_default: boolean
}
