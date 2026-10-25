
/**
 * Utility to retry an async function with exponential backoff.
 * Especially useful for handling 429 (Rate Limit) errors from GenAI API.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable (429 or 5xx)
      const errorStr = String(error?.message || error || "").toLowerCase();
      const isRateLimit = errorStr.includes('429') || errorStr.includes('resource_exhausted') || errorStr.includes('quota');
      const isServerError = errorStr.includes('500') || errorStr.includes('503') || errorStr.includes('internal error');
      
      const isRetryable = isRateLimit || isServerError;

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay: baseDelay * 2^attempt + random jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`API call failed (attempt ${attempt + 1}). Retrying in ${Math.round(delay)}ms...`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
