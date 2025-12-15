/**
 * OpenAI Payload Sanitizer
 * 
 * Enforces model capability constraints by removing unsupported parameters
 * based on the model being used. This prevents API errors when using models
 * with limited parameter support (e.g., gpt-5* series).
 * 
 * **CRITICAL**: This function MUST be called immediately before every
 * OpenAI API call to ensure parameters are compatible with the model.
 */

/**
 * OpenAI API payload interface
 * Represents the structure sent to chat.completions.create()
 */
export interface OpenAIPayload {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_completion_tokens?: number;
  temperature?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  [key: string]: unknown; // Allow other optional parameters
}

/**
 * Model capability flags
 */
interface ModelCapabilities {
  supportsTemperature: boolean;
  supportsPenalties: boolean;
}

/**
 * Determine model capabilities based on model name
 * 
 * @param model - OpenAI model identifier (e.g., "gpt-5-mini", "gpt-4o")
 * @returns Capability flags for the model
 */
function getModelCapabilities(model: string): ModelCapabilities {
  // gpt-5* models (mini, nano, etc.) have limited parameter support
  // They do not support: temperature, presence_penalty, frequency_penalty
  const isGpt5Model = model.startsWith("gpt-5");
  
  return {
    supportsTemperature: !isGpt5Model,
    supportsPenalties: !isGpt5Model,
  };
}

/**
 * Sanitize OpenAI payload by removing unsupported parameters
 * 
 * This function creates a new payload object with only the parameters
 * supported by the target model. Unsupported parameters are removed
 * to prevent API errors.
 * 
 * **Model-specific behavior:**
 * - **gpt-5* models**: Remove temperature, presence_penalty, frequency_penalty
 * - **gpt-4* and other models**: Keep all parameters
 * 
 * @param payload - Original payload with potentially unsupported parameters
 * @returns Sanitized payload safe to send to OpenAI API
 * 
 * @example
 * ```typescript
 * const payload = {
 *   model: "gpt-5-mini",
 *   messages: [...],
 *   temperature: 0.7,
 *   presence_penalty: 0.1,  // Will be removed for gpt-5-mini
 * };
 * 
 * const sanitized = sanitizeOpenAIPayload(payload);
 * // sanitized will NOT contain temperature or presence_penalty
 * 
 * const response = await client.chat.completions.create(sanitized);
 * ```
 */
export function sanitizeOpenAIPayload(payload: OpenAIPayload): any {
  const { model } = payload;
  const capabilities = getModelCapabilities(model);
  
  // Start with base required fields
  const sanitized: OpenAIPayload = {
    model: payload.model,
    messages: payload.messages,
  };
  
  // Add max_completion_tokens if present (supported by all models)
  if (payload.max_completion_tokens !== undefined) {
    sanitized.max_completion_tokens = payload.max_completion_tokens;
  }
  
  // Only add temperature if model supports it
  if (capabilities.supportsTemperature && payload.temperature !== undefined) {
    sanitized.temperature = payload.temperature;
  }
  
  // Only add penalty parameters if model supports them
  if (capabilities.supportsPenalties) {
    if (payload.presence_penalty !== undefined) {
      sanitized.presence_penalty = payload.presence_penalty;
    }
    if (payload.frequency_penalty !== undefined) {
      sanitized.frequency_penalty = payload.frequency_penalty;
    }
  }
  
  // Pass through any other parameters as-is (e.g., top_p, stop, etc.)
  // but skip the ones we've already handled
  const handledKeys = new Set([
    'model',
    'messages',
    'max_completion_tokens',
    'temperature',
    'presence_penalty',
    'frequency_penalty',
  ]);
  
  for (const [key, value] of Object.entries(payload)) {
    if (!handledKeys.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Type guard to check if a payload is valid
 * 
 * @param payload - Payload to validate
 * @returns True if payload has required fields
 */
export function isValidOpenAIPayload(payload: unknown): payload is OpenAIPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }
  
  const p = payload as Record<string, unknown>;
  return (
    typeof p.model === 'string' &&
    Array.isArray(p.messages) &&
    p.messages.length > 0
  );
}

