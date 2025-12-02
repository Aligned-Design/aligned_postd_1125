# POSTD Design System Guidelines for AI Assistants

> **Status:** ✅ Active – This is an active design system guide for POSTD.  
> **Last Updated:** 2025-01-20

## Project Overview
This is a **Fusion Starter** project - a React SPA with integrated Express server for the POSTD marketing platform.

## Core Architecture Principles

### 1. **Client-First Philosophy**
- ✅ **Prefer client-side logic** - Use React components, hooks, and state management
- ✅ **Minimal Express endpoints** - Only create `/api/*` routes when absolutely necessary:
  - Private API key operations (OpenAI, Anthropic)
  - Server-side database operations
  - Authentication token handling
- ❌ **Avoid unnecessary server logic** - Don't create endpoints for data that can be handled client-side

### 2. **Single Port Development**
- Development runs on port **8080** for both frontend and backend
- Vite proxies `/api/*` requests to Express server
- Hot reload works for both client and server code

## File Structure & Component Guidelines

