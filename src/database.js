const PROXY_API_URL = 'https://api.traan-cloudflare.workers.dev';

const Database = {
    url: PROXY_API_URL,

    async jsonGet(key) {
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

    async getTraanMetadata() {
        return this.jsonGet('TRAAN_METADATA');
    },

    async getTraanStock() {
        return this.jsonGet('TRAAN_STOCK');
    },

    async getTraanAllItems() {
        return this.jsonGet('TRAAN_ALLITEMS');
    }
};

window.Database = Database;
