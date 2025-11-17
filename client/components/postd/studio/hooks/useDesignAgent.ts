/**
 * useDesignAgent
 * 
 * React Query hook for generating visual concepts with The Creative.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AiDesignGenerationRequest, AiDesignGenerationResponse, AiDesignVariant } from "@/lib/types/aiContent";

async function fetchDesignContent(request: AiDesignGenerationRequest): Promise<AiDesignGenerationResponse> {
  // Validate required fields before sending
  if (!request.brandId) {
    throw new Error("Brand ID is required");
  }

  if (!request.platform) {
    throw new Error("Platform is required");
  }

  if (!request.format) {
    throw new Error("Format is required");
  }

  // Validate brandId is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(request.brandId)) {
    throw new Error("Invalid brand ID format. Please select a valid brand.");
  }

  const response = await fetch("/api/ai/design", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let validationErrors: Array<{ field: string; message: string }> = [];
    
    try {
      const errorData = await response.json();
      
      // Extract error code for programmatic handling
      const errorCode = errorData.error?.code;
      
      // Handle structured error responses from backend
      if (errorData.error) {
        // Check for validation errors
        if (errorData.error.validationErrors && Array.isArray(errorData.error.validationErrors)) {
          validationErrors = errorData.error.validationErrors;
          const fieldMessages = validationErrors.map(err => `${err.field}: ${err.message}`).join(", ");
          errorMessage = `Validation failed: ${fieldMessages}`;
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message;
        } else if (typeof errorData.error === "string") {
          errorMessage = errorData.error;
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === "string") {
        errorMessage = errorData;
      }
      
      // Handle specific error codes
      if (errorCode === "INVALID_BRAND") {
        errorMessage = "Brand not found or you don't have access to this brand. Please select a valid brand.";
      } else if (errorCode === "NO_BRAND_GUIDE") {
        errorMessage = errorData.error?.message || "This brand doesn't have a Brand Guide yet. Please create one first.";
        // Attach suggestion if provided
        if (errorData.error?.details?.suggestion) {
          errorMessage += ` ${errorData.error.details.suggestion}`;
        }
      }
      
      // Add more context for common errors
      if (response.status === 400) {
        // Check validation errors first
        if (validationErrors.length > 0) {
          const missingFields = validationErrors
            .filter(err => err.message.includes("required") || err.message.includes("Missing"))
            .map(err => err.field);
          
          if (missingFields.length > 0) {
            errorMessage = `Missing required fields: ${missingFields.join(", ")}. Please check your input.`;
          } else {
            errorMessage = `Invalid input: ${validationErrors.map(e => e.message).join(", ")}`;
          }
        } else if (errorMessage.includes("brandId") || errorMessage.includes("Brand ID") || errorMessage.includes("Invalid brand ID")) {
          errorMessage = "Missing or invalid brand context. Please select a brand.";
        } else if (errorMessage.includes("platform") || errorMessage.includes("Platform")) {
          errorMessage = "Platform is required. Please select a platform.";
        } else if (errorMessage.includes("format") || errorMessage.includes("Format")) {
          errorMessage = "Format is required. Please select a format.";
        } else if (errorMessage.includes("Missing") || errorMessage.includes("required")) {
          errorMessage = `Missing required field: ${errorMessage}`;
        } else if (errorMessage.includes("Validation failed") || errorMessage.includes("validation")) {
          // Already formatted above
        } else {
          errorMessage = `Invalid request: ${errorMessage}`;
        }
      } else if (response.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to generate designs for this brand.";
      } else if (response.status >= 500) {
        errorMessage = "Server error. Please try again in a moment.";
      }
    } catch (parseError) {
      // If we can't parse the error, use the status code
      if (response.status === 400) {
        errorMessage = "Invalid request. Please check your input and try again.";
      } else if (response.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to generate designs for this brand.";
      } else if (response.status >= 500) {
        errorMessage = "Server error. Please try again in a moment.";
      }
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

export function useDesignAgent() {
  const [variants, setVariants] = useState<AiDesignVariant[]>([]);

  const mutation = useMutation({
    mutationFn: fetchDesignContent,
    onSuccess: (data) => {
      setVariants(data.variants);
    },
    onError: () => {
      setVariants([]);
    },
  });

  const generate = async (request: AiDesignGenerationRequest) => {
    await mutation.mutateAsync(request);
  };

  const reset = () => {
    setVariants([]);
    mutation.reset();
  };

  return {
    data: mutation.data,
    variants,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error instanceof Error ? mutation.error : undefined,
    generate,
    reset,
  };
}

