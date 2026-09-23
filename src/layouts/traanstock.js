const TRAAN_INTERVAL_MS = 20 * 60 * 60 * 1000;
const TRAAN_ANCHOR_TIMESTAMP = Date.UTC(2026, 8, 20, 20, 0, 0);

function getTraanStockAtTimestamp(timestamp) {
    const diff = timestamp - TRAAN_ANCHOR_TIMESTAMP;
    const slotIndex = Math.floor(diff / TRAAN_INTERVAL_MS);
    const startTime = TRAAN_ANCHOR_TIMESTAMP + slotIndex * TRAAN_INTERVAL_MS;
    return {
        slotIndex,
        startTime,
        endTime: startTime + TRAAN_INTERVAL_MS
    };
}

function formatTraanCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const TraanStockLayout = {
    container: null,
    titleElement: null,
    timerElement: null,
    gridElement: null,
    isMounted: false,
    bgImage: 'assets/images/Traan.webp',
    lastSlotIndex: null,
    stockData: null,
    lastFetchTime: 0,
    isFetching: false,

    init() {
        this.container = document.getElementById('traan-stock-layout');
        this.titleElement = document.getElementById('traan-stock-title');
        this.timerElement = document.getElementById('traan-stock-timer');
        this.gridElement = document.getElementById('traan-stock-grid');
        this.fetchStock();
    },

    async fetchStock(force = false) {
        const now = Date.now();
        if (this.isFetching) {
            return;
        }
        if (!force && this.stockData && (now - this.lastFetchTime < 60000)) {
            return;
        }
        this.isFetching = true;

        const isLocal = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '';

        const gistStockUrl = 'https://gist.githubusercontent.com/rivenaboveall/8d7fd9ecd4a4b6ed9e5b101ea84af391/raw/TraanCurrentStock.json';
        const urls = isLocal
            ? ['data/current_stock.json', gistStockUrl]
            : [gistStockUrl, 'data/current_stock.json'];

        for (const url of urls) {
            try {
                const response = await fetch(`${url}?t=${Date.now()}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.items)) {
                        this.stockData = data;
                        this.lastFetchTime = now;
                        this.renderStock();
                        this.isFetching = false;
                        return;
                    }
                }
            } catch (e) {}
        }
        this.isFetching = false;
        if (!this.stockData) {
            this.renderStock();
        }
    },

    renderStock() {
        if (!this.gridElement) {
            return;
        }

        if (this.titleElement && this.stockData && this.stockData.shop_type) {
            this.titleElement.textContent = this.stockData.shop_type === 'cache'
                ? "Traan's Black Market Cache"
                : "Traan's Salvaged Stock";
        }

        if (!this.stockData || !this.stockData.items || this.stockData.items.length === 0) {
            this.gridElement.innerHTML = '<div class="traan-stock-empty">No stock currently available.</div>';
            return;
        }

        const itemsHtml = this.stockData.items.map((item) => {
            const currencyIcon = item.currency === 'Crowns' ? 'Crowns.webp' : 'Notes.webp';
            const categoryHtml = item.category ? `<span class="traan-item-category">${item.category}</span>` : '';
            return `
                <div class="traan-item-card">
                    <div class="traan-item-left">
                        <div class="traan-item-icon-box">
                            <span class="traan-corner tl"></span>
                            <span class="traan-corner tr"></span>
                            <span class="traan-corner bl"></span>
                            <span class="traan-corner br"></span>
                            <img src="assets/icons/ItemImage.webp" alt="${item.name}" class="traan-item-icon-img" />
                        </div>
                        <div class="traan-item-price-wrap">
                            <span class="traan-item-price-val">${item.price}</span>
                            <img src="assets/icons/${currencyIcon}" alt="${item.currency}" class="traan-item-currency-icon" />
                        </div>
                    </div>
                    <div class="traan-item-details">
                        <h3 class="traan-item-name">${item.name}</h3>
                        ${categoryHtml}
                    </div>
                </div>
            `;
        }).join('');

        this.gridElement.innerHTML = itemsHtml;
    },

    mount() {
        this.isMounted = true;
        if (this.container) {
            this.container.classList.remove('layout-hidden');
        }
        const bgImage = document.getElementById('bg-image');
        if (bgImage) {
            bgImage.style.backgroundImage = `url("${this.bgImage}")`;
        }
        const bgBackdrop = document.getElementById('bg-backdrop');
        if (bgBackdrop) {
            bgBackdrop.classList.remove('slashed');
        }
        this.fetchStock();
    },

    unmount() {
        this.isMounted = false;
        if (this.container) {
            this.container.classList.add('layout-hidden');
        }
    },

    render(now) {
        const current = getTraanStockAtTimestamp(now);

        if (this.lastSlotIndex !== null && current.slotIndex !== this.lastSlotIndex) {
            this.fetchStock(true);
        }
        this.lastSlotIndex = current.slotIndex;

        if (this.timerElement) {
            const timeUntilNext = Math.max(0, current.endTime - now);
            this.timerElement.innerHTML = `Next <strong>Black Market</strong> in ${formatTraanCountdown(timeUntilNext)}`;
        }

        return current;
    }
};

window.TraanStockLayout = TraanStockLayout;
window.getTraanStockAtTimestamp = getTraanStockAtTimestamp;
