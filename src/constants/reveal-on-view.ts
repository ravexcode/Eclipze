export const DEFAULT_REVEAL_ANIMATION = "animate-blurred-fade-in";

// Fraction (0 to 1) of the element that must be visible to play the enter animation.
export const DEFAULT_REVEAL_ENTER_THRESHOLD = 0.2;

// Once the visible fraction drops below this value, the exit animation plays.
export const DEFAULT_REVEAL_EXIT_THRESHOLD = 0.2;

// Applied to the exit animation when no explicit exit animation is provided,
// so the enter animation plays backwards.
export const REVEAL_REVERSE_DIRECTION_CLASS = "animate-direction-reverse";

// Keeps the element invisible before it enters the viewport for the first time.
export const REVEAL_HIDDEN_CLASS = "opacity-0";
