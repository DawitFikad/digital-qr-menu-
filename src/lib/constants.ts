// Configuration constants
export const RESTAURANT_URL = "https://restaurant-menu-demo.vercel.app";

// Animation constants
export const ANIMATION_DURATION = {
  FAST: 0.2,
  NORMAL: 0.4,
  SLOW: 0.8,
  EXTRA_SLOW: 1,
} as const;

export const ANIMATION_DELAY = {
  NONE: 0,
  SHORT: 0.1,
  NORMAL: 0.2,
  LONG: 0.5,
  EXTRA_LONG: 0.8,
} as const;

// Responsive breakpoints
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

// Touch target sizes (minimum 44px for mobile)
export const TOUCH_TARGET_SIZE = {
  MIN: 44,
  SMALL: 48,
  MEDIUM: 52,
  LARGE: 56,
} as const;

// Common spacing values
export const SPACING = {
  XS: '0.5rem',    // 8px
  SM: '1rem',     // 16px
  MD: '1.5rem',   // 24px
  LG: '2rem',     // 32px
  XL: '3rem',     // 48px
  '2XL': '4rem',  // 64px
} as const;

// Common border radius
export const BORDER_RADIUS = {
  SM: '0.5rem',    // 8px
  MD: '0.75rem',   // 12px
  LG: '1rem',      // 16px
  XL: '1.25rem',   // 20px
  '2XL': '1.5rem', // 24px
  FULL: '9999px',
} as const;
