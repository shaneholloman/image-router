import { z } from 'zod'
import { imageModels } from '../shared/imageModels/index.js'

const bodySchema = z.object({
  prompt: z.string({
    required_error: "'prompt' is a required parameter",
    invalid_type_error: "'prompt' must be a string"
  }).min(1, { message: "'prompt' is a required parameter" }),
  model: z.string({
    required_error: "'model' is a required parameter",
    invalid_type_error: "'model' must be a string"
  }).min(1, { message: "'model' is a required parameter" }),
  response_format: z.enum(['url', 'b64_json']).default('url'),
  quality: z.enum(['auto', 'low', 'medium', 'high']).default('auto')
})

export function validateImageParams(req) {
  const parseResult = bodySchema.safeParse(req.body)
  if (!parseResult.success) {
    throw new Error(parseResult.error.errors[0].message)
  }

  const { prompt, model, response_format, quality } = parseResult.data
  const files = req.files || {}

  if (model === 'google/gemini-2.0-flash-prev') {
    throw new Error("'google/gemini-2.0-flash-prev' is temporary disabled. Please use 'google/gemini-2.0-flash-exp' instead.")
  }

  const modelConfig = imageModels[model]
  if (!modelConfig) throw new Error(`model '${model}' is not available`)
  if (!modelConfig?.providers[0]?.id) throw new Error(`model provider for '${model}' is not available`)

  // Validate files
  const validFiles = {}
  if (files.image) {
    const images = Array.isArray(files.image) ? files.image : [files.image]
    if (images.length > 16) throw new Error('Maximum of 16 images can be uploaded')
    validFiles.image = images
  }
  if (files.mask) {
    validFiles.mask = Array.isArray(files.mask) ? files.mask[0] : files.mask
  }

  return { prompt, model, response_format, quality, files: validFiles }
}

export const imageRequestSchema = bodySchema
