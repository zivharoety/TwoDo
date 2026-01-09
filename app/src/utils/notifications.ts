export const notificationManager = {
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }

        // On iOS, this MUST be called from a user gesture
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (e) {
            console.error('Permission request failed:', e);
            return false;
        }
    },

    getPermissionStatus() {
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission;
    },

    show(title: string, options?: NotificationOptions) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            // Fallback to console if no permission or support
            console.log('Notification:', title, options);
            return;
        }

        try {
            const registration = window.navigator.serviceWorker?.ready;

            // Try using service worker if available (better for performance/background)
            if (registration) {
                registration.then(reg => {
                    reg.showNotification(title, {
                        icon: '/logo192.png', // Fallback icon path
                        badge: '/logo192.png',
                        ...options,
                    });
                });
            } else {
                // Fallback to standard Notification
                new Notification(title, options);
            }
        } catch (error) {
            console.error('Failed to show notification:', error);
            new Notification(title, options);
        }
    }
};
