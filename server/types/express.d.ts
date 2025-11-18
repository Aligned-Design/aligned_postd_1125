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
      };
      auth?: {
        userId: string;
        email: string;
        role: string;
        brandIds?: string[];
        scopes?: string[];
        workspaceId?: string;
      };
      body: any;
      params: any;
      query: any;
    }

    interface Response {
      status(code: number): Response;
      json(body: any): Response;
      setHeader(name: string, value: string | string[]): Response;
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
