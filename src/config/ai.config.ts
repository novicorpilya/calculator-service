/**
 * AI Service configuration and limits
 */
export const AI_CONFIG = {
    // Model settings
    MODEL_NAME: 'gemini-2.0-flash',
    
    // Timeouts and Retries
    REQUEST_TIMEOUT_MS: 15000, // 15 seconds
    MAX_RETRIES: 2,
    
    // Cache settings
    INSIGHTS_CACHE_TTL_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
    
    // UI rotation speeds
    INSIGHT_ROTATION_MS: 8000,
    
    // Thresholds
    STALE_INVOICE_DAYS: 3,
    STALE_SENT_DAYS: 5,
    LOW_RATING_THRESHOLD: 4.8,
    
    // Impact calculations
    COMMISSION_PERCENTAGE: 0.01, // 1%
};
