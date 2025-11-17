/**
 * useDocAgent
 * 
 * React Query hook for generating text content with The Copywriter.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AiDocGenerationRequest, AiDocGenerationResponse, AiDocVariant } from "@/lib/types/aiContent";

async function fetchDocContent(request: AiDocGenerationRequest): Promise<AiDocGenerationResponse> {
  const response = await fetch("/api/ai/doc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let errorCode: string | undefined;
    try {
      const errorData = await response.json();
      // Extract error code for programmatic handling
      errorCode = errorData.error?.code;
      
      // Handle structured error format from backend
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === "string" ? errorData.error : "Failed to generate content";
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
      
      // Include validation errors if present
      if (errorData.error?.details?.validationErrors) {
        const validationErrors = errorData.error.details.validationErrors;
        const errorList = Object.entries(validationErrors)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
          .join("; ");
        errorMessage = `${errorMessage} (${errorList})`;
      }
    } catch {
      // If JSON parsing fails, use default message
      errorMessage = `Failed to generate content (HTTP ${response.status})`;
    }
    
    const error = new Error(errorMessage);
    (error as any).code = errorCode;
    throw error;
  }

  return response.json();
}

export function useDocAgent() {
  const [variants, setVariants] = useState<AiDocVariant[]>([]);

  const mutation = useMutation({
    mutationFn: fetchDocContent,
    onSuccess: (data) => {
      setVariants(data.variants);
    },
    onError: () => {
      setVariants([]);
    },
  });

  const generate = async (request: AiDocGenerationRequest) => {
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

