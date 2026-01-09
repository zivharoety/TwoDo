/**
 * Simple utility for "haptic-like" feedback using the Web Vibration API.
 * This provides a subtle physical response on mobile devices.
 */
export const hapticFeedback = {
    // Light tap - good for switching tabs or tiny toggles
    light: () => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }
    },

    // Medium tap - good for checkmarks, primary buttons
    medium: () => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(20);
        }
    },

    // Success - double tap for completion
    success: () => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate([10, 30, 10]);
        }
    },

    // Warning - for alerts or errors
    warning: () => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate([50, 50, 50]);
        }
    }
};
