/**
 * In-memory store for deleted messages
 * Stores messages so they can be recovered when someone deletes for everyone
 */

class MessageStore {
    constructor(maxSize = 5000) {
        this.store = new Map();
        this.maxSize = maxSize;
    }

    set(key, message) {
        if (this.store.size >= this.maxSize) {
            const firstKey = this.store.keys().next().value;
            this.store.delete(firstKey);
        }

        this.store.set(key, {
            message,
            timestamp: Date.now(),
        });
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
            this.store.delete(key);
            return null;
        }

        return entry.message;
    }

    has(key) {
        return this.store.has(key);
    }

    delete(key) {
        this.store.delete(key);
    }

    get size() {
        return this.store.size;
    }

    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000;

        for (const [key, entry] of this.store) {
            if (now - entry.timestamp > maxAge) {
                this.store.delete(key);
            }
        }
    }
}

export default MessageStore;
