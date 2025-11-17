/**
 * Central export for all authentication and authorization utilities
 */

export {
  useAuth,
  type Role,
  type AuthUser,
  type UseAuthReturn,
} from "./useAuth";
export { useCan, useCanAll, useCanAny, useIsRole, type Scope } from "./useCan";
