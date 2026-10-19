CREATE TABLE IF NOT EXISTS weight_configs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  platform_type ENUM('taobao', 'jd', 'pdd', 'all') DEFAULT 'all',
  config JSON NOT NULL,
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  platform_type ENUM('taobao', 'jd', 'pdd', 'other') DEFAULT 'taobao',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  product_intro TEXT NOT NULL,
  product_images JSON NOT NULL,
  max_participants INT DEFAULT 0,
  current_participants INT DEFAULT 0,
  status ENUM('draft', 'active', 'ended', 'cancelled') DEFAULT 'draft',
  start_time DATETIME NULL,
  end_time DATETIME NULL,
  weight_config_id INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_start_end (status, start_time, end_time),
  CONSTRAINT fk_activities_weight_config FOREIGN KEY (weight_config_id)
    REFERENCES weight_configs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activity_store_links (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  activity_id INT UNSIGNED NOT NULL,
  store_id INT UNSIGNED NOT NULL,
  product_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_activity_store (activity_id, store_id),
  INDEX idx_store_id (store_id),
  CONSTRAINT fk_activity_store_activity FOREIGN KEY (activity_id)
    REFERENCES activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_store_store FOREIGN KEY (store_id)
    REFERENCES stores(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS signups (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  activity_id INT UNSIGNED NOT NULL,
  store_id INT UNSIGNED NOT NULL,
  signup_code VARCHAR(50) NOT NULL,
  wechat_nickname VARCHAR(100) NOT NULL,
  order_number VARCHAR(100),
  alipay_account VARCHAR(100),
  alipay_name VARCHAR(50),
  phone_number VARCHAR(20) NOT NULL,
  status ENUM('signed_up', 'ordered', 'pending_refund', 'refunded', 'voided') DEFAULT 'signed_up',
  void_reason VARCHAR(255),
  comment_fetch_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  comment_result ENUM('unknown', 'good', 'bad') DEFAULT 'unknown',
  comment_rating TINYINT,
  comment_content TEXT,
  comment_images JSON,
  comment_fetched_at DATETIME,
  refund_amount DECIMAL(10, 2),
  refund_status ENUM('pending', 'processing', 'success', 'failed'),
  refund_transaction_id VARCHAR(100),
  refunded_at DATETIME,
  sms_sent TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_activity_wechat (activity_id, wechat_nickname, phone_number),
  UNIQUE KEY uniq_signup_code (signup_code),
  INDEX idx_activity_status (activity_id, status),
  INDEX idx_order_number (order_number),
  INDEX idx_store_id (store_id),
  CONSTRAINT fk_signups_activity FOREIGN KEY (activity_id)
    REFERENCES activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_signups_store FOREIGN KEY (store_id)
    REFERENCES stores(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS refund_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  signup_id INT UNSIGNED NOT NULL,
  activity_id INT UNSIGNED NOT NULL,
  batch_no VARCHAR(50) NOT NULL,
  refund_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'processing', 'success', 'failed') DEFAULT 'pending',
  transaction_id VARCHAR(100),
  error_message TEXT,
  request_payload JSON,
  response_payload JSON,
  processed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status_created (status, created_at),
  INDEX idx_batch_no (batch_no),
  CONSTRAINT fk_refund_signup FOREIGN KEY (signup_id)
    REFERENCES signups(id) ON DELETE CASCADE,
  CONSTRAINT fk_refund_activity FOREIGN KEY (activity_id)
    REFERENCES activities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sms_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  signup_id INT UNSIGNED NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  template_id VARCHAR(50),
  content TEXT NOT NULL,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  provider_response JSON,
  sent_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sms_status_created (status, created_at),
  CONSTRAINT fk_sms_signup FOREIGN KEY (signup_id)
    REFERENCES signups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  operator_id INT UNSIGNED,
  operator_role VARCHAR(20),
  target_type VARCHAR(50),
  target_id INT UNSIGNED,
  payload JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action_created (action, created_at),
  INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
