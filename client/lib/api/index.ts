/**
 * Centralized API Layer for POSTD Client
 * 
 * All data access MUST go through functions in this module.
 * NO direct Supabase calls from UI components.
 * 
 * Pattern:
 * - Domain functions exported from this file
 * - Use apiGet/apiPost/apiPut/apiDelete from ../api.ts
 * - Return typed responses
 * - Handle errors consistently
 */

// Re-export all domain APIs
export * from "./auth";
export * from "./brands";
export * from "./content";
export * from "./connections";
export * from "./publishing";

// Re-export specific functions for convenience
export { listBrands, getBrand, getBrandKit, getBrandGuide, createBrand, updateBrand, deleteBrand } from "./brands";
export { getSession, getCurrentUser, signOut } from "./auth";
export { listContentItems, getContentItem, createContentItem, updateContentItem, deleteContentItem } from "./content";
export { listConnectedAccounts, connectAccount, disconnectAccount } from "./connections";
export { schedulePublish, createPublishJob, listPublishJobs } from "./publishing";

