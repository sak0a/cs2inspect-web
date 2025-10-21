-- Health check history table for storing periodic health check results
CREATE TABLE IF NOT EXISTS health_check_history
(
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    check_name    VARCHAR(64)                           NOT NULL COMMENT 'Name of the health check (e.g., database, steam, environment)',
    status        ENUM('ok', 'degraded', 'fail')        NOT NULL COMMENT 'Health check status',
    latency_ms    INT UNSIGNED                          NULL COMMENT 'Response latency in milliseconds',
    message       TEXT                                  NULL COMMENT 'Additional status message or error details',
    metadata      JSON                                  NULL COMMENT 'Additional check-specific metadata',
    checked_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT 'When the check was performed',
    INDEX idx_check_name_time (check_name, checked_at),
    INDEX idx_checked_at (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Health check configuration table for storing check thresholds
CREATE TABLE IF NOT EXISTS health_check_config
(
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    check_name           VARCHAR(64)                           NOT NULL UNIQUE COMMENT 'Name of the health check',
    enabled              TINYINT(1) DEFAULT 1                  NOT NULL COMMENT 'Whether the check is enabled',
    warning_threshold_ms INT UNSIGNED                          NULL COMMENT 'Latency threshold for degraded status',
    error_threshold_ms   INT UNSIGNED                          NULL COMMENT 'Latency threshold for error status',
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration for health checks
INSERT INTO health_check_config (check_name, enabled, warning_threshold_ms, error_threshold_ms) VALUES
('database', 1, 50, 200),
('steam_api', 1, 300, 1000),
('steam_client', 1, 500, 2000),
('environment', 1, 10, 50)
ON DUPLICATE KEY UPDATE check_name=check_name;
