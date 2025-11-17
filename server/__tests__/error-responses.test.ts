import { describe, it, expect } from "vitest";
import {
  createErrorResponse,
  createValidationErrorResponse,
  ErrorCode,
  ErrorScenarios,
  getSeverityForStatus,
  isErrorStatus,
  HTTP_STATUS,
} from "../lib/error-responses";

describe("Error Responses", () => {
  describe("createErrorResponse", () => {
    it("should create a properly formatted error response", () => {
      const error = createErrorResponse(
        ErrorCode.NOT_FOUND,
        "Resource not found",
        "info"
      );

      expect(error.error).toBeDefined();
      expect(error.error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.error.message).toBe("Resource not found");
      expect(error.error.severity).toBe("info");
      expect(error.error.timestamp).toBeDefined();
    });

    it("should include optional fields when provided", () => {
      const error = createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        "Invalid input",
        "warning",
        { field: "email" },
        "Please provide a valid email address"
      );

      expect(error.error.details).toEqual({ field: "email" });
      expect(error.error.suggestion).toBe("Please provide a valid email address");
    });

    it("should omit optional fields when not provided", () => {
      const error = createErrorResponse(
        ErrorCode.UNAUTHORIZED,
        "Not authenticated",
        "warning"
      );

      expect(error.error.details).toBeUndefined();
      expect(error.error.suggestion).toBeUndefined();
    });

    it("should use default severity of 'error'", () => {
      const error = createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        "Something went wrong"
      );

      expect(error.error.severity).toBe("error");
    });
  });

  describe("createValidationErrorResponse", () => {
    it("should create a validation error with field-level errors", () => {
      const fieldErrors = [
        { field: "email", message: "Invalid email", code: "INVALID_FORMAT" },
        { field: "password", message: "Too short", code: "OUT_OF_RANGE" },
      ];

      const error = createValidationErrorResponse(fieldErrors);

      expect(error.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.error.message).toBe("Request validation failed");
      expect(error.error.severity).toBe("warning");
      expect(error.error.validationErrors).toEqual(fieldErrors);
      expect(error.error.suggestion).toBeDefined();
    });

    it("should include optional details", () => {
      const fieldErrors = [
        { field: "age", message: "Must be >= 18", code: "OUT_OF_RANGE" },
      ];

      const error = createValidationErrorResponse(fieldErrors, {
        minimumAge: 18,
      });

      expect(error.error.details).toEqual({ minimumAge: 18 });
    });
  });

  describe("ErrorScenarios", () => {
    it("should provide unauthorized error scenario", () => {
      const scenario = ErrorScenarios.unauthorized();

      expect(scenario.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(scenario.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(scenario.suggestion).toBeDefined();
    });

    it("should provide forbidden error scenario with resource name", () => {
      const scenario = ErrorScenarios.forbidden("document");

      expect(scenario.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(scenario.code).toBe(ErrorCode.FORBIDDEN);
      expect(scenario.message).toContain("document");
    });

    it("should provide not found error scenario", () => {
      const scenario = ErrorScenarios.notFound("user");

      expect(scenario.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(scenario.code).toBe(ErrorCode.NOT_FOUND);
      expect(scenario.severity).toBe("info");
    });

    it("should provide duplicate resource error scenario", () => {
      const scenario = ErrorScenarios.duplicateResource("email");

      expect(scenario.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(scenario.code).toBe(ErrorCode.DUPLICATE_RESOURCE);
      expect(scenario.message).toContain("email");
    });

    it("should provide rate limit exceeded scenario with retry info", () => {
      const scenario = ErrorScenarios.rateLimitExceeded(60);

      expect(scenario.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(scenario.details?.retryAfter).toBe(60);
    });

    it("should provide internal error scenario", () => {
      const scenario = ErrorScenarios.internalError();

      expect(scenario.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(scenario.severity).toBe("critical");
    });

    it("should provide service unavailable scenario", () => {
      const scenario = ErrorScenarios.serviceUnavailable();

      expect(scenario.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(scenario.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    });

    it("should provide external service error scenario", () => {
      const scenario = ErrorScenarios.externalServiceError("Stripe");

      expect(scenario.message).toContain("Stripe");
      expect(scenario.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
    });
  });

  describe("getSeverityForStatus", () => {
    it("should return 'info' for 2xx status codes", () => {
      expect(getSeverityForStatus(200)).toBe("info");
      expect(getSeverityForStatus(201)).toBe("info");
      expect(getSeverityForStatus(204)).toBe("info");
    });

    it("should return 'warning' for 4xx status codes", () => {
      expect(getSeverityForStatus(400)).toBe("warning");
      expect(getSeverityForStatus(401)).toBe("warning");
      expect(getSeverityForStatus(403)).toBe("warning");
      expect(getSeverityForStatus(404)).toBe("warning");
      expect(getSeverityForStatus(422)).toBe("warning");
    });

    it("should return 'critical' for 5xx status codes", () => {
      expect(getSeverityForStatus(500)).toBe("critical");
      expect(getSeverityForStatus(502)).toBe("critical");
      expect(getSeverityForStatus(503)).toBe("critical");
    });

    it("should return 'error' for unknown status codes", () => {
      expect(getSeverityForStatus(600)).toBe("error");
    });
  });

  describe("isErrorStatus", () => {
    it("should return false for successful status codes", () => {
      expect(isErrorStatus(200)).toBe(false);
      expect(isErrorStatus(201)).toBe(false);
      expect(isErrorStatus(204)).toBe(false);
      expect(isErrorStatus(301)).toBe(false);
    });

    it("should return true for error status codes", () => {
      expect(isErrorStatus(400)).toBe(true);
      expect(isErrorStatus(401)).toBe(true);
      expect(isErrorStatus(404)).toBe(true);
      expect(isErrorStatus(500)).toBe(true);
    });
  });
});
