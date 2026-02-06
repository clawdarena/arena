import { Context, Next } from 'hono'
import { ZodSchema, z } from 'zod'

/**
 * Validate request body with a Zod schema.
 * Parsed data is available via c.req.valid('json') pattern — 
 * but since Hono's built-in validator has limitations,
 * we attach parsed data to a header-based workaround.
 * 
 * Use getParsedBody(c) to retrieve in route handlers.
 */

const PARSED_BODY_KEY = '__parsedBody'

export function validate<T extends ZodSchema>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json()
      const result = schema.safeParse(body)

      if (!result.success) {
        return c.json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: result.error.flatten().fieldErrors,
        }, 400)
      }

      // Store parsed body on the request
      ;(c as any)[PARSED_BODY_KEY] = result.data
      await next()
    } catch {
      return c.json({
        error: 'Invalid JSON body',
        code: 'INVALID_JSON',
      }, 400)
    }
  }
}

export function getParsedBody<T = any>(c: Context): T {
  return (c as any)[PARSED_BODY_KEY] as T
}
