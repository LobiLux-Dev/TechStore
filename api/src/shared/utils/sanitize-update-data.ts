/**
 * Sanitizes update input data by converting any `null` values to `undefined`.
 * In Prisma, passing `undefined` preserves the existing value of the field in the database,
 * whereas passing `null` would set it to NULL (which may fail database constraints or overwrite valid data).
 */
export function sanitizeUpdateData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data } as any;
  for (const key of Object.keys(sanitized)) {
    if (sanitized[key] === null) {
      sanitized[key] = undefined;
    }
  }
  return sanitized as T;
}
