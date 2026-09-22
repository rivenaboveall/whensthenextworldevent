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

const TraanStockLayout = {
    container: null,
    isMounted: false,
    bgImage: 'assets/images/Traan.webp',

    init() {
        this.container = document.getElementById('traan-stock-layout');
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
    },

    unmount() {
        this.isMounted = false;
        if (this.container) {
            this.container.classList.add('layout-hidden');
        }
    },

    render(now) {
        const current = getTraanStockAtTimestamp(now);
        return current;
    }
};

window.TraanStockLayout = TraanStockLayout;
window.getTraanStockAtTimestamp = getTraanStockAtTimestamp;
