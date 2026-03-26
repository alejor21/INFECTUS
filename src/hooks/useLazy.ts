import { ComponentType, Suspense, lazy as reactLazy } from 'react';

/**
 * Wraps React.lazy to automatically add a display name for debugging
 */
export function useLazy<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  displayName: string
) {
  const Component = reactLazy(importFn);
  Component.displayName = `Lazy(${displayName})`;
  return Component;
}

/**
 * Returns a lazy component with Suspense boundary
 */
export function withLazySuspense<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  const displayName = Component.displayName || Component.name || 'Component';
  return {
    Component,
    fallback,
    displayName,
  };
}

export default useLazy;
