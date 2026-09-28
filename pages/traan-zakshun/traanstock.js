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
    if (!items || !siteData) {
        return null;
    }

    const itemList = Array.isArray(items)
        ? items
        : Object.entries(items).map(([name, item]) => ({ name, ...item }));

    if (!itemList.length) {
        return null;
    }

    const counts = {};
    for (const item of itemList) {
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

function isItemThemed(item, currentTopic, siteData) {
    if (!currentTopic || !siteData) {
        return false;
    }
    const rawName = item.name ? item.name.trim() : '';
    const info = siteData[rawName] || siteData[item.name];
    const itemTopic = info && info.Topic ? info.Topic.trim() : '';

    if (currentTopic === 'Fallen') {
        const lowerName = rawName.toLowerCase();
        if (lowerName.includes("hero's blade") || lowerName.includes("hero blade") || itemTopic === 'Fallen') {
            return true;
        }
    }

    if (!itemTopic) {
        return false;
    }

    if (currentTopic === itemTopic) {
        return true;
    }

    if ((currentTopic === 'Layer1' || currentTopic === 'JadeiteMegalodaunt') &&
        (itemTopic === 'Layer1' || itemTopic === 'JadeiteMegalodaunt')) {
        return true;
    }

    return false;
}

function isAnyThemedItem(item, siteData) {
    if (!item || !siteData) {
        return false;
    }
    const rawName = item.name ? item.name.trim() : '';
    const lowerName = rawName.toLowerCase();
    if (lowerName.includes("hero's blade") || lowerName.includes("hero blade")) {
        return true;
    }
    const info = siteData[rawName] || siteData[item.name];
    const itemTopic = info && info.Topic ? info.Topic.trim() : '';
    return Boolean(itemTopic && TRAAN_TOPICS[itemTopic]);
}

function getItemThemeAccent(item, siteData) {
    if (!item) return null;
    const rawName = item.name ? item.name.toLowerCase() : '';

    if (rawName.includes("hero's blade") || rawName.includes("hero blade")) {
        if (rawName.includes('flame')) return 'theme-hero-flame';
        if (rawName.includes('frost')) return 'theme-hero-frost';
        if (rawName.includes('lightning')) return 'theme-hero-lightning';
        if (rawName.includes('shadow')) return 'theme-hero-shadow';
        if (rawName.includes('wind')) return 'theme-hero-wind';
        return 'theme-hero-flame';
    }

    let topic = '';
    if (siteData) {
        const info = siteData[item.name] || (item.name ? siteData[item.name.trim()] : null);
        topic = info && info.Topic ? info.Topic.trim() : '';
    }

    if (topic === 'Fallen') {
        if (rawName.includes('flame')) return 'theme-hero-flame';
        if (rawName.includes('frost')) return 'theme-hero-frost';
        if (rawName.includes('lightning')) return 'theme-hero-lightning';
        if (rawName.includes('shadow')) return 'theme-hero-shadow';
        if (rawName.includes('wind')) return 'theme-hero-wind';
        return 'theme-hero-flame';
    }

    if (topic === 'Authority') {
        return 'theme-authority';
    }
    if (topic === 'Legion') {
        return 'theme-legion';
    }
    if (topic === 'Ministry') {
        return 'theme-ministry';
    }
    if (topic === 'Ignition') {
        return 'theme-ignition';
    }
    if (topic === 'Layer2') {
        return 'theme-layer2';
    }
    if (topic === 'Layer1' || topic === 'JadeiteMegalodaunt') {
        return 'theme-depths';
    }

    return null;
}

const TraanStockLayout = {
    container: null,
    titleElement: null,
    updatedElement: null,
    timerElement: null,
    orderToggleBtn: null,
    menuOrderStatus: null,
    themingToggleBtn: null,
    menuThemingStatus: null,
    isMounted: false,
    orderType: localStorage.getItem('user_traan_order_type') || (localStorage.getItem('user_traan_auto_sort') === 'true' ? 'name' : 'literal'),
    isDisableTheming: localStorage.getItem('user_traan_disable_theming') === 'true',
    bgImage: 'assets/images/Traan.webp',
    lastSlotIndex: null,
    stockData: null,
    siteData: null,
    themeData: null,
    allItems: null,
    currentTopic: null,
    lastFetchTime: 0,
    isFetching: false,
    isFetchingSiteData: false,
    debugThemeIndex: 0,
    debugIsCache: false,

    init() {
        this.container = document.getElementById('traan-stock-layout');
        this.titleElement = document.getElementById('traan-stock-title');
        this.updatedElement = document.getElementById('traan-stock-updated');
        this.timerElement = document.getElementById('traan-stock-timer');
        this.gridElement = document.getElementById('traan-stock-grid');
        this.orderToggleBtn = document.getElementById('menu-item-traan-order');
        this.menuOrderStatus = document.getElementById('menu-traan-order-status');
        this.themingToggleBtn = document.getElementById('menu-item-traan-theming');
        this.menuThemingStatus = document.getElementById('menu-traan-theming-status');

        if (this.orderToggleBtn) {
            this.orderToggleBtn.addEventListener('click', () => {
                this.orderType = this.orderType === 'name' ? 'literal' : 'name';
                localStorage.setItem('user_traan_order_type', this.orderType);
                this.updateOrderTypeUI();
                this.renderStock();
            });
        }
        if (this.themingToggleBtn) {
            this.themingToggleBtn.addEventListener('click', () => {
                this.isDisableTheming = !this.isDisableTheming;
                localStorage.setItem('user_traan_disable_theming', String(this.isDisableTheming));
                this.updateThemingUI();
                this.updateBackground();
                this.renderStock();
                if (window.MusicPlayer && window.MusicPlayer.activeLayout === 'traanstock') {
                    const now = typeof getAppTime === 'function' ? getAppTime() : Date.now();
                    window.MusicPlayer.sync(now);
                }
            });
        }
        this.updateOrderTypeUI();
        this.updateThemingUI();
        this.fetchSiteData();
        this.fetchStock();
    },

    updateOrderTypeUI() {
        if (this.menuOrderStatus) {
            const isName = this.orderType === 'name';
            this.menuOrderStatus.textContent = isName ? 'Name' : 'Literal';
            this.menuOrderStatus.classList.toggle('status-active', isName);
        }
    },

    updateThemingUI() {
        if (this.menuThemingStatus) {
            this.menuThemingStatus.textContent = this.isDisableTheming ? 'On' : 'Off';
            this.menuThemingStatus.classList.toggle('status-active', this.isDisableTheming);
        }
    },

    async fetchSiteData() {
        if ((this.siteData && this.allItems) || this.isFetchingSiteData) {
            return;
        }
        this.isFetchingSiteData = true;

        try {
            const [metaData, allItems] = await Promise.all([
                window.Database.getTraanMetadata(),
                window.Database.getTraanAllItems()
            ]);
            if (metaData && typeof metaData === 'object') {
                if (metaData.themes) {
                    this.themeData = metaData.themes;
                    this.siteData = metaData.items || metaData;
                    this.applyThemeStyles(metaData.themes);
                } else {
                    this.siteData = metaData;
                }
            }
            if (allItems && typeof allItems === 'object') {
                this.allItems = allItems;
            }
            this.isFetchingSiteData = false;
            this.updateTopic();
            this.renderStock();
            return;
        } catch (e) { }

        this.isFetchingSiteData = false;
    },

    applyThemeStyles(themes) {
        if (!themes || typeof themes !== 'object') return;
        let styleTag = document.getElementById('traan-dynamic-themes');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'traan-dynamic-themes';
            document.head.appendChild(styleTag);
        }

        let css = '';
        for (const [key, t] of Object.entries(themes)) {
            const normalizedKey = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/_/g, '-');
            const className = normalizedKey.startsWith('theme-') ? normalizedKey : `theme-${normalizedKey}`;
            css += `
.${className} {
  --traan-theme-border: ${t.border || t.accent};
  --traan-theme-bg: ${t.background || t.bgGradient || 'rgba(14, 16, 22, 0.65)'};
  --traan-theme-glow: ${t.glow || 'none'};
  --traan-theme-corner: ${t.corner || t.accent};
  --traan-theme-hover-border: ${t.hoverBorder || t.border || t.accent};
  --traan-theme-hover-glow: ${t.hoverGlow || t.glow || 'none'};
  --traan-theme-icon-border: ${t.iconBorder || t.accent};
  --traan-theme-icon-bg: ${t.iconBackground || t.iconBg || 'rgba(22, 20, 18, 0.9)'};
  --traan-theme-icon-glow: ${t.iconGlow || 'none'};
  --traan-theme-sec-border: ${t.secondaryBorder || 'rgba(255, 255, 255, 0.2)'};
  --traan-theme-sec-corner: ${t.secondaryCorner || '#dfb76c'};
  --traan-theme-sec-icon-border: ${t.secondaryIconBorder || 'rgba(255, 255, 255, 0.2)'};
}
`;
        }
        styleTag.textContent = css;
    },

    updateTopic() {
        if (!this.stockData || !this.stockData.items || !this.siteData) {
            return;
        }
        const newTopic = resolveTraanTopic(this.stockData.items, this.siteData);
        const topicChanged = newTopic !== this.currentTopic;
        this.currentTopic = newTopic;
        this.updateBackground();
        if (topicChanged) {
            this.renderStock();
        }
        if (topicChanged && window.MusicPlayer && window.MusicPlayer.activeLayout === 'traanstock') {
            const now = typeof getAppTime === 'function' ? getAppTime() : Date.now();
            window.MusicPlayer.sync(now);
        }
    },

    getBackgroundImage() {
        if (!this.isDisableTheming && this.currentTopic && TRAAN_TOPICS[this.currentTopic]) {
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
        if (!this.isDisableTheming && this.currentTopic && TRAAN_TOPICS[this.currentTopic]) {
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
            const data = await window.Database.getTraanStock();
            if (data && data.items && (Array.isArray(data.items) || typeof data.items === 'object')) {
                this.stockData = data;
                this.lastFetchTime = now;
                this.renderStock();
                this.updateTopic();
                this.isFetching = false;
                return;
            }
        } catch (e) { }

        this.isFetching = false;
        if (!this.stockData) {
            this.renderStock();
        }
    },

    async randomizeStock() {
        if (!this.siteData || !this.allItems) {
            await this.fetchSiteData();
        }
        if (!this.siteData || !this.allItems) {
            return;
        }

        const themes = [
            'Authority',
            'Legion',
            'Fallen',
            'Ministry',
            'Layer1',
            'Ignition',
            'Layer2',
            'JadeiteMegalodaunt',
            'none'
        ];

        const targetTheme = themes[this.debugThemeIndex % themes.length];
        this.debugThemeIndex++;

        const isCache = targetTheme === 'JadeiteMegalodaunt' || targetTheme === 'Layer2'
            ? true
            : (targetTheme === 'Authority' ? false : (this.debugIsCache = !this.debugIsCache));
        const marketKey = isCache ? 'cache' : 'stock';
        const marketPool = this.allItems[marketKey];

        const byTopic = {};
        const unthemed = [];
        for (const name of Object.keys(marketPool)) {
            const rawTopic = (this.siteData[name] && this.siteData[name].Topic) ? this.siteData[name].Topic.trim() : '';
            const topic = (!rawTopic && (name.toLowerCase().includes("hero's blade") || name.toLowerCase().includes("hero blade"))) ? 'Fallen' : rawTopic;
            if (topic && TRAAN_TOPICS[topic]) {
                if (!byTopic[topic]) byTopic[topic] = [];
                byTopic[topic].push(name);
            } else {
                unthemed.push(name);
            }
        }

        const shuffle = (arr) => {
            const copy = [...arr];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        };

        const selectedNames = [];
        const pickFrom = (topicName, count) => {
            const list = (byTopic[topicName] || []).filter(n => !selectedNames.includes(n));
            return shuffle(list).slice(0, count);
        };

        if (targetTheme === 'JadeiteMegalodaunt') {
            selectedNames.push('Jadeite Megalodaunt');
            selectedNames.push(...pickFrom('Layer2', 1));
            selectedNames.push(...pickFrom('Authority', 1));
            selectedNames.push(...shuffle(unthemed.filter(n => !selectedNames.includes(n))).slice(0, 2));
        } else if (targetTheme === 'Layer2') {
            selectedNames.push(...pickFrom('Layer2', 2));
            selectedNames.push(...pickFrom('Layer1', 1));
            selectedNames.push(...pickFrom('Ministry', 1));
            selectedNames.push(...shuffle(unthemed.filter(n => !selectedNames.includes(n))).slice(0, 1));
        } else if (targetTheme === 'Layer1') {
            selectedNames.push(...pickFrom('Layer1', 2));
            selectedNames.push(...pickFrom('Fallen', 1));
            selectedNames.push(...pickFrom('Legion', 1));
            selectedNames.push(...shuffle(unthemed.filter(n => !selectedNames.includes(n))).slice(0, 1));
        } else if (targetTheme === 'Fallen') {
            selectedNames.push(...pickFrom('Fallen', 3));
            selectedNames.push(...pickFrom('Legion', 1));
            selectedNames.push(...shuffle(unthemed.filter(n => !selectedNames.includes(n))).slice(0, 1));
        } else if (targetTheme === 'Legion') {
            selectedNames.push(...pickFrom('Legion', 2));
            selectedNames.push(...pickFrom('Authority', 1));
            selectedNames.push(...pickFrom('Ignition', 1));
            selectedNames.push(...shuffle(unthemed.filter(n => !selectedNames.includes(n))).slice(0, 1));
        } else if (targetTheme === 'Ministry') {
            selectedNames.push(...pickFrom('Ministry', 2));
            selectedNames.push(...pickFrom('Authority', 1));
            selectedNames.push(...pickFrom('Ignition', 1));
            selectedNames.push(...shuffle(unthemed.filter(n => !selectedNames.includes(n))).slice(0, 1));
        } else if (targetTheme === 'Authority') {
            selectedNames.push(...pickFrom('Authority', 2));
            selectedNames.push(...pickFrom('Ignition', 1));
            selectedNames.push(...pickFrom('Ministry', 1));
            selectedNames.push(...shuffle(unthemed.filter(n => !selectedNames.includes(n))).slice(0, 1));
        } else if (targetTheme === 'Ignition') {
            selectedNames.push(...pickFrom('Ignition', 2));
            selectedNames.push(...pickFrom('Authority', 1));
            selectedNames.push(...pickFrom('Legion', 1));
            selectedNames.push(...shuffle(unthemed.filter(n => !selectedNames.includes(n))).slice(0, 1));
        } else {
            selectedNames.push(...shuffle(unthemed).slice(0, 5));
        }

        while (selectedNames.length < 5) {
            const candidates = shuffle(unthemed).filter(n => !selectedNames.includes(n));
            if (candidates.length > 0) {
                selectedNames.push(candidates[0]);
            } else {
                const poolCandidates = shuffle(Object.keys(marketPool)).filter(n => !selectedNames.includes(n));
                if (poolCandidates.length > 0) {
                    selectedNames.push(poolCandidates[0]);
                } else {
                    break;
                }
            }
        }

        const layouts = [
            [3, 2],
            [4, 1],
            [2, 3]
        ];
        const [c1, c2] = layouts[Math.floor(Math.random() * layouts.length)];
        const positions = [];
        for (let y = 1; y <= c1; y++) {
            positions.push({ x: 1, y });
        }
        for (let y = 1; y <= c2; y++) {
            positions.push({ x: 2, y });
        }
        const shuffledPositions = shuffle(positions);

        const stockItems = {};
        for (let i = 0; i < selectedNames.length; i++) {
            const name = selectedNames[i];
            const pos = shuffledPositions[i] || { x: (i % 2) + 1, y: Math.floor(i / 2) + 1 };
            const itemInfo = marketPool[name];
            stockItems[name] = {
                storeXPosition: pos.x,
                storeYPosition: pos.y,
                category: itemInfo ? itemInfo.category : 'Miscellaneous',
                currency: itemInfo ? itemInfo.currency : (isCache ? 'Crowns' : 'Notes'),
                price: itemInfo ? itemInfo.price : (isCache ? 5 : 150)
            };
        }

        this.stockData = {
            items: stockItems,
            stock_date: new Date().toISOString(),
            stock_type: isCache ? 'Black' : 'Normal',
            shop_type: isCache ? 'cache' : 'stock'
        };
        this.lastFetchTime = Date.now() + 3600000;
        this.updateTopic();
        this.renderStock();
        this.checkHighlights();

        if (window.MusicPlayer && window.MusicPlayer.activeLayout === 'traanstock') {
            const now = typeof getAppTime === 'function' ? getAppTime() : Date.now();
            window.MusicPlayer.resetTransition();
            window.MusicPlayer.sync(now, true);
        }
    },

    renderStock() {
        if (!this.gridElement) {
            return;
        }

        if (this.titleElement && this.stockData) {
            const isBlackMarket = this.stockData.stock_type === 'Black' || this.stockData.shop_type === 'cache';
            if (this.stockData.stock_type || this.stockData.shop_type) {
                this.titleElement.textContent = isBlackMarket
                    ? "Traan's Black Market Cache"
                    : "Traan's Salvaged Stock";
            }
        }

        if (this.updatedElement) {
            if (this.stockData && this.stockData.stock_date) {
                try {
                    const date = new Date(this.stockData.stock_date);
                    if (!isNaN(date.getTime())) {
                        const formatted = date.toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                        });
                        this.updatedElement.textContent = `Last updated: ${formatted}`;
                        this.updatedElement.style.display = '';
                    } else {
                        this.updatedElement.textContent = '';
                        this.updatedElement.style.display = 'none';
                    }
                } catch {
                    this.updatedElement.textContent = '';
                    this.updatedElement.style.display = 'none';
                }
            } else {
                this.updatedElement.textContent = '';
                this.updatedElement.style.display = 'none';
            }
        }

        const rawItems = this.stockData ? this.stockData.items : null;
        let items = [];
        if (Array.isArray(rawItems)) {
            items = rawItems;
        } else if (rawItems && typeof rawItems === 'object') {
            items = Object.entries(rawItems).map(([name, item]) => ({
                name,
                ...item
            }));
        }

        if (!items || items.length === 0) {
            this.gridElement.innerHTML = '<div class="traan-stock-empty">No stock currently available.</div>';
            return;
        }

        const isNameOrder = this.orderType === 'name';
        const activeTopic = !this.isDisableTheming ? this.currentTopic : null;

        const mainThemedItems = [];
        const otherThemedItems = [];
        const unthemedItems = [];

        for (const item of items) {
            const isMain = Boolean(activeTopic && isItemThemed(item, activeTopic, this.siteData));
            if (isMain) {
                mainThemedItems.push(item);
            } else if (!this.isDisableTheming && isAnyThemedItem(item, this.siteData)) {
                otherThemedItems.push(item);
            } else {
                unthemedItems.push(item);
            }
        }

        const nameComparator = (a, b) => a.name.trim().localeCompare(b.name.trim());
        const posComparator = (a, b) => {
            const yDiff = (a.storeYPosition || 0) - (b.storeYPosition || 0);
            if (yDiff !== 0) return yDiff;
            return (a.storeXPosition || 0) - (b.storeXPosition || 0);
        };

        if (isNameOrder) {
            if (!this.isDisableTheming) {
                mainThemedItems.sort(nameComparator);
                otherThemedItems.sort(nameComparator);
                unthemedItems.sort(nameComparator);
                items = [...mainThemedItems, ...otherThemedItems, ...unthemedItems];
            } else {
                items.sort(nameComparator);
            }
        } else {
            items.sort(posComparator);
        }

        const itemsHtml = items.map((item) => {
            const currencyIcon = item.currency === 'Crowns' ? 'Crowns.webp' : 'Notes.webp';
            const categoryHtml = item.category ? `<span class="traan-item-category">${item.category}</span>` : '';
            const metadata = this.siteData && (this.siteData[item.name] || this.siteData[item.name.trim()]);
            const wikiUrl = metadata && metadata.WikiPage ? metadata.WikiPage : null;
            const tag = wikiUrl ? 'a' : 'div';
            const linkAttrs = wikiUrl ? `href="${wikiUrl}" target="_blank" rel="noopener noreferrer"` : '';
            const gridStyle = (!isNameOrder && item.storeXPosition && item.storeYPosition)
                ? `style="grid-column: ${item.storeXPosition}; grid-row: ${item.storeYPosition};"`
                : '';
            const isMain = Boolean(activeTopic && isItemThemed(item, activeTopic, this.siteData));
            const accentClass = !this.isDisableTheming ? getItemThemeAccent(item, this.siteData) : null;
            const secondaryClass = (accentClass && !isMain) ? ' theme-secondary' : '';
            const themedClass = accentClass ? ` traan-item-themed ${accentClass}${secondaryClass}` : '';

            return `
                <${tag} ${linkAttrs} data-item-name="${item.name}" class="traan-item-card${wikiUrl ? ' has-wiki-link' : ''}${themedClass}" ${gridStyle}>
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
                </${tag}>
            `;
        }).join('');

        this.gridElement.innerHTML = itemsHtml;
    },

    checkHighlights() {
        if (!this.gridElement) {
            return;
        }

        if (!this.siteData && !this.isFetchingSiteData) {
            this.fetchSiteData();
        }

        if (!this.currentTopic && this.stockData && this.siteData) {
            this.updateTopic();
        }

        const activeTopic = !this.isDisableTheming ? this.currentTopic : null;
        const allAccentClasses = this.themeData
            ? Object.keys(this.themeData).map(k => {
                const normalizedKey = k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/_/g, '-');
                return normalizedKey.startsWith('theme-') ? normalizedKey : `theme-${normalizedKey}`;
            })
            : [
                'theme-authority', 'theme-legion', 'theme-ministry', 'theme-depths', 'theme-layer2', 'theme-ignition',
                'theme-hero-flame', 'theme-hero-frost', 'theme-hero-lightning', 'theme-hero-shadow', 'theme-hero-wind'
            ];

        const cards = this.gridElement.children;
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            if (!card.classList || !card.classList.contains('traan-item-card')) {
                continue;
            }

            const name = card.dataset.itemName || (card.querySelector('.traan-item-name') ? card.querySelector('.traan-item-name').textContent.trim() : '');
            if (!name) {
                continue;
            }

            const isMain = Boolean(activeTopic && isItemThemed({ name }, activeTopic, this.siteData));
            const targetAccent = (!this.isDisableTheming && this.siteData) ? getItemThemeAccent({ name }, this.siteData) : null;

            if (targetAccent) {
                if (!card.classList.contains('traan-item-themed')) {
                    card.classList.add('traan-item-themed');
                }
                for (let j = 0; j < allAccentClasses.length; j++) {
                    const cls = allAccentClasses[j];
                    if (cls === targetAccent) {
                        if (!card.classList.contains(cls)) {
                            card.classList.add(cls);
                        }
                    } else if (card.classList.contains(cls)) {
                        card.classList.remove(cls);
                    }
                }
                if (!isMain) {
                    if (!card.classList.contains('theme-secondary')) {
                        card.classList.add('theme-secondary');
                    }
                } else {
                    if (card.classList.contains('theme-secondary')) {
                        card.classList.remove('theme-secondary');
                    }
                }
            } else {
                if (card.classList.contains('traan-item-themed')) {
                    card.classList.remove('traan-item-themed');
                }
                if (card.classList.contains('theme-secondary')) {
                    card.classList.remove('theme-secondary');
                }
                for (let j = 0; j < allAccentClasses.length; j++) {
                    const cls = allAccentClasses[j];
                    if (card.classList.contains(cls)) {
                        card.classList.remove(cls);
                    }
                }
            }
        }
    },

    mount() {
        this.isMounted = true;
        if (this.container) {
            this.container.classList.remove('layout-hidden');
        }
        this.updateBackground();
        this.fetchStock();
        this.checkHighlights();
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

        this.checkHighlights();

        return current;
    }
};

window.TraanStockLayout = TraanStockLayout;
window.TraanStockPage = TraanStockLayout;
window.getTraanStockAtTimestamp = getTraanStockAtTimestamp;
