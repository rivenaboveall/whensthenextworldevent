const UPSTASH_REDIS_URL = 'https://sacred-seahorse-292012.upstash.io';
const UPSTASH_READ_ONLY_TOKEN = 'ggAAAAAABHSsAAIgcDJka24B63kPac6eR7Tmr5tDxvEd48POsa9IS8Fej5sXSA';

const TRAAN_INTERVAL_MS = 20 * 60 * 60 * 1000;
const TRAAN_ANCHOR_TIMESTAMP = Date.UTC(2026, 8, 23, 4, 0, 0);

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

const TRAAN_TOPICS = {
    JadeiteMegalodaunt: {
        category: 3,
        priority: 8,
        bgImage: 'assets/images/Topics/JadeiteMegalodaunt.jpg',
        musicSrc: 'assets/music/Topics/JadeiteMegalodaunt.mp3',
        duration: 105.22
    },
    Layer2: {
        category: 2,
        priority: 7,
        bgImage: 'assets/images/Topics/Layer2.webp',
        musicSrc: 'assets/music/Topics/Layer2.mp3',
        duration: 166.58
    },
    Layer1: {
        category: 2,
        priority: 6,
        bgImage: 'assets/images/Topics/Layer1.webp',
        musicSrc: 'assets/music/Topics/Layer1.mp3',
        duration: 300.39
    },
    Fallen: {
        category: 2,
        priority: 5,
        bgImage: 'assets/images/Topics/Fallen.webp',
        musicSrc: 'assets/music/Topics/Fallen.mp3',
        duration: 147.24
    },
    Legion: {
        category: 1,
        priority: 4,
        bgImage: 'assets/images/Topics/Legion.webp',
        musicSrc: 'assets/music/Topics/Legion.mp3',
        duration: 355.24
    },
    Ministry: {
        category: 1,
        priority: 3,
        bgImage: 'assets/images/Topics/Ministry.webp',
        musicSrc: 'assets/music/Topics/Ministry.mp3',
        duration: 129.33
    },
    Authority: {
        category: 1,
        priority: 2,
        bgImage: 'assets/images/Topics/FortMerit.webp',
        musicSrc: 'assets/music/Topics/Authority.mp3',
        duration: 292.00
    },
    Ignition: {
        category: 1,
        priority: 1,
        bgImage: 'assets/images/Topics/Ignition.png',
        musicSrc: 'assets/music/Topics/Ignition.mp3',
        duration: 332.77
    }
};

function resolveTraanTopic(items, siteData) {
    if (!items || !items.length || !siteData) {
        return null;
    }

    const counts = {};
    for (const item of items) {
        const info = siteData[item.name];
        const topic = info && info.Topic ? info.Topic.trim() : '';
        if (topic && TRAAN_TOPICS[topic]) {
            counts[topic] = (counts[topic] || 0) + 1;
        }
    }

    const categories = [3, 2, 1];
    for (const category of categories) {
        const candidates = [];
        for (const [topicKey, config] of Object.entries(TRAAN_TOPICS)) {
            if (config.category === category) {
                const count = counts[topicKey] || 0;
                if (count > 0) {
                    candidates.push({
                        topic: topicKey,
                        count,
                        priority: config.priority
                    });
                }
            }
        }

        if (candidates.length > 0) {
            candidates.sort((a, b) => {
                if (b.count !== a.count) {
                    return b.count - a.count;
                }
                return b.priority - a.priority;
            });
            return candidates[0].topic;
        }
    }

    return null;
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
    siteData: null,
    currentTopic: null,
    lastFetchTime: 0,
    isFetching: false,
    isFetchingSiteData: false,

    init() {
        this.container = document.getElementById('traan-stock-layout');
        this.titleElement = document.getElementById('traan-stock-title');
        this.timerElement = document.getElementById('traan-stock-timer');
        this.gridElement = document.getElementById('traan-stock-grid');
        this.fetchSiteData();
        this.fetchStock();
    },

    async fetchSiteData() {
        if (this.siteData || this.isFetchingSiteData) {
            return;
        }
        this.isFetchingSiteData = true;

        try {
            const response = await fetch(`${UPSTASH_REDIS_URL}/json.get/TRAAN_METADATA`, {
                cache: 'no-store',
                headers: {
                    Authorization: `Bearer ${UPSTASH_READ_ONLY_TOKEN}`
                }
            });
            if (response.ok) {
                const resJson = await response.json();
                let data = resJson.result;
                if (typeof data === 'string') {
                    data = JSON.parse(data);
                }
                if (data && typeof data === 'object') {
                    this.siteData = data;
                    this.isFetchingSiteData = false;
                    this.updateTopic();
                    return;
                }
            }
        } catch (e) { }

        this.isFetchingSiteData = false;
    },

    updateTopic() {
        if (!this.stockData || !this.stockData.items || !this.siteData) {
            return;
        }
        const newTopic = resolveTraanTopic(this.stockData.items, this.siteData);
        const topicChanged = newTopic !== this.currentTopic;
        this.currentTopic = newTopic;
        this.updateBackground();
        if (topicChanged && window.MusicPlayer && window.MusicPlayer.activeLayout === 'traanstock') {
            const now = typeof getAppTime === 'function' ? getAppTime() : Date.now();
            window.MusicPlayer.sync(now);
        }
    },

    getBackgroundImage() {
        if (this.currentTopic && TRAAN_TOPICS[this.currentTopic]) {
            return TRAAN_TOPICS[this.currentTopic].bgImage;
        }
        return 'assets/images/Traan.webp';
    },

    updateBackground() {
        this.bgImage = this.getBackgroundImage();
        if (this.isMounted) {
            const bgImage = document.getElementById('bg-image');
            if (bgImage) {
                bgImage.style.backgroundImage = `url("${this.bgImage}")`;
            }
            const bgBackdrop = document.getElementById('bg-backdrop');
            if (bgBackdrop) {
                bgBackdrop.classList.remove('slashed');
            }
        }
    },

    getAudioTrackInfo() {
        if (this.currentTopic && TRAAN_TOPICS[this.currentTopic]) {
            const conf = TRAAN_TOPICS[this.currentTopic];
            return {
                src: conf.musicSrc,
                duration: conf.duration,
                eventName: this.currentTopic
            };
        }
        return {
            src: 'assets/music/Traan.mp3',
            duration: 150.952925,
            eventName: 'Traan'
        };
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

        try {
            const response = await fetch(`${UPSTASH_REDIS_URL}/json.get/TRAAN_STOCK`, {
                cache: 'no-store',
                headers: {
                    Authorization: `Bearer ${UPSTASH_READ_ONLY_TOKEN}`
                }
            });
            if (response.ok) {
                const resJson = await response.json();
                let data = resJson.result;
                if (typeof data === 'string') {
                    data = JSON.parse(data);
                }
                if (data && Array.isArray(data.items)) {
                    this.stockData = data;
                    this.lastFetchTime = now;
                    this.renderStock();
                    this.updateTopic();
                    this.isFetching = false;
                    return;
                }
            }
        } catch (e) { }

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
        this.updateBackground();
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
