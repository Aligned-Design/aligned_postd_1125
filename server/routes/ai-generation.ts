import { RequestHandler } from "express";
import {
  generateBuilderContent,
  generateDesignVisuals,
  validateAIProviders,
  getAvailableProviders,
} from "../workers/ai-generation";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

import type { AIGenerationRequest } from "@shared/api";

export const generateContent: RequestHandler = async (req, res) => {
  try {
    // Validate AI providers are configured
    if (!validateAIProviders()) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "No AI providers configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        undefined,
        "Please configure an AI provider and try again"
      );
    }

    const requestBody = req.body as AIGenerationRequest;
    const { prompt, agentType, provider } = requestBody;

    if (!prompt || !agentType) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required fields: prompt, agentType",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "Please provide both prompt and agentType in your request"
      );
    }

    const result = await generateBuilderContent({
      prompt,
      agentType,
      provider,
    });

    (res as any).json(result);
  } catch (error) {
    console.error("AI content generation failed:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Content generation failed",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

export const generateDesign: RequestHandler = async (req, res) => {
  try {
    // Validate AI providers are configured
    if (!validateAIProviders()) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "No AI providers configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        undefined,
        "Please configure an AI provider and try again"
      );
    }

    const { prompt, provider } = req.body as AIGenerationRequest;

    if (!prompt) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required field: prompt",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "Please provide a prompt in your request"
      );
    }

    const result = await generateDesignVisuals({
      prompt,
      agentType: "design",
      provider,
    });

    (res as any).json(result);
  } catch (error) {
    console.error("AI design generation failed:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Design generation failed",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

export const getProviders: RequestHandler = (req, res) => {
  try {
    const providers = getAvailableProviders();

    (res as any).json({
      success: true,
      providers,
      default: providers[0] || null,
    });
  } catch (error) {
    console.error("Failed to get AI providers:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to get providers",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};
