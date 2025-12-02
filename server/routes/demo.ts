import { RequestHandler } from "express";
import { DemoResponse } from "@shared/api";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

/**
 * GET /api/demo
 * Simple demo endpoint for testing API connectivity
 * 
 * **Auth:** Not required (public endpoint)
 * **Response:** { message: string }
 */
export const handleDemo: RequestHandler = async (req, res, next) => {
  try {
    const response: DemoResponse = {
      message: "Hello from Express server",
    };
    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to process demo request",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        { originalError: error instanceof Error ? error.message : "Unknown error" }
      )
    );
  }
};
