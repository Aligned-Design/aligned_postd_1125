import { RequestHandler } from "express";
import { generateWithAI, getAvailableProviders, getDefaultProvider, validateAIProviders } from "../workers/ai-generation";
import { AIGenerationRequest, AIGenerationResponse, AIProviderStatus } from "@shared/api";
import { AppError, asyncHandler } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

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
  const response: AIProviderStatus = {
    provider: getDefaultProvider() === "openai" ? "openai" : "anthropic",
    available: availableProviders.length > 0,
    modelName: getDefaultProvider() === "openai" ? "gpt-4o-mini" : "claude-3-opus"
  };
  res.json(response);
};
