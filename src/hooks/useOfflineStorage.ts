import { useState, useEffect, useCallback } from 'react';

// Simple IndexedDB wrapper for offline data storage
const DB_NAME = 'alveare-crm-offline';
const DB_VERSION = 1;

interface PendingAction {
    id: string;
    type: 'create_lead' | 'update_lead' | 'create_followup' | 'create_appointment';
    data: any;
    timestamp: number;
}

class OfflineDB {
    private db: IDBDatabase | null = null;
    private dbPromise: Promise<IDBDatabase>;

    constructor() {
        this.dbPromise = this.init();
    }

    private init(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Store for cached leads
                if (!db.objectStoreNames.contains('leads')) {
                    db.createObjectStore('leads', { keyPath: 'id' });
                }

                // Store for pending actions (to sync when online)
                if (!db.objectStoreNames.contains('pendingActions')) {
                    db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
                }

                // Store for cached appointments
                if (!db.objectStoreNames.contains('appointments')) {
                    db.createObjectStore('appointments', { keyPath: 'id' });
                }

                // Store for app state
                if (!db.objectStoreNames.contains('appState')) {
                    db.createObjectStore('appState', { keyPath: 'key' });
                }
            };
        });
    }

    async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        return this.dbPromise;
    }

    // Generic get all from store
    async getAll<T>(storeName: string): Promise<T[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic put to store
    async put<T>(storeName: string, data: T): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Generic delete from store
    async delete(storeName: string, key: string | number): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Clear a store
    async clear(storeName: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Add pending action
    async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>): Promise<void> {
        const pendingAction: PendingAction = {
            ...action,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
        };
        await this.put('pendingActions', pendingAction);
    }

    // Get all pending actions
    async getPendingActions(): Promise<PendingAction[]> {
        return this.getAll<PendingAction>('pendingActions');
    }

    // Clear pending actions after successful sync
    async clearPendingActions(): Promise<void> {
        await this.clear('pendingActions');
    }
}

// Singleton instance
const offlineDB = new OfflineDB();

// Hook for offline storage
export function useOfflineStorage() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check pending actions count
        offlineDB.getPendingActions().then(actions => {
            setPendingCount(actions.length);
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Cache leads locally
    const cacheLeads = useCallback(async (leads: any[]) => {
        for (const lead of leads) {
            await offlineDB.put('leads', lead);
        }
    }, []);

    // Get cached leads
    const getCachedLeads = useCallback(async () => {
        return offlineDB.getAll('leads');
    }, []);

    // Cache appointments locally
    const cacheAppointments = useCallback(async (appointments: any[]) => {
        for (const appt of appointments) {
            await offlineDB.put('appointments', appt);
        }
    }, []);

    // Get cached appointments
    const getCachedAppointments = useCallback(async () => {
        return offlineDB.getAll('appointments');
    }, []);

    // Add pending action for offline sync
    const addPendingAction = useCallback(async (type: PendingAction['type'], data: any) => {
        await offlineDB.addPendingAction({ type, data });
        const actions = await offlineDB.getPendingActions();
        setPendingCount(actions.length);
    }, []);

    // Sync pending actions when online
    const syncPendingActions = useCallback(async (syncFunction: (action: PendingAction) => Promise<boolean>) => {
        if (!isOnline) return { success: false, synced: 0 };

        const actions = await offlineDB.getPendingActions();
        let synced = 0;

        for (const action of actions) {
            try {
                const success = await syncFunction(action);
                if (success) {
                    await offlineDB.delete('pendingActions', action.id);
                    synced++;
                }
            } catch (error) {
                console.error('Failed to sync action:', action, error);
            }
        }

        setPendingCount(await offlineDB.getPendingActions().then(a => a.length));
        return { success: true, synced };
    }, [isOnline]);

    return {
        isOnline,
        pendingCount,
        cacheLeads,
        getCachedLeads,
        cacheAppointments,
        getCachedAppointments,
        addPendingAction,
        syncPendingActions
    };
}

// Export DB instance for direct usage if needed
export { offlineDB };
