/**
 * src/lib/apiResponse.js
 *
 * Standardised API response helpers.
 * Every route should use these — consistent shape makes frontend error handling simple.
 *
 * Success shape:
 *   { success: true, data: {...}, error: null, meta: { page, total, limit } | null }
 *
 * Error shape:
 *   { success: false, data: null, error: { code: string, message: string } }
 *
 * Usage in a route:
 *   import { ok, err } from '@/lib/apiResponse'
 *   return ok(res, { assessments })
 *   return err(res, 'ASSESSMENT_NOT_FOUND', 'Assessment not found.', 404)
 */

import { NextResponse } from 'next/server'

/**
 * Success response
 * @param {any}    data  - the payload
 * @param {object} meta  - optional pagination meta { page, total, limit }
 * @param {number} status - HTTP status (default 200)
 */
export function ok(data, meta = null, status = 200) {
  return NextResponse.json(
    { success: true, data, error: null, meta },
    { status }
  )
}

/**
 * Error response
 * @param {string} code    - machine-readable error code (SCREAMING_SNAKE_CASE)
 * @param {string} message - user-friendly message (shown in toasts / UI)
 * @param {number} status  - HTTP status (default 400)
 */
export function err(code, message, status = 400) {
  return NextResponse.json(
    { success: false, data: null, error: { code, message } },
    { status }
  )
}

/**
 * Common error shortcuts
 */
export const ERRORS = {
  unauthorized:   () => err('UNAUTHORIZED',     'Please log in to continue.',              401),
  forbidden:      () => err('FORBIDDEN',        'You don\'t have permission to do that.',  403),
  notFound:       (thing = 'Resource') =>
                       err('NOT_FOUND',         `${thing} not found.`,                    404),
  serverError:    () => err('SERVER_ERROR',     'Something went wrong. Please try again.', 500),
  badRequest:     (msg = 'Invalid request.') =>
                       err('BAD_REQUEST',        msg,                                      400),
  validationFail: (msg) =>
                       err('VALIDATION_ERROR',   msg,                                      422),
}

/**
 * Wrap an async route handler with consistent error catching.
 * Usage:
 *   export const GET = withErrorHandling(async (req) => {
 *     const data = await fetchSomething()
 *     return ok(data)
 *   })
 */
export function withErrorHandling(handler) {
  return async (...args) => {
    try {
      return await handler(...args)
    } catch (e) {
      console.error('[API Error]', e)
      return ERRORS.serverError()
    }
  }
}