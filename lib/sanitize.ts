import sanitizeHtml from 'sanitize-html'
import { z } from 'zod'

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  allowedSchemes: [],
  disallowedTagsMode: 'discard',
}

export function sanitize(value: string): string {
  return sanitizeHtml(value, SANITIZE_OPTIONS).trim()
}

export function sanitizedString() {
  return z.string().transform((val) => sanitize(val))
}
