/**
 * Error Classifier - Maps partner-specific errors to canonical taxonomy
 *
 * Each platform returns different error formats. This classifier translates them
 * into the canonical taxonomy for consistent handling system-wide.
 */

import {
  ErrorCode,
  ErrorAction,
  ClassifiedError,
  getTaxonomyEntry,
  ERROR_TAXONOMY,
} from './error-taxonomy';
import { logger } from '../observability';

/**
 * Platform-specific error mapping functions
 */

/**
 * Classify Meta (Facebook/Instagram) API errors
 */
function classifyMetaError(
  statusCode: number,
  errorData: any
): ErrorCode {
  // Handle OAuth errors
  if (errorData?.error?.type === 'OAuthException') {
    const message = errorData.error?.message || '';
    if (message.includes('expired')) return ErrorCode.AUTH_EXPIRED;
    if (message.includes('Invalid')) return ErrorCode.AUTH_INVALID;
    if (message.includes('revoked')) return ErrorCode.AUTH_REVOKED;
    if (message.includes('permission')) return ErrorCode.PERMISSION_INSUFFICIENT;
  }

  // Handle HTTP status codes
  switch (statusCode) {
    case 400:
      return ErrorCode.PAYLOAD_INVALID_4XX;
    case 401:
      return ErrorCode.AUTH_INVALID;
    case 403:
      return ErrorCode.PERMISSION_INSUFFICIENT;
    case 404:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case 429:
      return ErrorCode.RATE_LIMIT_429;
    case 500:
    case 502:
    case 503:
      return ErrorCode.PARTNER_5XX;
    case 504:
      return ErrorCode.PARTNER_TIMEOUT;
    default:
      if (statusCode >= 500) return ErrorCode.PARTNER_5XX;
      if (statusCode >= 400) return ErrorCode.PAYLOAD_INVALID_4XX;
      return ErrorCode.UNKNOWN;
  }
}

/**
 * Classify LinkedIn API errors
 */
function classifyLinkedInError(
  statusCode: number,
  errorData: any
): ErrorCode {
  // LinkedIn-specific error handling
  const message = errorData?.message || '';

  if (message.includes('expired') || message.includes('401')) {
    return ErrorCode.AUTH_EXPIRED;
  }

  if (message.includes('Insufficient')) {
    return ErrorCode.PERMISSION_INSUFFICIENT;
  }

  // HTTP status-based classification
  switch (statusCode) {
    case 400:
      return ErrorCode.PAYLOAD_INVALID_4XX;
    case 401:
      return ErrorCode.AUTH_INVALID;
    case 403:
      return ErrorCode.PERMISSION_INSUFFICIENT;
    case 404:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case 429:
      return ErrorCode.RATE_LIMIT_429;
    case 500:
    case 502:
    case 503:
      return ErrorCode.PARTNER_5XX;
    case 504:
      return ErrorCode.PARTNER_TIMEOUT;
    default:
      if (statusCode >= 500) return ErrorCode.PARTNER_5XX;
      if (statusCode >= 400) return ErrorCode.PAYLOAD_INVALID_4XX;
      return ErrorCode.UNKNOWN;
  }
}

/**
 * Classify TikTok API errors
 */
function classifyTikTokError(
  statusCode: number,
  errorData: any
): ErrorCode {
  const errorCode = errorData?.error?.code || '';

  // TikTok-specific codes
  if (errorCode === '40001' || errorCode === '40000') {
    return ErrorCode.AUTH_INVALID;
  }

  if (errorCode === '40002') {
    return ErrorCode.PERMISSION_INSUFFICIENT;
  }

  // HTTP status-based classification
  switch (statusCode) {
    case 400:
      return ErrorCode.PAYLOAD_INVALID_4XX;
    case 401:
      return ErrorCode.AUTH_INVALID;
    case 403:
      return ErrorCode.PERMISSION_INSUFFICIENT;
    case 404:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case 429:
      return ErrorCode.RATE_LIMIT_429;
    case 500:
    case 502:
    case 503:
      return ErrorCode.PARTNER_5XX;
    case 504:
      return ErrorCode.PARTNER_TIMEOUT;
    default:
      if (statusCode >= 500) return ErrorCode.PARTNER_5XX;
      if (statusCode >= 400) return ErrorCode.PAYLOAD_INVALID_4XX;
      return ErrorCode.UNKNOWN;
  }
}

/**
 * Classify Google Business Profile (GBP) errors
 */
function classifyGBPError(
  statusCode: number,
  errorData: any
): ErrorCode {
  const errorCode = errorData?.error?.code || '';

  if (errorCode === 'UNAUTHENTICATED') {
    return ErrorCode.AUTH_INVALID;
  }

  if (errorCode === 'PERMISSION_DENIED') {
    return ErrorCode.PERMISSION_INSUFFICIENT;
  }

  // HTTP status-based classification
  switch (statusCode) {
    case 400:
      return ErrorCode.PAYLOAD_INVALID_4XX;
    case 401:
      return ErrorCode.AUTH_INVALID;
    case 403:
      return ErrorCode.PERMISSION_INSUFFICIENT;
    case 404:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case 429:
      return ErrorCode.RATE_LIMIT_429;
    case 500:
    case 502:
    case 503:
      return ErrorCode.PARTNER_5XX;
    case 504:
      return ErrorCode.PARTNER_TIMEOUT;
    default:
      if (statusCode >= 500) return ErrorCode.PARTNER_5XX;
      if (statusCode >= 400) return ErrorCode.PAYLOAD_INVALID_4XX;
      return ErrorCode.UNKNOWN;
  }
}

/**
 * Classify Mailchimp API errors
 */
function classifyMailchimpError(
  statusCode: number,
  errorData: any
): ErrorCode {
  // Mailchimp-specific error handling
  const errorType = errorData?.type || '';

  if (errorType.includes('Unauthorized') || statusCode === 401) {
    return ErrorCode.AUTH_INVALID;
  }

  if (errorType.includes('Forbidden') || statusCode === 403) {
    return ErrorCode.PERMISSION_INSUFFICIENT;
  }

  // HTTP status-based classification
  switch (statusCode) {
    case 400:
      return ErrorCode.PAYLOAD_INVALID_4XX;
    case 401:
      return ErrorCode.AUTH_INVALID;
    case 403:
      return ErrorCode.PERMISSION_INSUFFICIENT;
    case 404:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case 429:
      return ErrorCode.RATE_LIMIT_429;
    case 500:
    case 502:
    case 503:
      return ErrorCode.PARTNER_5XX;
    case 504:
      return ErrorCode.PARTNER_TIMEOUT;
    default:
      if (statusCode >= 500) return ErrorCode.PARTNER_5XX;
      if (statusCode >= 400) return ErrorCode.PAYLOAD_INVALID_4XX;
      return ErrorCode.UNKNOWN;
  }
}

/**
 * Classify an error from a partner API
 *
 * @param platform - Platform identifier (meta, linkedin, tiktok, gbp, mailchimp)
 * @param statusCode - HTTP status code
 * @param errorData - Parsed error response from partner API
 * @returns ClassifiedError with action and metadata
 */
export function classifyPartnerError(
  platform: string,
  statusCode: number,
  errorData: any
): ClassifiedError {
  let errorCode: ErrorCode;

  // Classify based on platform
  switch (platform.toLowerCase()) {
    case 'meta':
      errorCode = classifyMetaError(statusCode, errorData);
      break;
    case 'linkedin':
      errorCode = classifyLinkedInError(statusCode, errorData);
      break;
    case 'tiktok':
      errorCode = classifyTikTokError(statusCode, errorData);
      break;
    case 'gbp':
      errorCode = classifyGBPError(statusCode, errorData);
      break;
    case 'mailchimp':
      errorCode = classifyMailchimpError(statusCode, errorData);
      break;
    default:
      errorCode = ErrorCode.UNKNOWN;
  }

  return getTaxonomyEntry(errorCode);
}

/**
 * Classify network/system errors
 */
export function classifySystemError(error: Error): ClassifiedError {
  const message = error.message.toLowerCase();

  if (message.includes('timeout')) {
    return getTaxonomyEntry(ErrorCode.TIMEOUT);
  }

  if (
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('network')
  ) {
    return getTaxonomyEntry(ErrorCode.NETWORK_ERROR);
  }

  if (message.includes('ssl') || message.includes('certificate')) {
    return getTaxonomyEntry(ErrorCode.SSL_ERROR);
  }

  return getTaxonomyEntry(ErrorCode.UNKNOWN);
}

/**
 * Result of error classification for action handling
 */
export interface ErrorClassificationResult {
  errorCode: ErrorCode;
  action: ErrorAction;
  retryable: boolean;
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  requiresReauth: boolean;
  pausesChannel: boolean;
  userMessage: string;
  systemMessage: string;
}

/**
 * Classify error and return action result
 */
export function classifyAndActionError(
  platform: string,
  statusCode: number,
  errorData: any,
  context?: {
    tenantId?: string;
    connectionId?: string;
    attemptNumber?: number;
  }
): ErrorClassificationResult {
  const classified = classifyPartnerError(platform, statusCode, errorData);

  // Log the classification
  logger.warn(
    {
      platform,
      statusCode,
      errorCode: classified.code,
      action: classified.action,
      retryable: classified.retryable,
      tenantId: context?.tenantId,
      connectionId: context?.connectionId,
      attemptNumber: context?.attemptNumber,
    },
    'Error classified'
  );

  return {
    errorCode: classified.code,
    action: classified.action,
    retryable: classified.retryable,
    maxRetries: classified.maxRetries,
    backoffMs: classified.backoffBase,
    backoffMultiplier: classified.backoffMultiplier,
    requiresReauth: classified.requiresReauth,
    pausesChannel: classified.pausesChannel,
    userMessage: classified.userMessage,
    systemMessage: classified.systemMessage,
  };
}

/**
 * Determine if should retry based on attempt number and configuration
 */
export function shouldRetry(
  classification: ErrorClassificationResult,
  attemptNumber: number
): boolean {
  if (!classification.retryable) {
    return false;
  }

  if (attemptNumber > classification.maxRetries) {
    return false;
  }

  return true;
}

/**
 * Calculate next retry delay in milliseconds
 */
export function getNextRetryDelay(
  classification: ErrorClassificationResult,
  attemptNumber: number
): number {
  if (!classification.retryable) {
    return 0;
  }

  // Calculate exponential backoff: base * (multiplier ^ attemptNumber) + jitter
  const baseDelay = classification.backoffMs;
  const multiplier = classification.backoffMultiplier;
  const exponentialDelay = baseDelay * Math.pow(multiplier, attemptNumber - 1);

  // Add jitter (0-20% of delay)
  const jitter = Math.random() * (exponentialDelay * 0.2);

  return Math.min(exponentialDelay + jitter, 60000); // Max 60 second delay
}
