const PROXY_API_URL = 'https://api.traan-cloudflare.workers.dev';

const Database = {
    url: PROXY_API_URL,

    async jsonGet(key, local = false) {
        if (local) {
            try {
                const response = await fetch(key);
                if (!response.ok) {
                    return null;
                }
                return await response.json();
            } catch {
                return null;
            }
        }

        const response = await fetch(`${this.url}/${encodeURIComponent(key)}`);
        if (!response.ok) {
            return null;
        }
        const res = await response.json();
        let data = res ? res.result : null;
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch {
                return data;
            }
        }
        return data;
    },

    // TRAAN STOCK
    async getTraanStock() {
        return this.jsonGet('TRAAN_STOCK', false);
    },

    async getTraanStockHistory() {
        return this.jsonGet('TRAAN_STOCK_HISTORY', false);
    },

    async getTraanMetadata() {
        return this.jsonGet('src/database/local/TraanItemMetadata.json', true);
    },

    async getTraanAllItems() {
        return this.jsonGet('src/database/local/TraanAllItems.json', true);
    },

    // DISASTERS AND WORLD EVENTS
    async getDisasters() {
        return this.jsonGet('src/database/local/Disasters.json', true);
    },

    async getWorldEvents() {
        return this.jsonGet('src/database/local/WorldEvents.json', true);
    },

    // REGULAR ASS CLOCK
    async getClockDayStages() {
        return this.jsonGet('src/database/local/ClockDayStages.json', true);
    }
};

window.Database = Database;