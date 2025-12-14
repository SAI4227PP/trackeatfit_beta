/**
 * @fileoverview Provides HTTP request utilities with timeout, retries, and robust error handling.
 * Fetch-based solution for flexibility in enterprise applications.
 */

/**
 * Performs a fetch request with timeout and retry logic.
 * @param {string|Request} resource - The resource to fetch.
 * @param {Object} [options={}] - Fetch options.
 * @param {number} [timeout=30000] - Timeout in milliseconds (default: 30,000ms).
 * @param {number} [retries=0] - Number of retry attempts on failure.
 * @returns {Promise<Response>} - The fetch response.
 * @throws {Error} - Throws on timeout or HTTP/network errors after all retries.
 */
export async function fetchWithTimeout(resource, options = {}, timeout = 30000, retries = 0) {
  if (typeof resource !== 'string' && !(resource instanceof Request)) {
    throw new TypeError('The "resource" parameter must be a URL string or Request object.');
  }
  if (typeof timeout !== 'number' || timeout <= 0) {
    throw new TypeError('The "timeout" parameter must be a positive number (milliseconds).');
  }

  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Don't throw for HTTP errors here, just return the response
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      if (attempt === retries) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeout}ms and ${retries} retries.`);
        }
        // Only throw as network error if it's a real network error
        if (
          error.message &&
          (
            error.message.toLowerCase().includes('network') ||
            error.message.toLowerCase().includes('failed to fetch')
          )
        ) {
          throw new Error('Network error: ' + error.message);
        }
        throw error;
      }

      console.warn(
        `[fetchWithTimeout] Attempt ${attempt + 1} failed: ${error.message}. Retrying...`
      );

      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000) + Math.random() * 1000;
      await new Promise(res => setTimeout(res, delay));
      attempt++;
    }
  }

  throw lastError || new Error('Unknown error occurred in fetchWithTimeout.');
}

/*
 * Usage Example:
 *   import { fetchWithTimeout } from '../utils/requestWithTimeout';
 *   await fetchWithTimeout(url, options, 8000, 2); // 2 retries, 8s timeout
 */
