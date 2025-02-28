// utils/eventBus.ts
type EventCallback<T = unknown> = (...args: T[]) => void;

class EventBus {
    private events: Record<string, EventCallback[]> = {};

    on(event: string, callback: EventCallback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);

        return () => {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        };
    }

    emit<T>(event: string, ...args: T[]) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                (callback as EventCallback<T>)(...args);
            });
        }
    }
}

export const eventBus = new EventBus();

export const DATA_EVENTS = {
    SURAT_MASUK_UPDATED: 'surat_masuk_updated',
    SURAT_KELUAR_UPDATED: 'surat_keluar_updated',
    FAKTUR_UPDATED: 'faktur_updated',
    NOTULEN_UPDATED: 'notulen_updated',
    ANY_DATA_UPDATED: 'any_data_updated'
};