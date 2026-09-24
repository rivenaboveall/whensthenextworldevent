const DeepwokenClock = {
    anchorTimestamp: Date.UTC(2026, 8, 23, 0, 0, 0),
    anchorYear: 1661,
    anchorMonthIndex: 5,
    dayMs: 24 * 60 * 60 * 1000,

    months: [
        { number: 1, name: 'Hearthspan', season: 'Spring', suffix: '-span' },
        { number: 2, name: 'Rootwatch', season: 'Spring', suffix: '-watch' },
        { number: 3, name: 'Seedspan', season: 'Summer', suffix: '-span' },
        { number: 4, name: 'Bloomfall', season: 'Summer', suffix: '-fall' },
        { number: 5, name: 'Scythespan', season: 'Autumn', suffix: '-span' },
        { number: 6, name: 'Ardfall', season: 'Autumn', suffix: '-fall' },
        { number: 7, name: 'Saltspan', season: 'Winter', suffix: '-span' },
        { number: 8, name: 'Rimefall', season: 'Winter', suffix: '-fall' }
    ],

    dayStages: [
        { name: 'Nighttime', displayName: 'Nighttime', startMin: 0, endMin: 5, nextStage: 'Dawn', talent: 'Dark Hours', styleClass: 'night' },
        { name: 'Dawn', displayName: 'Nighttime (Dawn)', startMin: 5, endMin: 10, nextStage: 'Daytime', talent: 'Dark Hours', styleClass: 'dawn' },
        { name: 'Dawn', displayName: 'Daytime (Dawn)', startMin: 10, endMin: 15, nextStage: 'Morning', talent: 'Praise the Sun', styleClass: 'morning' },
        { name: 'Morning', displayName: 'Daytime (Morning)', startMin: 15, endMin: 20, nextStage: 'Midday', talent: 'Praise the Sun', styleClass: 'morning' },
        { name: 'Midday', displayName: 'Daytime (Midday)', startMin: 20, endMin: 40, nextStage: 'Afternoon', talent: 'Praise the Sun', styleClass: 'day' },
        { name: 'Afternoon', displayName: 'Daytime (Afternoon)', startMin: 40, endMin: 45, nextStage: 'Dusk', talent: 'Praise the Sun', styleClass: 'afternoon' },
        { name: 'Dusk', displayName: 'Daytime (Dusk)', startMin: 45, endMin: 50, nextStage: 'Nighttime', talent: 'Praise the Sun', styleClass: 'afternoon' },
        { name: 'Dusk', displayName: 'Nighttime (Dusk)', startMin: 50, endMin: 55, nextStage: 'Nighttime', talent: 'Dark Hours', styleClass: 'dusk' },
        { name: 'Nighttime', displayName: 'Nighttime', startMin: 55, endMin: 60, nextStage: 'Dawn', talent: 'Dark Hours', styleClass: 'night' }
    ],

    getDayNightStatus(timestamp) {
        const d = new Date(timestamp);
        const utcMinutes = d.getUTCMinutes();
        const utcSeconds = d.getUTCSeconds();
        const utcMillis = d.getUTCMilliseconds();
        const minuteFloat = utcMinutes + utcSeconds / 60 + utcMillis / 60000;

        let currentStage = this.dayStages[0];
        for (let i = 0; i < this.dayStages.length; i++) {
            const s = this.dayStages[i];
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
    },

    getCalendarStatus(timestamp) {
        const daysFromAnchor = Math.floor((timestamp - this.anchorTimestamp) / this.dayMs);
        const totalMonths = this.anchorMonthIndex + daysFromAnchor;
        const year = this.anchorYear + Math.floor(totalMonths / 8);
        const monthIndex = ((totalMonths % 8) + 8) % 8;
        const currentMonth = this.months[monthIndex];

        const currentDayStart = Math.floor(timestamp / this.dayMs) * this.dayMs;
        const nextMidnightUTC = currentDayStart + this.dayMs;
        const secondsUntilNextMonth = Math.max(0, (nextMidnightUTC - timestamp) / 1000);
        const dayProgress = (timestamp - currentDayStart) / this.dayMs;

        const seasonMonthOffset = monthIndex % 2;
        const daysUntilNextSeason = (1 - seasonMonthOffset) * this.dayMs + (nextMidnightUTC - timestamp);
        const secondsUntilNextSeason = Math.max(0, daysUntilNextSeason / 1000);

        const nextSeasonIndex = (Math.floor(monthIndex / 2) + 1) % 4;
        const nextSeasonNames = ['Spring', 'Summer', 'Autumn', 'Winter'];
        const nextSeasonName = nextSeasonNames[nextSeasonIndex];

        const monthsUntilNextYear = (7 - monthIndex) * this.dayMs + (nextMidnightUTC - timestamp);
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
    },

    formatCountdown(totalSeconds) {
        const s = Math.max(0, Math.floor(totalSeconds));
        const hours = Math.floor(s / 3600);
        const minutes = Math.floor((s % 3600) / 60);
        const seconds = s % 60;
        if (hours > 0) {
            return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        }
        return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
};

const WorldEventClock = {
    worldAnchorTimestamp: Date.UTC(2026, 8, 20, 22, 30, 0),
    disasterAnchorTimestamp: Date.UTC(2026, 8, 20, 22, 0, 0),
    worldIntervalMs: 30 * 60 * 1000,
    disasterIntervalMs: 60 * 60 * 1000,
    joinWindowMs: 5 * 60 * 1000,

    worldEvents: [
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
    ],

    disasters: [
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
    ],

    getWorldEventAtTimestamp(timestamp) {
        const diff = timestamp - this.worldAnchorTimestamp;
        const slotIndex = Math.floor(diff / this.worldIntervalMs);
        const eventIndex = ((slotIndex % this.worldEvents.length) + this.worldEvents.length) % this.worldEvents.length;
        const startTime = this.worldAnchorTimestamp + slotIndex * this.worldIntervalMs;
        return {
            event: this.worldEvents[eventIndex],
            slotIndex,
            startTime,
            endTime: startTime + this.worldIntervalMs
        };
    },

    getDisasterAtTimestamp(timestamp) {
        const diff = timestamp - this.disasterAnchorTimestamp;
        const slotIndex = Math.floor(diff / this.disasterIntervalMs);
        const disasterIndex = ((slotIndex % this.disasters.length) + this.disasters.length) % this.disasters.length;
        const startTime = this.disasterAnchorTimestamp + slotIndex * this.disasterIntervalMs;
        return {
            disaster: this.disasters[disasterIndex],
            slotIndex,
            startTime,
            endTime: startTime + this.disasterIntervalMs
        };
    },

    formatCountdown(milliseconds) {
        const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    formatDurationLabel(milliseconds, what) {
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
};

const BlackMarketClock = {
    intervalMs: 20 * 60 * 60 * 1000,
    anchorTimestamp: Date.UTC(2026, 8, 23, 4, 0, 0),

    getTraanStockAtTimestamp(timestamp) {
        const diff = timestamp - this.anchorTimestamp;
        const slotIndex = Math.floor(diff / this.intervalMs);
        const startTime = this.anchorTimestamp + slotIndex * this.intervalMs;
        return {
            slotIndex,
            startTime,
            endTime: startTime + this.intervalMs
        };
    },

    formatCountdown(milliseconds) {
        const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
            return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
};

const Clock = {
    offsetMs: 0,

    deepwoken: DeepwokenClock,
    worldEvents: WorldEventClock,
    blackMarket: BlackMarketClock,

    getTime() {
        return Date.now() + this.offsetMs;
    },

    now() {
        return this.getTime();
    },

    setOffset(ms) {
        this.offsetMs = ms;
    },

    getOffset() {
        return this.offsetMs;
    },

    addOffset(ms) {
        this.offsetMs += ms;
        return this.getTime();
    }
};

if (typeof window !== 'undefined') {
    window.Clock = Clock;
    window.DeepwokenClock = DeepwokenClock;
    window.WorldEventClock = WorldEventClock;
    window.BlackMarketClock = BlackMarketClock;

    window.getAppTime = () => Clock.getTime();
    window.getWorldEventAtTimestamp = (t) => WorldEventClock.getWorldEventAtTimestamp(t);
    window.getDisasterAtTimestamp = (t) => WorldEventClock.getDisasterAtTimestamp(t);
    window.getTraanStockAtTimestamp = (t) => BlackMarketClock.getTraanStockAtTimestamp(t);
    window.getDayNightStatus = (t) => DeepwokenClock.getDayNightStatus(t);
    window.getCalendarStatus = (t) => DeepwokenClock.getCalendarStatus(t);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Clock,
        DeepwokenClock,
        WorldEventClock,
        BlackMarketClock
    };
}
