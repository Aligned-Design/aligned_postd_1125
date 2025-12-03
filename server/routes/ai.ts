import { RequestHandler } from "express";
import { generateWithAI, getAvailableProviders, getDefaultProvider, validateAIProviders } from "../workers/ai-generation";
import { AIGenerationRequest, AIGenerationResponse, AIProviderStatus } from "@shared/api";
import { AppError, asyncHandler } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { DEFAULT_OPENAI_MODEL } from "../lib/openai-client";

export const generateContent: RequestHandler = asyncHandler(async (req, res) => {
  if (!validateAIProviders()) {
    throw new AppError(
      ErrorCode.SERVICE_UNAVAILABLE,
      "No AI providers configured",
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      "critical",
      { providers: getAvailableProviders() },
      "Please configure AI providers in your environment and try again"
    );
  }

  const { prompt, agentType, provider } = req.body as AIGenerationRequest;

  if (!prompt || !agentType) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Missing required fields: prompt and agentType",
      HTTP_STATUS.BAD_REQUEST,
      "warning",
      { missingFields: ["prompt", "agentType"] },
      "Please provide both prompt and agentType in your request"
    );
  }

  const result = await generateWithAI(prompt, agentType, provider);

  const response: AIGenerationResponse = {
    content: result.content,
    provider: provider || getDefaultProvider(),
    agentType
  };

  res.json(response);
});

export const getProviderStatus: RequestHandler = (req, res) => {
  const availableProviders = getAvailableProviders();
  const defaultProvider = getDefaultProvider();
  
  // Get actual model name from provider (not hard-coded)
  let modelName = "unknown";
  if (defaultProvider === "openai") {
    modelName = DEFAULT_OPENAI_MODEL;
  } else if (defaultProvider === "claude") {
    // Use ANTHROPIC_MODEL if set, otherwise use a sensible default
    // Note: This is a status endpoint, so we use a representative default
    // Actual generation uses agent-specific models via getClaudeModel()
    modelName = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  }
  
  const response: AIProviderStatus = {
    provider: defaultProvider === "openai" ? "openai" : "anthropic",
    available: availableProviders.length > 0,
    modelName
  };
  res.json(response);
};
