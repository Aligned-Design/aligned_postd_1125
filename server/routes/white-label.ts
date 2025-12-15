import { Router, RequestHandler, Request } from 'express';
import { WhiteLabelConfig, WhiteLabelRequest, WhiteLabelResponse } from '@shared/branding';
import { whiteLabelDB } from '../lib/white-label-db-service';
import { AppError } from '../lib/error-middleware';
import { ErrorCode, HTTP_STATUS } from '../lib/error-responses';

const router = Router();

// Extended request interface with user context - using type instead of interface to avoid TS2430
type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    agencyId?: string;
    brandId?: string;
    email?: string;
  };
  agencyId?: string;
  userId?: string;
};

// Helper function to map database record to API response
function mapWhiteLabelRecord(record: unknown): WhiteLabelConfig {
  // Type assertion with proper typing
  const typedRecord = record as {
    id: string;
    agency_id: string;
    is_active: boolean;
    domain?: string;
    metadata?: {
      branding?: Record<string, unknown>;
      colors?: Record<string, unknown>;
      footer?: Record<string, unknown>;
      email?: Record<string, unknown>;
      features?: Record<string, unknown>;
    };
    created_at: string;
    updated_at: string;
  };

  return {
    id: typedRecord.id,
    agencyId: typedRecord.agency_id,
    isActive: typedRecord.is_active,
    branding: (typedRecord.metadata?.branding || {}) as WhiteLabelConfig['branding'],
    colors: (typedRecord.metadata?.colors || {}) as WhiteLabelConfig['colors'],
    domain: {
      custom: typedRecord.domain || '',
      isPrimary: true
    },
    footer: (typedRecord.metadata?.footer || {}) as WhiteLabelConfig['footer'],
    email: (typedRecord.metadata?.email || {}) as WhiteLabelConfig['email'],
    features: (typedRecord.metadata?.features || {}) as WhiteLabelConfig['features'],
    createdAt: typedRecord.created_at,
    updatedAt: typedRecord.updated_at
  };
}

export const getWhiteLabelConfig: RequestHandler = async (req, res, next) => {
  try {
    // Get agencyId from path parameter or authentication context
    const authReq = req as AuthenticatedRequest;
    const agencyId = ((req as any).params.agencyId || authReq.agencyId || authReq.user?.agencyId);

    if (!agencyId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "agencyId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Fetch config from database
    const configRecord = await whiteLabelDB.getWhiteLabelConfig(agencyId);

    const response: WhiteLabelResponse = {
      success: true,
      config: configRecord ? mapWhiteLabelRecord(configRecord) : getDefaultConfig(agencyId)
    };

    (res as any).json(response);
  } catch (error) {
    next(error);
  }
};

export const getConfigByDomain: RequestHandler = async (req, res, next) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "domain parameter is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Find config by custom domain in database
    const configRecord = await whiteLabelDB.getConfigByDomain(domain as string);

    const response: WhiteLabelResponse = {
      success: true,
      config: configRecord ? mapWhiteLabelRecord(configRecord) : undefined
    };

    (res as any).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateWhiteLabelConfig: RequestHandler = async (req, res, next) => {
  try {
    const { config: updates, previewMode }: WhiteLabelRequest = req.body;
    // Get agencyId from path parameter or authentication context
    const authReq = req as AuthenticatedRequest;
    const agencyId = ((req as any).params.agencyId || authReq.agencyId || authReq.user?.agencyId);

    if (!agencyId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "agencyId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    if (!updates) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "config updates are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    if (previewMode) {
      // Return preview without saving to database
      const previewConfig = getDefaultConfig(agencyId);
      const response: WhiteLabelResponse = {
        success: true,
        config: previewConfig,
        previewUrl: `https://preview.postd.app/${agencyId}`
      };
      (res as any).json(response);
      return;
    }

    // Update and save to database
    const updatedRecord = await whiteLabelDB.updateWhiteLabelConfig(agencyId, updates as unknown);
    const config = mapWhiteLabelRecord(updatedRecord);

    const response: WhiteLabelResponse = {
      success: true,
      config
    };

    (res as any).json(response);
  } catch (error) {
    next(error);
  }
};

function getDefaultConfig(agencyId: string): WhiteLabelConfig {
  return {
    id: `wl-${agencyId}`,
    agencyId,
    isActive: false,
    branding: {
      companyName: 'Your Agency',
      logoText: 'Your Agency',
      tagline: 'Professional Social Media Management'
    },
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        muted: '#94a3b8'
      },
      border: '#e2e8f0',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626'
    },
    domain: {
      custom: '',
      isPrimary: false
    },
    footer: {
      copyrightText: '© 2024 Your Agency. All rights reserved.',
      showPoweredBy: true,
      customLinks: []
    },
    email: {
      fromName: 'Your Agency',
      fromEmail: 'noreply@youragency.com',
      headerColor: '#2563eb',
      footerText: 'Your Agency - Social Media Management'
    },
    features: {
      hideAlignedAIBranding: false,
      customLoginPage: false,
      customDashboardTitle: 'Dashboard',
      allowClientBranding: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Register routes
router.get('/config/:agencyId', getWhiteLabelConfig);
router.get('/config', getWhiteLabelConfig);
router.get('/config-by-domain', getConfigByDomain);
router.put('/config/:agencyId', updateWhiteLabelConfig);
router.put('/config', updateWhiteLabelConfig);

export default router;
