/**
 * @deprecated
 * This file is a compatibility shim. All types have been moved to `lib/types/`.
 * Existing imports from "@/lib/types" continue to work unchanged.
 * For new code, prefer importing directly from the barrel or sub-modules:
 *   import type { Role } from "@/lib/types"          // barrel (same as before)
 *   import type { Role } from "@/lib/types/auth"     // sub-module (explicit)
 */
export * from "./types/index"
