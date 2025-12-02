/**
 * Express Type Extensions
 * 
 * Extends Express Request and Response types to include custom properties
 * used throughout the application.
 */

import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        brandId?: string;
        brandIds?: string[];
        scopes?: string[];
        workspaceId?: string;
        tenantId?: string;
        plan_status?: "active" | "trial" | "past_due" | "archived" | "deleted"; // Account status for billing checks
        past_due_since?: string | null; // Date when account went past due
      };
      auth?: {
        userId: string;
        email: string;
        role: string;
        brandIds?: string[];
        scopes?: string[];
        workspaceId?: string;
        tenantId?: string;
      };
      // Express 5 includes these by default, but we ensure they're typed
      body: any;
      params: Record<string, string>;
      query: Record<string, any>;
      path: string;
      method: string;
      headers: Record<string, string | string[] | undefined>;
      ip?: string;
      socket?: {
        remoteAddress?: string;
      };
      // OAuth CSRF validation state
      validatedState?: {
        fullState: string;
        rawToken: string;
        parts: string[];
      };
    }

    interface Response {
      status(code: number): Response;
      json(body: any): Response;
      setHeader(name: string, value: string | string[]): Response;
      statusCode?: number;
      headersSent?: boolean;
      cookie?(name: string, value: string, options?: any): Response;
      clearCookie?(name: string, options?: any): Response;
    }
  }
}

export interface AuthedRequest extends Request {
  user: NonNullable<Request["user"]>;
  auth: NonNullable<Request["auth"]>;
}

export interface TypedRequest<TBody = any, TParams = any, TQuery = any> extends Request {
  body: TBody;
  params: TParams;
  query: TQuery;
}

export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
export type AuthedRequestHandler = (req: AuthedRequest, res: Response, next: NextFunction) => void | Promise<void>;
export type TypedRequestHandler<TBody = any, TParams = any, TQuery = any> = (
  req: TypedRequest<TBody, TParams, TQuery>,
  res: Response,
  next: NextFunction
) => void | Promise<void>;
