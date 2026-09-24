const MONTHS_DATA = [
    { number: 1, name: 'Hearthspan', season: 'Spring', suffix: '-span' },
    { number: 2, name: 'Rootwatch', season: 'Spring', suffix: '-watch' },
    { number: 3, name: 'Seedspan', season: 'Summer', suffix: '-span' },
    { number: 4, name: 'Bloomfall', season: 'Summer', suffix: '-fall' },
    { number: 5, name: 'Scythespan', season: 'Autumn', suffix: '-span' },
    { number: 6, name: 'Ardfall', season: 'Autumn', suffix: '-fall' },
    { number: 7, name: 'Saltspan', season: 'Winter', suffix: '-span' },
    { number: 8, name: 'Rimefall', season: 'Winter', suffix: '-fall' }
];

const SEASON_BACKGROUNDS = {
    Spring: 'assets/images/Seasons/Spring.webp',
    Summer: 'assets/images/Seasons/Summer.webp',
    Autumn: 'assets/images/Seasons/Autumn.webp',
    Winter: 'assets/images/Seasons/Winter.webp'
};

if (typeof Image !== 'undefined') {
    Object.values(SEASON_BACKGROUNDS).forEach((src) => {
        const img = new Image();
        img.src = src;
    });
}

const SEASON_WORLD_CHANGES = {
    Spring: [
        'Rain is more common.',
        'Fruits and wheat will start to spawn.',
        'Grass and Leaves are green.'
    ],
    Summer: [
        'Rain is less common.',
        'Abundant with fruits and wheat.',
        'Grass and Leaves are green.',
        'Sap is unlikely to appear.'
    ],
    Autumn: [
        'Rain has an average chance of appearing.',
        'Grass and Leaves are orange or orange variations.'
    ],
    Winter: [
        'Snow will cover the grass and leaves.',
        'Fruits, vegetables, etc. will not spawn.',
        '<a href="https://deepwoken.fandom.com/wiki/Stone_Knight" target="_blank" rel="noopener noreferrer" class="wiki-link">Blizzard Knights</a> will spawn if you enter the <a href="https://deepwoken.fandom.com/wiki/Valley_of_Heroes" target="_blank" rel="noopener noreferrer" class="wiki-link">Valley of Heroes</a>, triggered at the <a href="https://deepwoken.fandom.com/wiki/Aelita" target="_blank" rel="noopener noreferrer" class="wiki-link">Aelita Event</a> area.',
        '<a href="https://deepwoken.fandom.com/wiki/Hero_Blades" target="_blank" rel="noopener noreferrer" class="wiki-link">Hero Blades</a> and Ministry Cloaks may be fished up.',
        'The Trees in the <a href="https://deepwoken.fandom.com/wiki/Burning_Stone_Gardens" target="_blank" rel="noopener noreferrer" class="wiki-link">Burning Stone Gardens</a> emit a white glow instead of their usual orange.',
        '<a href="https://deepwoken.fandom.com/wiki/Hemobloom" target="_blank" rel="noopener noreferrer" class="wiki-link">Hemoblooms</a> can be found in <a href="https://deepwoken.fandom.com/wiki/The_Valley_of_Heroes" target="_blank" rel="noopener noreferrer" class="wiki-link">The Valley of Heroes</a>.'
    ]
};

const DAY_STAGES = [
    {
        name: 'Nighttime',
        displayName: 'Nighttime',
        startMin: 0,
        endMin: 5,
        nextStage: 'Dawn',
        talent: 'Dark Hours',
        styleClass: 'night'
    },
    {
        name: 'Dawn',
        displayName: 'Nighttime (Dawn)',
        startMin: 5,
        endMin: 10,
        nextStage: 'Daytime',
        talent: 'Dark Hours',
        styleClass: 'dawn'
    },
    {
        name: 'Dawn',
        displayName: 'Daytime (Dawn)',
        startMin: 10,
        endMin: 15,
        nextStage: 'Morning',
        talent: 'Praise the Sun',
        styleClass: 'morning'
    },
    {
        name: 'Morning',
        displayName: 'Daytime (Morning)',
        startMin: 15,
        endMin: 20,
        nextStage: 'Midday',
        talent: 'Praise the Sun',
        styleClass: 'morning'
    },
    {
        name: 'Midday',
        displayName: 'Daytime (Midday)',
        startMin: 20,
        endMin: 40,
        nextStage: 'Afternoon',
        talent: 'Praise the Sun',
        styleClass: 'day'
    },
    {
        name: 'Afternoon',
        displayName: 'Daytime (Afternoon)',
        startMin: 40,
        endMin: 45,
        nextStage: 'Dusk',
        talent: 'Praise the Sun',
        styleClass: 'afternoon'
    },
    {
        name: 'Dusk',
        displayName: 'Daytime (Dusk)',
        startMin: 45,
        endMin: 50,
        nextStage: 'Nighttime',
        talent: 'Praise the Sun',
        styleClass: 'afternoon'
    },
    {
        name: 'Dusk',
        displayName: 'Nighttime (Dusk)',
        startMin: 50,
        endMin: 55,
        nextStage: 'Nighttime',
        talent: 'Dark Hours',
        styleClass: 'dusk'
    },
    {
        name: 'Nighttime',
        displayName: 'Nighttime',
        startMin: 55,
        endMin: 60,
        nextStage: 'Dawn',
        talent: 'Dark Hours',
        styleClass: 'night'
    }
];

const DAY_MS = 24 * 60 * 60 * 1000;
const CURRENT_ANCHOR_TIMESTAMP = Date.UTC(2026, 8, 23, 0, 0, 0);
const CURRENT_ANCHOR_YEAR = 1661;
const CURRENT_ANCHOR_MONTH_INDEX = 5;

function formatDateSeasonsCountdown(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
    return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

function getDayNightStatus(now) {
    const d = new Date(now);
    const utcMinutes = d.getUTCMinutes();
    const utcSeconds = d.getUTCSeconds();
    const utcMillis = d.getUTCMilliseconds();
    const minuteFloat = utcMinutes + utcSeconds / 60 + utcMillis / 60000;

    let currentStage = DAY_STAGES[0];
    for (let i = 0; i < DAY_STAGES.length; i++) {
        const s = DAY_STAGES[i];
        if (minuteFloat >= s.startMin && minuteFloat < s.endMin) {
            currentStage = s;
            break;
        }
    }

    const isDay = minuteFloat >= 10 && minuteFloat < 50;
    const nextStageName = isDay ? 'Nighttime' : 'Daytime';
    let secondsUntilNext;

    if (isDay) {
        secondsUntilNext = (50 * 60) - (utcMinutes * 60 + utcSeconds);
    } else if (minuteFloat >= 50) {
        secondsUntilNext = (70 * 60) - (utcMinutes * 60 + utcSeconds);
    } else {
        secondsUntilNext = (10 * 60) - (utcMinutes * 60 + utcSeconds);
    }

    const elapsedRealSeconds = utcMinutes * 60 + utcSeconds + utcMillis / 1000;
    const inGameTotalSeconds = (elapsedRealSeconds * 24) % 86400;
    const inGameHours = Math.floor(inGameTotalSeconds / 3600);
    const inGameMinutes = Math.floor((inGameTotalSeconds % 3600) / 60);
    const inGameSeconds = Math.floor(inGameTotalSeconds % 60);

    return {
        stage: currentStage.name,
        displayStage: currentStage.displayName,
        nextStage: nextStageName,
        secondsUntilNextPhase: Math.max(0, secondsUntilNext),
        activePerkTitle: currentStage.talent,
        styleClass: currentStage.styleClass,
        isDay: isDay,
        inGameHours: inGameHours,
        inGameMinutes: inGameMinutes,
        inGameSeconds: inGameSeconds,
        utcHours: d.getUTCHours(),
        utcMinutes: utcMinutes,
        utcSeconds: utcSeconds
    };
}

function getCalendarStatus(now) {
    const daysFromAnchor = Math.floor((now - CURRENT_ANCHOR_TIMESTAMP) / DAY_MS);
    const totalMonths = CURRENT_ANCHOR_MONTH_INDEX + daysFromAnchor;
    const year = CURRENT_ANCHOR_YEAR + Math.floor(totalMonths / 8);
    const monthIndex = ((totalMonths % 8) + 8) % 8;
    const currentMonth = MONTHS_DATA[monthIndex];

    const currentDayStart = Math.floor(now / DAY_MS) * DAY_MS;
    const nextMidnightUTC = currentDayStart + DAY_MS;
    const secondsUntilNextMonth = Math.max(0, (nextMidnightUTC - now) / 1000);
    const dayProgress = (now - currentDayStart) / DAY_MS;

    const seasonMonthOffset = monthIndex % 2;
    const daysUntilNextSeason = (1 - seasonMonthOffset) * DAY_MS + (nextMidnightUTC - now);
    const secondsUntilNextSeason = Math.max(0, daysUntilNextSeason / 1000);

    const nextSeasonIndex = (Math.floor(monthIndex / 2) + 1) % 4;
    const nextSeasonNames = ['Spring', 'Summer', 'Autumn', 'Winter'];
    const nextSeasonName = nextSeasonNames[nextSeasonIndex];

    const monthsUntilNextYear = (7 - monthIndex) * DAY_MS + (nextMidnightUTC - now);
    const secondsUntilNextYear = Math.max(0, monthsUntilNextYear / 1000);

    const yearProgress = ((monthIndex + dayProgress) / 8) * 100;

    return {
        year,
        monthIndex,
        currentMonth,
        dayProgress,
        yearProgress,
        secondsUntilNextMonth,
        secondsUntilNextSeason,
        nextSeasonName,
        secondsUntilNextYear
    };
}

const DateSeasonsPage = {
    container: null,
    isMounted: false,
    elements: {},
    currentSeason: null,
    renderedSeason: null,

    init() {
        this.container = document.getElementById('date-seasons-layout');
        this.cacheElements();
    },

    cacheElements() {
        this.elements = {
            datetimeVal: document.getElementById('ds-datetime-val'),
            activeTalent: document.getElementById('ds-active-talent'),
            phaseHeading: document.getElementById('ds-phase-heading'),
            phaseName: document.getElementById('ds-phase-name'),
            timeLeftPrefix: document.getElementById('ds-time-left-prefix'),
            countdownVal: document.getElementById('ds-countdown-val'),
            seasonName: document.getElementById('ds-season-name'),
            seasonChangesCard: document.getElementById('ds-season-changes-card'),
            seasonChangesList: document.getElementById('ds-season-changes-list')
        };
    },

    mount() {
        this.isMounted = true;
        if (!this.container) {
            this.container = document.getElementById('date-seasons-layout');
            this.cacheElements();
        }
        if (this.container) {
            this.container.classList.remove('layout-hidden');
        }
        const bgDisasterEl = document.getElementById('bg-image-disaster');
        if (bgDisasterEl) {
            bgDisasterEl.style.backgroundImage = 'none';
        }
        const backdrop = document.getElementById('bg-backdrop');
        if (backdrop) {
            backdrop.classList.remove('slashed');
        }
        this.currentSeason = null;
        this.renderedSeason = null;
        const now = (typeof getAppTime === 'function') ? getAppTime() : Date.now();
        this.render(now);
    },

    unmount() {
        this.isMounted = false;
        if (!this.container) {
            this.container = document.getElementById('date-seasons-layout');
        }
        if (this.container) {
            this.container.classList.add('layout-hidden');
        }
        this.currentSeason = null;
        this.renderedSeason = null;
    },

    render(now) {
        if (!this.elements.phaseName) {
            this.cacheElements();
        }

        const dn = getDayNightStatus(now);
        const cal = getCalendarStatus(now);

        if (this.isMounted && this.currentSeason !== cal.currentMonth.season) {
            this.currentSeason = cal.currentMonth.season;
            const bgEl = document.getElementById('bg-image');
            if (bgEl) {
                const bgUrl = SEASON_BACKGROUNDS[cal.currentMonth.season] || SEASON_BACKGROUNDS.Autumn;
                bgEl.style.backgroundImage = `url("${bgUrl}")`;
            }
        }

        if (this.elements.datetimeVal) {
            const hh = String(dn.inGameHours).padStart(2, '0');
            const mm = String(dn.inGameMinutes).padStart(2, '0');
            this.elements.datetimeVal.textContent = `${hh}:${mm}, ${cal.year} CE, ${cal.currentMonth.name}`;
            this.elements.datetimeVal.className = '';
        }

        if (this.elements.activeTalent) {
            this.elements.activeTalent.textContent = dn.activePerkTitle;
            this.elements.activeTalent.className = `event-gradient-text gradient-${dn.styleClass} text-glow-${dn.styleClass}`;
        }

        if (this.elements.phaseName) {
            this.elements.phaseName.textContent = dn.displayStage;
            this.elements.phaseName.className = `event-gradient-text gradient-${dn.styleClass} text-glow-${dn.styleClass}`;
        }

        if (this.elements.timeLeftPrefix) {
            this.elements.timeLeftPrefix.textContent = `Time left until ${dn.nextStage}:`;
        }

        if (this.elements.countdownVal) {
            this.elements.countdownVal.textContent = formatDateSeasonsCountdown(dn.secondsUntilNextPhase);
        }

        if (this.elements.seasonName) {
            this.elements.seasonName.textContent = cal.currentMonth.name;
            const seasonClass = `gradient-season-${cal.currentMonth.season.toLowerCase()}`;
            this.elements.seasonName.className = `event-gradient-text ds-season-name ${seasonClass}`;
        }

        if (this.elements.seasonChangesList && this.renderedSeason !== cal.currentMonth.season) {
            this.renderedSeason = cal.currentMonth.season;
            const changes = SEASON_WORLD_CHANGES[cal.currentMonth.season] || SEASON_WORLD_CHANGES.Autumn;
            this.elements.seasonChangesList.innerHTML = changes.map(text => `<li>${text}</li>`).join('');
        }
    }
};

if (typeof window !== 'undefined') {
    window.DateSeasonsPage = DateSeasonsPage;
    window.DateSeasonsLayout = DateSeasonsPage;
    window.getDayNightStatus = getDayNightStatus;
    window.getCalendarStatus = getCalendarStatus;
    window.DEEPWOKEN_MONTHS = MONTHS_DATA;
    window.SEASON_BACKGROUNDS = SEASON_BACKGROUNDS;
    window.SEASON_WORLD_CHANGES = SEASON_WORLD_CHANGES;
    window.DAY_STAGES = DAY_STAGES;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DateSeasonsPage,
        getDayNightStatus,
        getCalendarStatus,
        MONTHS_DATA,
        SEASON_BACKGROUNDS,
        SEASON_WORLD_CHANGES,
        DAY_STAGES
    };
}
