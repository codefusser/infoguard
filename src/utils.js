/**
 * Logger and Error Handler Module
 * Centralized logging and error handling for production
 */

class Logger {
  constructor(config = CONFIG) {
    this.config = config;
    this.logs = [];
    this.maxLogs = 100;
  }

  /**
   * Format log message with timestamp and context
   */
  formatMessage(level, context, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context,
      message,
      data
    };

    if (this.config.DEBUG) {
      console.log(`[${timestamp}] [${level}] [${context}] ${message}`, data || '');
    }

    // Store log for debugging
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    return logEntry;
  }

  info(context, message, data = null) {
    return this.formatMessage('INFO', context, message, data);
  }

  warn(context, message, data = null) {
    return this.formatMessage('WARN', context, message, data);
  }

  error(context, message, data = null) {
    return this.formatMessage('ERROR', context, message, data);
  }

  debug(context, message, data = null) {
    if (this.config.DEBUG) {
      return this.formatMessage('DEBUG', context, message, data);
    }
  }

  /**
   * Get all stored logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

/**
 * Error Handler
 * Maps errors to user-friendly messages and handles recovery
 */
class ErrorHandler {
  constructor(config = CONFIG) {
    this.config = config;
    this.errorMap = config.ERROR_MESSAGES;
  }

  /**
   * Handle different types of errors
   */
  handle(error, context = 'Unknown') {
    console.error(`[ErrorHandler] Error in ${context}:`, error);

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: this.errorMap.NETWORK_ERROR,
        userMessage: 'Unable to connect. Please check your internet connection.',
        retryable: true
      };
    }

    // Auth errors
    if (error.message?.includes('Auth') || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return {
        code: 'AUTH_ERROR',
        message: this.errorMap.AUTH_FAILED,
        userMessage: 'Authentication failed. Please sign in again.',
        retryable: true
      };
    }

    // Gemini API errors
    if (error.message?.includes('Gemini') || error.message?.includes('429')) {
      return {
        code: 'GEMINI_ERROR',
        message: error.message.includes('429') ? this.errorMap.RATE_LIMIT : this.errorMap.GEMINI_ERROR,
        userMessage: error.message.includes('429') ? 'Too many requests. Please wait a moment and try again.' : 'Analysis failed. Please try again.',
        retryable: true
      };
    }

    // Configuration errors
    if (error.message?.includes('API key') || error.message?.includes('Client ID')) {
      return {
        code: 'CONFIG_ERROR',
        message: this.errorMap.API_KEY_MISSING,
        userMessage: 'Extension not properly configured. Please check your settings.',
        retryable: false
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || this.errorMap.UNKNOWN_ERROR,
      userMessage: this.errorMap.UNKNOWN_ERROR,
      retryable: true
    };
  }

  /**
   * Create a user-friendly error message
   */
  getUserMessage(error, context = 'Unknown') {
    const handled = this.handle(error, context);
    return handled.userMessage;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error, context = 'Unknown') {
    const handled = this.handle(error, context);
    return handled.retryable;
  }
}

/**
 * Retry Logic for failed operations
 */
class RetryHandler {
  static async retry(
    fn,
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    context = 'Operation'
  ) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const logger = new Logger(CONFIG);
        logger.debug('RetryHandler', `Attempt ${attempt}/${maxAttempts} for ${context}`);
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(`[RetryHandler] Attempt ${attempt} failed:`, error);

        if (attempt < maxAttempts) {
          const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`${context} failed after ${maxAttempts} attempts: ${lastError.message}`);
  }
}

// Create singleton instances
const logger = new Logger(CONFIG);
const errorHandler = new ErrorHandler(CONFIG);

// Export for use in other modules
