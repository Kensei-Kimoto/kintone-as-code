/**
 * Utility functions for handling authentication and authorization errors
 * from Kintone API responses
 */

/**
 * Check if an error is related to authentication (401, invalid credentials, etc.)
 */
export function isAuthenticationError(error: any): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  // Check HTTP status code
  if (error.response?.status === 401) {
    return true;
  }

  // Check known authentication error codes
  const authErrorCodes = [
    'CB_UA01', // User authentication failed
    'CB_WA01', // Web authentication failed
    'CB_AU01', // API authentication failed
  ];
  
  if (error.code && authErrorCodes.includes(error.code)) {
    return true;
  }

  // Check error message patterns
  const authKeywords = [
    'authentication failed',
    'invalid username',
    'invalid password',
    'invalid credentials',
    'api token is invalid',
    'login required',
    'unauthorized access',
    'unauthorized',
  ];

  const message = (error.message || '').toLowerCase();
  return authKeywords.some(keyword => message.includes(keyword));
}

/**
 * Check if an error is related to authorization (403, permission denied, etc.)
 */
export function isAuthorizationError(error: any): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  // Check HTTP status code
  if (error.response?.status === 403) {
    return true;
  }

  // Check known authorization error codes
  const authzErrorCodes = [
    'CB_NO02', // No permission
    'CB_VA02', // Access validation failed
    'GAIA_AC01', // Access control violation
  ];
  
  if (error.code && authzErrorCodes.includes(error.code)) {
    return true;
  }

  // Check error message patterns
  const authzKeywords = [
    'permission denied',
    'access forbidden',
    'insufficient privileges',
    'you do not have permission',
    'operation not allowed',
    'forbidden access',
    'forbidden',
  ];

  const message = (error.message || '').toLowerCase();
  return authzKeywords.some(keyword => message.includes(keyword));
}

/**
 * Format authentication/authorization error messages with helpful context
 */
export function formatAuthErrorMessage(error: any): string {
  const isAuth = isAuthenticationError(error);
  const isAuthz = isAuthorizationError(error);
  
  let message = '';
  
  if (isAuth) {
    message += '🔐 Authentication failed: ';
    if (error.response?.status) {
      message += `HTTP ${error.response.status} - `;
    }
    if (error.code) {
      message += `Error code: ${error.code} - `;
    }
    message += maskSensitiveInfo(error.message || 'Invalid credentials');
    message += '\n\n';
    message += 'Please check your:\n';
    message += '• Username and password (if using password authentication)\n';
    message += '• API token (if using token authentication)\n';
    message += '• Base URL configuration\n';
    message += '• Network connectivity to the Kintone instance';
  } else if (isAuthz) {
    message += '🚫 Authorization failed: ';
    if (error.response?.status) {
      message += `HTTP ${error.response.status} - `;
    }
    if (error.code) {
      message += `Error code: ${error.code} - `;
    }
    message += maskSensitiveInfo(error.message || 'Permission denied');
    message += '\n\n';
    message += 'This operation requires additional permissions.\n';
    message += 'Please contact your Kintone administrator to:\n';
    message += '• Grant necessary app permissions\n';
    message += '• Verify API access settings\n';
    message += '• Check space or thread access rights';
  } else {
    message += '⚠️ Authentication or authorization failed: ';
    message += maskSensitiveInfo(error.message || 'Unknown error');
    message += '\n\nPlease verify your credentials and permissions.';
  }
  
  return message;
}

/**
 * Centralized error handler for Kintone API errors
 * @param error - The error object from API call
 * @returns boolean - true if operation should be retried, false if it should fail immediately
 */
export function handleKintoneApiError(error: any): boolean {
  if (!error) {
    console.error('❌ Unknown error occurred');
    process.exit(1);
    return false;
  }

  // Handle authentication errors - do not retry
  if (isAuthenticationError(error)) {
    const formattedMessage = formatAuthErrorMessage(error);
    console.error(formattedMessage);
    console.error('\n❌ Authentication failed - not retrying');
    logStructuredError(error);
    process.exit(1);
    return false;
  }

  // Handle authorization errors - do not retry
  if (isAuthorizationError(error)) {
    const formattedMessage = formatAuthErrorMessage(error);
    console.error(formattedMessage);
    console.error('\n❌ Authorization failed - not retrying');
    logStructuredError(error);
    process.exit(1);
    return false;
  }

  // Handle network errors - allow retry
  if (isNetworkError(error)) {
    console.error('🌐 Network error occurred:');
    console.error(`   ${error.message || 'Connection failed'}`);
    console.error('🔄 This error may be temporary - retrying may help');
    logStructuredError(error);
    return true;
  }

  // Handle timeout errors - allow retry
  if (isTimeoutError(error)) {
    console.error('⏱️ Request timeout occurred:');
    console.error(`   ${error.message || 'Request timed out'}`);
    console.error('🔄 The server may be busy - retrying may help');
    logStructuredError(error);
    return true;
  }

  // Handle rate limiting - allow retry
  if (error.response?.status === 429) {
    console.error('🚦 Rate limited by server:');
    console.error(`   ${error.message || 'Too many requests'}`);
    console.error('🔄 Please wait before retrying');
    logStructuredError(error);
    return true;
  }

  // Handle 5xx server errors - allow retry
  if (error.response?.status >= 500 && error.response?.status < 600) {
    console.error(`🔧 Server error (${error.response.status}):`);
    console.error(`   ${error.message || 'Internal server error'}`);
    console.error('🔄 Server may be temporarily unavailable - retrying may help');
    logStructuredError(error);
    return true;
  }

  // Handle other 4xx client errors - do not retry
  if (error.response?.status >= 400 && error.response?.status < 500) {
    console.error(`❌ Client error (${error.response.status}):`);
    console.error(`   ${error.message || 'Bad request'}`);
    console.error('💡 Please check your request parameters');
    logStructuredError(error);
    process.exit(1);
    return false;
  }

  // Handle unknown errors - do not retry
  console.error('❌ Unexpected error occurred:');
  console.error(`   ${error.message || String(error)}`);
  logStructuredError(error);
  process.exit(1);
  return false;
}

/**
 * Check if error is network-related
 */
function isNetworkError(error: any): boolean {
  const networkCodes = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'EAI_AGAIN',
  ];
  
  return error.code && networkCodes.includes(error.code);
}

/**
 * Check if error is timeout-related
 */
function isTimeoutError(error: any): boolean {
  const timeoutCodes = ['ETIMEDOUT', 'ESOCKETTIMEDOUT'];
  const timeoutKeywords = ['timeout', 'timed out'];
  
  if (error.code && timeoutCodes.includes(error.code)) {
    return true;
  }
  
  const message = (error.message || '').toLowerCase();
  return timeoutKeywords.some(keyword => message.includes(keyword));
}

/**
 * Log structured error information for debugging
 */
function logStructuredError(error: any): void {
  const errorInfo = {
    status: error.response?.status,
    code: error.code,
    message: maskSensitiveInfo(error.message || ''),
    url: error.config?.url,
    method: error.config?.method?.toUpperCase(),
  };

  // Remove undefined fields
  const cleanedInfo = Object.fromEntries(
    Object.entries(errorInfo).filter(([_, value]) => value !== undefined)
  );

  if (Object.keys(cleanedInfo).length > 0) {
    console.error('\n📋 Error details:');
    for (const [key, value] of Object.entries(cleanedInfo)) {
      console.error(`   ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
    }
  }
}

/**
 * Mask sensitive information in error messages and logs
 */
export function maskSensitiveInfo(text: string): string {
  if (!text) return text;
  
  // Context-based patterns (run first to avoid false positives)
  
  // Mask API tokens with known prefixes
  text = text.replace(/(api[_\s-]*token[:\s]+)([a-zA-Z0-9]{20,})/gi, '$1[REDACTED]');
  text = text.replace(/(api[_\s-]*key[:\s]+)([a-zA-Z0-9]{20,})/gi, '$1[REDACTED]');
  text = text.replace(/(access[_\s-]*token[:\s]+)([a-zA-Z0-9]{20,})/gi, '$1[REDACTED]');
  text = text.replace(/(secret[_\s-]*key[:\s]+)([a-zA-Z0-9]{20,})/gi, '$1[REDACTED]');
  
  // Generic token/key patterns with context
  text = text.replace(/(token[:\s]+)([a-zA-Z0-9]{20,})/gi, '$1[REDACTED]');
  text = text.replace(/(key[:\s]+)([a-zA-Z0-9]{20,})/gi, '$1[REDACTED]');
  
  // Bearer tokens
  text = text.replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]');
  
  // Authorization headers
  text = text.replace(/(authorization[:\s]+bearer\s+)([a-zA-Z0-9+/=._-]+)/gi, '$1[REDACTED]');
  
  // Base64-like strings with typical token characteristics (length 30+, mixed case, symbols)
  // Avoid matching common words with hyphens or version numbers
  text = text.replace(/\b[A-Za-z0-9+/]{30,}={0,2}\b/g, '[REDACTED]');
  
  // JWT-like patterns (three base64 segments separated by dots, each segment 4+ chars)
  text = text.replace(/\b[a-zA-Z0-9_-]{4,}\.[a-zA-Z0-9_-]{4,}\.[a-zA-Z0-9_-]{4,}\b/g, '[REDACTED]');
  
  // UUID-like patterns that might be secrets
  text = text.replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, '[REDACTED]');
  
  // Password patterns
  text = text.replace(/password[:\s]*[^\s,}]+/gi, 'password: [REDACTED]');
  
  return text;
}