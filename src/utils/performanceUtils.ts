// Performance optimization utilities

export const debounceValue = <T>(value: T): T => {
  // Simple value debouncing for numbers that change frequently
  if (typeof value === 'number') {
    return Math.round(value) as T;
  }
  return value;
};

export const createOptimizedContainer = (className: string = '') => {
  return `${className} transform-gpu will-change-transform backface-hidden`;
};

export const optimizeForAnimation = {
  willChange: 'transform',
  transform: 'translate3d(0, 0, 0)',
  backfaceVisibility: 'hidden' as const
};

export const preventLayoutShift = {
  containIntrinsicSize: 'layout',
  contain: 'layout style paint' as const
};
