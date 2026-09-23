const WORLD_EVENTS = [
    {
        name: 'Battle Royale',
        gradientClass: 'gradient-battle-royale',
        textGlowClass: 'text-glow-battle-royale',
        bgImage: 'assets/images/BattleRoyale.webp'
    },
    {
        name: 'Carnival of Hearts',
        gradientClass: 'gradient-carnival',
        textGlowClass: 'text-glow-carnival',
        bgImage: 'assets/images/Carnival.webp'
    },
    {
        name: 'Interluminary Interloper',
        gradientClass: 'gradient-interluminary',
        textGlowClass: 'text-glow-interluminary',
        bgImage: 'assets/images/Parasol.webp'
    }
];

const DISASTERS = [
    {
        name: 'Cinders of Etris',
        gradientClass: 'disaster-gradient-etris',
        textGlowClass: 'text-glow-etris',
        bgImage: 'assets/images/CindersOfEtris.webp'
    },
    {
        name: 'Doom of Caeranthil',
        gradientClass: 'disaster-gradient-caeranthil',
        textGlowClass: 'text-glow-caeranthil',
        bgImage: 'assets/images/Caeranthil.webp'
    }
];

const TRAAN_BG_IMAGE = 'assets/images/Traan.webp';

const PRELOAD_IMAGES = [
    'assets/images/BattleRoyale.webp',
    'assets/images/Carnival.webp',
    'assets/images/Parasol.webp',
    'assets/images/CindersOfEtris.webp',
    'assets/images/Caeranthil.webp',
    'assets/images/Traan.webp'
];

PRELOAD_IMAGES.forEach((src) => {
    const img = new Image();
    img.src = src;
});

const WORLD_ANCHOR_TIMESTAMP = Date.UTC(2026, 8, 20, 22, 30, 0);
const DISASTER_ANCHOR_TIMESTAMP = Date.UTC(2026, 8, 20, 22, 0, 0);

const WORLD_INTERVAL_MS = 30 * 60 * 1000;
const DISASTER_INTERVAL_MS = 60 * 60 * 1000;
const JOIN_WINDOW_MS = 5 * 60 * 1000;

function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDurationLabel(milliseconds, what) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const minuteUnit = minutes === 1 ? 'minute' : 'minutes';
    const secondUnit = seconds === 1 ? 'second' : 'seconds';

    if (what) {
        if (minutes > 0) {
            return `${minutes} ${minuteUnit} and ${seconds} ${secondUnit} left until next ${what}`;
        }
        return `${seconds} ${secondUnit} left until next ${what}`;
    }

    if (minutes > 0) {
        return `${minutes} ${minuteUnit} and ${seconds} ${secondUnit}`;
    }
    return `${seconds} ${secondUnit}`;
}

function applyPreviewStyling(element, itemData) {
    if (!element || !itemData) {
        return;
    }
    element.textContent = itemData.name;
    element.className = `event-gradient-text ${itemData.gradientClass}`;
}

function getWorldEventAtTimestamp(timestamp) {
    const diff = timestamp - WORLD_ANCHOR_TIMESTAMP;
    const slotIndex = Math.floor(diff / WORLD_INTERVAL_MS);
    const eventIndex = ((slotIndex % 3) + 3) % 3;
    const startTime = WORLD_ANCHOR_TIMESTAMP + slotIndex * WORLD_INTERVAL_MS;
    return {
        event: WORLD_EVENTS[eventIndex],
        slotIndex,
        startTime,
        endTime: startTime + WORLD_INTERVAL_MS
    };
}

function getDisasterAtTimestamp(timestamp) {
    const diff = timestamp - DISASTER_ANCHOR_TIMESTAMP;
    const slotIndex = Math.floor(diff / DISASTER_INTERVAL_MS);
    const disasterIndex = ((slotIndex % 2) + 2) % 2;
    const startTime = DISASTER_ANCHOR_TIMESTAMP + slotIndex * DISASTER_INTERVAL_MS;
    return {
        disaster: DISASTERS[disasterIndex],
        slotIndex,
        startTime,
        endTime: startTime + DISASTER_INTERVAL_MS
    };
}

const WorldEventsLayout = {
    eventsGrid: null,
    disastersToggleBtn: null,
    disastersToggleLabel: null,
    bottomTimersContainer: null,
    bottomTimersGrid: null,
    disasterTimerColumn: null,
    disasterTimerBlock: null,
    bgBackdrop: null,
    bgImageElement: null,
    bgImageDisasterElement: null,
    bgCurtainElement: null,
    isTransitioningBg: false,
    pastEventNameElement: null,
    nextEventNameElement: null,
    currentEventNameElement: null,
    joinStatusElement: null,
    mainTimerElement: null,
    mainMobileTimerElement: null,
    pastDisasterNameElement: null,
    nextDisasterNameElement: null,
    currentDisasterNameElement: null,
    disasterTimerElement: null,
    disasterMobileTimerElement: null,
    isDisastersVisible: localStorage.getItem('user_disasters_visible') !== 'false',
    currentActiveBg: '',
    currentActiveDisasterBg: '',
    isMounted: false,
    _bgTransitionTimeout: null,
    _bgFadeInTimeout: null,

    init() {
        this.eventsGrid = document.getElementById('events-grid');
        this.disastersToggleBtn = document.getElementById('menu-item-disasters') || document.getElementById('disasters-toggle');
        this.menuDisastersStatus = document.getElementById('menu-disasters-status');
        this.bottomTimersContainer = document.getElementById('bottom-timers-container');
        this.bottomTimersGrid = document.getElementById('bottom-timers-grid');
        this.disasterTimerColumn = document.getElementById('disaster-timer-column');
        this.disasterTimerBlock = document.getElementById('disaster-timer-block');
        this.bgBackdrop = document.getElementById('bg-backdrop');
        this.bgImageElement = document.getElementById('bg-image');
        this.bgImageDisasterElement = document.getElementById('bg-image-disaster');
        this.bgCurtainElement = document.getElementById('bg-black-curtain');

        const activeLayout = (window.location && window.location.pathname && window.location.pathname.toLowerCase().includes('/traan-zakshun')) ? 'traanstock' : 'worldevents';
        const now = (typeof getAppTime === 'function') ? getAppTime() : Date.now();
        const initialWorld = getWorldEventAtTimestamp(now);
        if (initialWorld && initialWorld.event) {
            this.currentActiveBg = initialWorld.event.bgImage;
        }
        const initialDisaster = getDisasterAtTimestamp(now);
        if (initialDisaster && initialDisaster.disaster) {
            this.currentActiveDisasterBg = initialDisaster.disaster.bgImage;
        }

        if (activeLayout === 'traanstock') {
            if (this.bgImageElement) {
                this.bgImageElement.style.backgroundImage = `url("${TRAAN_BG_IMAGE}")`;
            }
            if (this.bgBackdrop) {
                this.bgBackdrop.classList.remove('slashed');
            }
            if (this.bgCurtainElement) {
                this.bgCurtainElement.classList.remove('fade-black');
            }
        } else {
            if (this.bgImageElement && this.currentActiveBg) {
                this.bgImageElement.style.backgroundImage = `url("${this.currentActiveBg}")`;
            }
            if (this.bgImageDisasterElement && this.currentActiveDisasterBg) {
                this.bgImageDisasterElement.style.backgroundImage = `url("${this.currentActiveDisasterBg}")`;
            }
            if (this.isDisastersVisible && this.bgBackdrop) {
                this.bgBackdrop.classList.add('slashed');
            }
            if (this.bgCurtainElement) {
                this.bgCurtainElement.classList.remove('fade-black');
            }
        }

        this.pastEventNameElement = document.getElementById('past-event-name');
        this.nextEventNameElement = document.getElementById('next-event-name');
        this.currentEventNameElement = document.getElementById('current-event-name');
        this.joinStatusElement = document.getElementById('join-status');
        this.mainTimerElement = document.getElementById('main-timer');
        this.mainMobileTimerElement = document.getElementById('main-mobile-timer');

        this.pastDisasterNameElement = document.getElementById('past-disaster-name');
        this.nextDisasterNameElement = document.getElementById('next-disaster-name');
        this.currentDisasterNameElement = document.getElementById('current-disaster-name');
        this.disasterTimerElement = document.getElementById('disaster-timer');
        this.disasterMobileTimerElement = document.getElementById('disaster-mobile-timer');

        if (this.disastersToggleBtn) {
            this.disastersToggleBtn.addEventListener('click', () => {
                this.isDisastersVisible = !this.isDisastersVisible;
                localStorage.setItem('user_disasters_visible', String(this.isDisastersVisible));
                this.updateDisastersVisibilityUI();
                const now = (typeof getAppTime === 'function') ? getAppTime() : Date.now();
                this.render(now);
            });
        }
    },

    updateDisastersVisibilityUI() {
        if (!this.eventsGrid) {
            return;
        }
        if (this.isDisastersVisible) {
            this.eventsGrid.classList.remove('single-column');
            if (this.bottomTimersGrid) {
                this.bottomTimersGrid.classList.remove('single-column');
            }
            if (this.disasterTimerColumn) {
                this.disasterTimerColumn.classList.remove('timer-hidden');
            }
            if (this.disasterTimerBlock) {
                this.disasterTimerBlock.classList.remove('timer-hidden');
            }
            if (!this.currentActiveDisasterBg) {
                const now = (typeof getAppTime === 'function') ? getAppTime() : Date.now();
                const initialDisaster = getDisasterAtTimestamp(now);
                if (initialDisaster && initialDisaster.disaster) {
                    this.currentActiveDisasterBg = initialDisaster.disaster.bgImage;
                }
            }
            if (this.bgImageDisasterElement && this.currentActiveDisasterBg) {
                this.bgImageDisasterElement.style.backgroundImage = `url("${this.currentActiveDisasterBg}")`;
            }
            if (this.bgBackdrop) {
                this.bgBackdrop.classList.add('slashed');
            }
            if (this.disasterTimerElement) {
                this.disasterTimerElement.classList.remove('timer-hidden');
            }
            if (this.menuDisastersStatus) {
                this.menuDisastersStatus.textContent = 'Shown';
                this.menuDisastersStatus.classList.add('status-active');
            }
        } else {
            this.eventsGrid.classList.add('single-column');
            if (this.bottomTimersGrid) {
                this.bottomTimersGrid.classList.add('single-column');
            }
            if (this.disasterTimerColumn) {
                this.disasterTimerColumn.classList.add('timer-hidden');
            }
            if (this.disasterTimerBlock) {
                this.disasterTimerBlock.classList.add('timer-hidden');
            }
            if (this.bgBackdrop) {
                this.bgBackdrop.classList.remove('slashed');
            }
            if (this.disasterTimerElement) {
                this.disasterTimerElement.classList.add('timer-hidden');
            }
            if (this.menuDisastersStatus) {
                this.menuDisastersStatus.textContent = 'Hidden';
                this.menuDisastersStatus.classList.remove('status-active');
            }
        }
        if (this.disastersToggleBtn) {
            this.disastersToggleBtn.setAttribute('aria-pressed', String(this.isDisastersVisible));
            this.disastersToggleBtn.classList.toggle('active', this.isDisastersVisible);
        }
    },

    mount() {
        this.isMounted = true;
        if (this.eventsGrid) {
            this.eventsGrid.classList.remove('layout-hidden');
        }
        if (this.bottomTimersContainer) {
            this.bottomTimersContainer.classList.remove('layout-hidden');
        }
        if (this.disastersToggleBtn) {
            this.disastersToggleBtn.style.display = '';
        }
        if (this.bgImageElement && this.currentActiveBg) {
            this.bgImageElement.style.backgroundImage = `url("${this.currentActiveBg}")`;
        }
        this.updateDisastersVisibilityUI();
    },

    unmount() {
        this.isMounted = false;
        if (this.eventsGrid) {
            this.eventsGrid.classList.add('layout-hidden');
        }
        if (this.bottomTimersContainer) {
            this.bottomTimersContainer.classList.add('layout-hidden');
        }
        if (this.bgBackdrop) {
            this.bgBackdrop.classList.remove('slashed');
        }
    },

    transitionToBackground(nextWorldBg, nextDisasterBg) {
        if (!this.bgCurtainElement) {
            if (nextWorldBg && this.bgImageElement) {
                this.bgImageElement.style.backgroundImage = `url("${nextWorldBg}")`;
            }
            if (nextDisasterBg && this.bgImageDisasterElement) {
                this.bgImageDisasterElement.style.backgroundImage = `url("${nextDisasterBg}")`;
            }
            return;
        }

        if (this._bgTransitionTimeout) {
            clearTimeout(this._bgTransitionTimeout);
        }
        if (this._bgFadeInTimeout) {
            clearTimeout(this._bgFadeInTimeout);
        }

        this.isTransitioningBg = true;
        this.bgCurtainElement.classList.add('fade-black');

        this._bgTransitionTimeout = setTimeout(() => {
            if (nextWorldBg && this.bgImageElement) {
                this.bgImageElement.style.backgroundImage = `url("${nextWorldBg}")`;
            }
            if (nextDisasterBg && this.bgImageDisasterElement) {
                this.bgImageDisasterElement.style.backgroundImage = `url("${nextDisasterBg}")`;
            }

            this._bgFadeInTimeout = setTimeout(() => {
                if (this.isMounted && this.bgCurtainElement) {
                    this.bgCurtainElement.classList.remove('fade-black');
                }
                setTimeout(() => {
                    this.isTransitioningBg = false;
                }, 600);
            }, 50);
        }, 600);
    },

    renderWorldEvents(now) {
        const current = getWorldEventAtTimestamp(now);
        const previous = getWorldEventAtTimestamp(current.startTime - 1);
        const next = getWorldEventAtTimestamp(current.endTime + 1);

        if (this.currentEventNameElement) {
            this.currentEventNameElement.textContent = current.event.name;
            this.currentEventNameElement.className = `current-event-title event-gradient-text ${current.event.gradientClass} ${current.event.textGlowClass}`;
        }

        const elapsedSinceStart = now - current.startTime;
        const remainingJoinWindow = JOIN_WINDOW_MS - elapsedSinceStart;

        if (this.joinStatusElement) {
            if (remainingJoinWindow > 0) {
                const formattedJoin = formatCountdown(remainingJoinWindow);
                this.joinStatusElement.innerHTML = `Time Left to join: <span class="status-active-value">${formattedJoin}</span>`;
            } else {
                this.joinStatusElement.innerHTML = `You can <span class="status-no-longer">no longer</span> join<span class="join-event-suffix"> this event</span>`;
            }
        }

        if (this.pastEventNameElement) {
            applyPreviewStyling(this.pastEventNameElement, previous.event);
        }
        if (this.nextEventNameElement) {
            applyPreviewStyling(this.nextEventNameElement, next.event);
        }

        const timeUntilNext = current.endTime - now;
        if (this.mainTimerElement) {
            this.mainTimerElement.textContent = formatDurationLabel(timeUntilNext, 'World Event');
        }
        if (this.mainMobileTimerElement) {
            this.mainMobileTimerElement.innerHTML = `<span class="event-gradient-text ${next.event.gradientClass}">${next.event.name}</span>&nbsp;in ${formatDurationLabel(timeUntilNext)}`;
        }
        return current;
    },

    renderDisasters(now) {
        const current = getDisasterAtTimestamp(now);
        const previous = getDisasterAtTimestamp(current.startTime - 1);
        const next = getDisasterAtTimestamp(current.endTime + 1);

        if (!this.isDisastersVisible) {
            return current;
        }

        if (this.currentDisasterNameElement) {
            this.currentDisasterNameElement.textContent = current.disaster.name;
            this.currentDisasterNameElement.className = `current-event-title event-gradient-text ${current.disaster.gradientClass} ${current.disaster.textGlowClass}`;
        }

        if (this.pastDisasterNameElement) {
            applyPreviewStyling(this.pastDisasterNameElement, previous.disaster);
        }
        if (this.nextDisasterNameElement) {
            applyPreviewStyling(this.nextDisasterNameElement, next.disaster);
        }

        const timeUntilNext = current.endTime - now;
        if (this.disasterTimerElement) {
            this.disasterTimerElement.textContent = formatDurationLabel(timeUntilNext, 'Disaster');
        }
        if (this.disasterMobileTimerElement) {
            this.disasterMobileTimerElement.innerHTML = `<span class="event-gradient-text ${next.disaster.gradientClass}">${next.disaster.name}</span>&nbsp;in ${formatDurationLabel(timeUntilNext)}`;
        }
        return current;
    },

    render(now) {
        const currentWorld = this.renderWorldEvents(now);
        const currentDisaster = this.renderDisasters(now);

        const worldBgChanged = currentWorld && this.currentActiveBg !== currentWorld.event.bgImage;
        const disasterBgChanged = currentDisaster && this.currentActiveDisasterBg !== currentDisaster.disaster.bgImage;

        if (worldBgChanged || disasterBgChanged) {
            const nextWorldBg = currentWorld ? currentWorld.event.bgImage : this.currentActiveBg;
            const nextDisasterBg = currentDisaster ? currentDisaster.disaster.bgImage : this.currentActiveDisasterBg;
            const isInitial = this.currentActiveBg === '' && this.currentActiveDisasterBg === '';

            this.currentActiveBg = nextWorldBg;
            this.currentActiveDisasterBg = nextDisasterBg;

            if (isInitial) {
                if (this.isMounted) {
                    if (this.bgImageElement) {
                        this.bgImageElement.style.backgroundImage = `url("${nextWorldBg}")`;
                    }
                    if (this.bgImageDisasterElement) {
                        this.bgImageDisasterElement.style.backgroundImage = `url("${nextDisasterBg}")`;
                    }
                }
            } else if (this.isMounted) {
                this.transitionToBackground(nextWorldBg, nextDisasterBg);
            }
        }

        return { currentWorld, currentDisaster };
    }
};

window.WorldEventsLayout = WorldEventsLayout;
