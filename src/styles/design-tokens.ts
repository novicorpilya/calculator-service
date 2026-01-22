/**
 * Design System Tokens
 * Unified styling constants for consistent UI across the application
 */

// Border Radius Tokens (unified across all components)
export const RADIUS = {
    xs: 'rounded-lg', // 8px - small buttons, tags
    sm: 'rounded-xl', // 12px - inputs, small cards
    md: 'rounded-2xl', // 16px - cards, modals
    lg: 'rounded-[1.5rem]', // 24px - large cards
    xl: 'rounded-[2rem]', // 32px - feature cards
    '2xl': 'rounded-[2.5rem]', // 40px - hero sections
    '3xl': 'rounded-[3rem]', // 48px - premium cards
    full: 'rounded-full', // pill buttons
} as const;

// Shadow Tokens
export const SHADOW = {
    sm: 'shadow-sm',
    md: 'shadow-lg',
    lg: 'shadow-xl',
    xl: 'shadow-2xl',
    glow: (color: string) => `shadow-lg shadow-${color}/20`,
    premium: 'shadow-2xl shadow-primary/10',
} as const;

// Spacing Tokens (padding/margin)
export const SPACING = {
    card: {
        sm: 'p-4 sm:p-6',
        md: 'p-6 sm:p-8',
        lg: 'p-8 sm:p-10',
    },
    section: 'space-y-6 sm:space-y-8 lg:space-y-12',
    gap: {
        sm: 'gap-2 sm:gap-3',
        md: 'gap-4 sm:gap-6',
        lg: 'gap-6 sm:gap-8',
    },
} as const;

// Typography Tokens
export const TYPOGRAPHY = {
    heading: {
        h1: 'text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter',
        h2: 'text-xl sm:text-2xl font-black uppercase tracking-tight',
        h3: 'text-lg sm:text-xl font-black tracking-tight',
        h4: 'text-base sm:text-lg font-bold',
    },
    label: 'text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50',
    body: 'text-sm sm:text-base font-medium',
    caption: 'text-[10px] sm:text-xs font-bold text-foreground/50',
} as const;

// Animation Tokens
export const ANIMATION = {
    fast: 'transition-all duration-200',
    medium: 'transition-all duration-300',
    slow: 'transition-all duration-500',
    entrance: 'animate-in fade-in slide-in-from-bottom-4 duration-500',
    hover: {
        lift: 'hover:-translate-y-1',
        scale: 'hover:scale-105',
        glow: 'hover:shadow-xl',
    },
} as const;

// Button Variants
export const BUTTON = {
    primary: `
        flex items-center justify-center gap-2 
        px-4 sm:px-6 py-2.5 sm:py-3 
        bg-primary text-white 
        ${RADIUS.md} 
        text-[10px] sm:text-xs font-black uppercase tracking-widest 
        ${ANIMATION.medium}
        hover:shadow-lg hover:shadow-primary/30 
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
    `
        .trim()
        .replace(/\s+/g, ' '),
    secondary: `
        flex items-center justify-center gap-2 
        px-4 sm:px-6 py-2.5 sm:py-3 
        bg-card border border-border-theme 
        ${RADIUS.md} 
        text-[10px] sm:text-xs font-black uppercase tracking-widest 
        ${ANIMATION.medium}
        hover:border-primary hover:text-primary 
        active:scale-95
    `
        .trim()
        .replace(/\s+/g, ' '),
    ghost: `
        flex items-center justify-center gap-2 
        px-3 sm:px-4 py-2 
        text-foreground/60 
        ${RADIUS.sm} 
        text-[10px] sm:text-xs font-black uppercase tracking-widest 
        ${ANIMATION.medium}
        hover:bg-foreground/5 hover:text-foreground 
        active:scale-95
    `
        .trim()
        .replace(/\s+/g, ' '),
} as const;

// Card Variants
export const CARD = {
    default: `
        bg-card border border-border-theme 
        ${RADIUS.xl} 
        ${SPACING.card.md}
        ${ANIMATION.medium}
    `
        .trim()
        .replace(/\s+/g, ' '),
    glass: `
        glass-card 
        ${RADIUS.xl}
    `
        .trim()
        .replace(/\s+/g, ' '),
    interactive: `
        bg-card border border-border-theme 
        ${RADIUS.xl} 
        ${SPACING.card.md}
        ${ANIMATION.medium}
        cursor-pointer
        hover:-translate-y-1 hover:shadow-xl hover:border-primary/30
    `
        .trim()
        .replace(/\s+/g, ' '),
} as const;

// Input Variants
export const INPUT = {
    default: `
        w-full bg-background border border-border-theme 
        ${RADIUS.md} 
        px-4 py-3 
        text-sm font-medium 
        placeholder:text-foreground/30 
        ${ANIMATION.medium}
        focus:border-primary focus:ring-4 focus:ring-primary/10 
        outline-none
    `
        .trim()
        .replace(/\s+/g, ' '),
} as const;

// Badge Variants
export const BADGE = {
    default: `
        px-2 sm:px-3 py-1 
        bg-foreground/5 border border-border-theme 
        ${RADIUS.sm} 
        text-[9px] sm:text-[10px] font-black uppercase tracking-widest
    `
        .trim()
        .replace(/\s+/g, ' '),
    primary: `
        px-2 sm:px-3 py-1 
        bg-primary/10 border border-primary/20 text-primary 
        ${RADIUS.sm} 
        text-[9px] sm:text-[10px] font-black uppercase tracking-widest
    `
        .trim()
        .replace(/\s+/g, ' '),
} as const;
