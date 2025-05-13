import { useState as reactUseState } from 'react';

/**
 * Type-safe wrapper around React's useState
 * This avoids the TypeScript error: "Untyped function calls may not accept type arguments"
 */
export function useState<T>(initialState: T | (() => T)) {
  return reactUseState<T>(initialState);
}

/**
 * Type-safe wrapper around React's useState for null values
 */
export function useNullableState<T>(initialState: T | null = null) {
  return reactUseState<T | null>(initialState);
}

/**
 * Type-safe wrapper around React's useState for arrays
 */
export function useArrayState<T>(initialState: T[] = []) {
  return reactUseState<T[]>(initialState);
}

/**
 * Type-safe wrapper around React's useState for enums
 */
export function useEnumState<T extends string>(initialState: T) {
  return reactUseState<T>(initialState);
} 