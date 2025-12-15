/**
 * TypeScript shims for non-standard module imports
 * 
 * These allow TS to compile files that import modules that don't exist at compile time
 * but will exist at runtime (e.g., build artifacts, generated files)
 */

// Allow importing .mjs files (ES modules with explicit extension)
declare module "*.mjs" {
  const mod: any;
  export default mod;
}

// Allow importing JSON files as modules
declare module "*.json" {
  const value: any;
  export default value;
}

