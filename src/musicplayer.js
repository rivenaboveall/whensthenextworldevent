const TRACK_METADATA = {
    'Battle Royale': {
        type: 'single',
        src: 'assets/music/BattleRoyale.mp3',
        duration: 192.017417
    },
    'Carnival of Hearts': {
        type: 'variants',
        variant1: {
            src: 'assets/music/Carnival1.mp3',
            duration: 201.142857
        },
        variant2: {
            src: 'assets/music/Carnival2.mp3',
            duration: 179.2
        }
    },
    'Interluminary Interloper': {
        type: 'variants',
        variant1: {
            src: 'assets/music/Parasol1.mp3',
            duration: 141.293424
        },
        variant2: {
            src: 'assets/music/Parasol2.mp3',
            duration: 137.822125
        }
    },
    'Traan': {
        type: 'single',
        src: 'assets/music/Traan.mp3',
        duration: 150.952925
    },
    'Seasonal': {
        type: 'single',
        src: 'assets/music/Seasonal.mp3',
        duration: 166.582857
    }
};

function fadeAudio(audio, targetVol, durationMs, onComplete) {
    if (!audio) {
        return;
    }
    if (audio._fadeInterval) {
        clearInterval(audio._fadeInterval);
        audio._fadeInterval = null;
    }
    const startVol = audio.volume;
    const diff = targetVol - startVol;
    if (Math.abs(diff) < 0.01 || durationMs <= 0) {
        audio.volume = Math.max(0, Math.min(1, targetVol));
        if (onComplete) {
            onComplete();
        }
        return;
    }
    const stepTime = 30;
    const steps = Math.max(1, Math.floor(durationMs / stepTime));
    const stepDiff = diff / steps;
    let currentStep = 0;

    audio._fadeInterval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
            audio.volume = Math.max(0, Math.min(1, targetVol));
            clearInterval(audio._fadeInterval);
            audio._fadeInterval = null;
            if (onComplete) {
                onComplete();
            }
        } else {
            audio.volume = Math.max(0, Math.min(1, startVol + stepDiff * currentStep));
        }
    }, stepTime);
}

function detectInitialMusicLayout() {
    if (typeof window === 'undefined') {
        return 'worldevents';
    }
    const redirect = sessionStorage.getItem('redirect_path');
    const path = ((redirect || (window.location && window.location.pathname)) || '').toLowerCase();
    if (path.includes('/traan-zakshun')) {
        return 'traanstock';
    }
    if (path.includes('/date-seasons')) {
        return 'dateseasons';
    }
    return 'worldevents';
}

function getInitialVolume() {
    const saved = localStorage.getItem('user_soundtrack_volume');
    if (saved !== null && saved !== '') {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) {
            const normalized = parsed > 1 ? parsed / 100 : parsed;
            return Math.max(0, Math.min(1, normalized));
        }
    }
    return 0.5;
}

const MusicPlayer = {
    audio: null,
    announcementAudio: null,
    currentTrackSrc: '',
    targetVolume: getInitialVolume(),
    get isMuted() {
        return this.targetVolume <= 0;
    },
    set isMuted(val) {
        if (val) {
            this.setVolume(0);
        } else if (this.targetVolume <= 0) {
            this.setVolume(0.5);
        }
    },
    activeLayout: detectInitialMusicLayout(),
    hasInteracted: false,
    transitionPhase: 'normal',
    lastWorldSlotIndex: null,
    fadedOutSlotIndex: null,
    _syncGen: 0,
    _initialized: false,

    get worldAudio() {
        return this.audio;
    },
    set worldAudio(val) {
        this.audio = val;
    },
    get traanAudio() {
        return this.audio;
    },
    set traanAudio(val) {
        this.audio = val;
    },
    get seasonAudio() {
        return this.audio;
    },
    set seasonAudio(val) {
        this.audio = val;
    },

    init(layout) {
        if (layout) {
            this.activeLayout = layout;
        } else {
            this.activeLayout = detectInitialMusicLayout();
        }

        if (this._initialized && this.audio) {
            this.sync(typeof getAppTime === 'function' ? getAppTime() : Date.now());
            return;
        }
        this._initialized = true;

        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }

        this.audio = new Audio();
        this.audio.preload = 'auto';
        this.audio.loop = true;
        this.audio.volume = 0;

        if (!this.announcementAudio) {
            this.announcementAudio = new Audio('assets/sounds/Announcement.mp3');
            this.announcementAudio.preload = 'auto';
            this.announcementAudio.volume = this.targetVolume;
            this.announcementAudio.addEventListener('ended', () => {
                this.handleAnnouncementEnded();
            });
        }

        const initialNow = typeof getAppTime === 'function' ? getAppTime() : Date.now();
        const worldFetcher = window.getWorldEventAtTimestamp || getWorldEventAtTimestamp;
        const initialWorld = typeof worldFetcher === 'function' ? worldFetcher(initialNow) : null;
        this.lastWorldSlotIndex = initialWorld ? initialWorld.slotIndex : null;

        const unlock = () => {
            this.hasInteracted = true;
            window.removeEventListener('pointerdown', unlock, { capture: true });
            window.removeEventListener('click', unlock, { capture: true });
            window.removeEventListener('keydown', unlock, { capture: true });
            window.removeEventListener('touchstart', unlock, { capture: true });

            if (this.announcementAudio) {
                this.announcementAudio.load();
            }

            if (!this.isMuted && this.audio && (this.audio.paused || this.audio.volume < 0.05)) {
                this.audio.play().then(() => {
                    fadeAudio(this.audio, this.targetVolume, 1500);
                }).catch(() => { });
            }
        };

        window.addEventListener('pointerdown', unlock, { capture: true });
        window.addEventListener('click', unlock, { capture: true });
        window.addEventListener('keydown', unlock, { capture: true });
        window.addEventListener('touchstart', unlock, { capture: true, passive: true });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !this.isMuted && this.audio && this.transitionPhase === 'normal') {
                if (this.audio.paused) {
                    this.audio.play().then(() => {
                        this.hasInteracted = true;
                        fadeAudio(this.audio, this.targetVolume, 1000);
                    }).catch(() => { });
                }
            }
        });

        this.sync(initialNow, false);
    },

    pauseInactiveAudios() {
    },

    getActiveAudio() {
        return this.audio;
    },

    getInactiveAudio() {
        return null;
    },

    handleAnnouncementEnded() {
        if (this.transitionPhase === 'announcing') {
            this.transitionPhase = 'normal';
            if (this.activeLayout === 'worldevents' && !this.isMuted && this.audio) {
                const now = typeof getAppTime === 'function' ? getAppTime() : Date.now();
                const info = this.getTargetTrackInfo(now);
                if (info) {
                    const trackChanged = this.currentTrackSrc !== info.src;
                    this.currentTrackSrc = info.src;
                    if (trackChanged || !this.audio.src || !this.audio.src.includes(info.src)) {
                        this.audio.src = info.src;
                        this.audio.loop = true;
                    }
                    const seekAndPlay = () => {
                        const dur = this.audio.duration || info.duration;
                        try {
                            this.audio.currentTime = info.targetTime % dur;
                        } catch (e) { }
                        if (!this.isMuted) {
                            this.audio.play().then(() => {
                                this.hasInteracted = true;
                                fadeAudio(this.audio, this.targetVolume, 2000);
                            }).catch(() => { });
                        }
                    };
                    if (this.audio.readyState >= 2) {
                        seekAndPlay();
                    } else {
                        this.audio.addEventListener('canplay', seekAndPlay, { once: true });
                        if (trackChanged) {
                            this.audio.load();
                        }
                    }
                }
            }
        }
    },

    setLayout(layout) {
        if (this.activeLayout !== layout) {
            this.activeLayout = layout;
            this.currentTrackSrc = '';
            this.resetTransition();

            if (this.audio) {
                if (this.audio._fadeInterval) {
                    clearInterval(this.audio._fadeInterval);
                    this.audio._fadeInterval = null;
                }
                this.audio.pause();
                this.audio.volume = 0;
            }

            const now = typeof getAppTime === 'function' ? getAppTime() : Date.now();
            this.sync(now);
        }
    },

    setVolume(volume) {
        const val = Math.max(0, Math.min(1, Number(volume)));
        this.targetVolume = val;
        if (this.announcementAudio) {
            this.announcementAudio.volume = val;
        }
        if (this.audio) {
            if (this.audio._fadeInterval) {
                clearInterval(this.audio._fadeInterval);
                this.audio._fadeInterval = null;
            }
            if (val <= 0) {
                this.audio.volume = 0;
                this.audio.pause();
            } else {
                this.audio.volume = val;
                if (this.audio.paused && this.hasInteracted && this.transitionPhase === 'normal') {
                    this.audio.play().catch(() => {});
                }
            }
        }
    },

    setMuted(muted) {
        this.isMuted = muted;
    },

    resetTransition() {
        this.transitionPhase = 'normal';
        this.fadedOutSlotIndex = null;
        if (this.announcementAudio) {
            this.announcementAudio.pause();
            this.announcementAudio.currentTime = 0;
        }
    },

    playAnnouncement(onComplete) {
        if (!this.announcementAudio) {
            this.announcementAudio = new Audio('assets/sounds/Announcement.mp3');
            this.announcementAudio.preload = 'auto';
        }
        this.announcementAudio.pause();
        this.announcementAudio.currentTime = 0;
        this.announcementAudio.volume = this.targetVolume;
        if (onComplete) {
            const handleEnd = () => {
                this.announcementAudio.removeEventListener('ended', handleEnd);
                onComplete();
            };
            this.announcementAudio.addEventListener('ended', handleEnd);
        }
        const playPromise = this.announcementAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.hasInteracted = true;
            }).catch(() => {
                if (this.transitionPhase === 'announcing') {
                    this.handleAnnouncementEnded();
                }
            });
        }
    },

    getTargetTrackInfo(now) {
        if (this.activeLayout !== 'traanstock' && this.activeLayout !== 'worldevents' && this.activeLayout !== 'dateseasons') {
            return null;
        }

        if (this.activeLayout === 'dateseasons') {
            const dateSeasonsFetcher = (window.DateSeasonsPage && typeof window.DateSeasonsPage.getAudioTrackInfo === 'function')
                ? window.DateSeasonsPage.getAudioTrackInfo(now)
                : null;
            if (dateSeasonsFetcher) {
                return {
                    src: dateSeasonsFetcher.src,
                    duration: dateSeasonsFetcher.duration,
                    targetTime: 0,
                    eventName: dateSeasonsFetcher.eventName,
                    variant: 1
                };
            }
            return null;
        }

        if (this.activeLayout === 'traanstock') {
            const traanFetcher = window.getTraanStockAtTimestamp || getTraanStockAtTimestamp;
            const currentTraan = typeof traanFetcher === 'function' ? traanFetcher(now) : null;
            const startTime = currentTraan ? currentTraan.startTime : now;
            const elapsedSeconds = Math.max(0, (now - startTime) / 1000);
            const topicTrack = (window.TraanStockLayout && typeof window.TraanStockLayout.getAudioTrackInfo === 'function')
                ? window.TraanStockLayout.getAudioTrackInfo()
                : null;
            const meta = topicTrack || TRACK_METADATA['Traan'];
            const targetTime = elapsedSeconds % meta.duration;
            return {
                src: meta.src,
                duration: meta.duration,
                targetTime,
                eventName: meta.eventName || 'Traan',
                variant: 1
            };
        }

        const worldFetcher = window.getWorldEventAtTimestamp || getWorldEventAtTimestamp;
        const currentWorld = typeof worldFetcher === 'function' ? worldFetcher(now) : null;

        if (!currentWorld || !currentWorld.event) {
            return null;
        }

        const eventName = currentWorld.event.name;
        const meta = TRACK_METADATA[eventName];
        if (!meta) {
            return null;
        }

        const elapsedSeconds = Math.max(0, (now - currentWorld.startTime) / 1000);

        if (meta.type === 'single') {
            const targetTime = elapsedSeconds % meta.duration;
            return {
                src: meta.src,
                duration: meta.duration,
                targetTime,
                eventName,
                variant: 1
            };
        }

        const halfDurationSeconds = 15 * 60;
        if (elapsedSeconds < halfDurationSeconds) {
            const targetTime = elapsedSeconds % meta.variant1.duration;
            return {
                src: meta.variant1.src,
                duration: meta.variant1.duration,
                targetTime,
                eventName,
                variant: 1
            };
        } else {
            const elapsedSecondHalf = elapsedSeconds - halfDurationSeconds;
            const targetTime = elapsedSecondHalf % meta.variant2.duration;
            return {
                src: meta.variant2.src,
                duration: meta.variant2.duration,
                targetTime,
                eventName,
                variant: 2
            };
        }
    },

    sync(now, forcePlay = false) {
        if (this.activeLayout === 'worldevents') {
            const worldFetcher = window.getWorldEventAtTimestamp || getWorldEventAtTimestamp;
            const currentWorld = typeof worldFetcher === 'function' ? worldFetcher(now) : null;

            if (currentWorld) {
                if (this.lastWorldSlotIndex === null) {
                    this.lastWorldSlotIndex = currentWorld.slotIndex;
                }

                const isRemind = typeof window.isRemindWEEnabled === 'function'
                    ? window.isRemindWEEnabled()
                    : (localStorage.getItem('user_remind_we') === 'true');

                const timeLeft = (currentWorld.endTime - now) / 1000;

                if (currentWorld.slotIndex !== this.lastWorldSlotIndex) {
                    this.lastWorldSlotIndex = currentWorld.slotIndex;
                    this.fadedOutSlotIndex = null;

                    if (isRemind) {
                        this.transitionPhase = 'announcing';
                        if (this.audio) {
                            if (this.audio._fadeInterval) {
                                clearInterval(this.audio._fadeInterval);
                                this.audio._fadeInterval = null;
                            }
                            this.audio.pause();
                            this.audio.volume = 0;
                        }
                        this.playAnnouncement();
                        return;
                    } else {
                        this.transitionPhase = 'normal';
                    }
                } else if (isRemind) {
                    if (timeLeft <= 5.0 && timeLeft > 0) {
                        if (this.fadedOutSlotIndex !== currentWorld.slotIndex) {
                            this.fadedOutSlotIndex = currentWorld.slotIndex;
                            this.transitionPhase = 'fading_out';
                            fadeAudio(this.audio, 0, 3500, () => {
                                if (this.audio) {
                                    this.audio.pause();
                                }
                            });
                        }
                        return;
                    }
                } else {
                    if (this.transitionPhase === 'fading_out') {
                        this.transitionPhase = 'normal';
                    }
                }
            }
        }

        if (this.transitionPhase === 'announcing') {
            return;
        }

        const info = this.getTargetTrackInfo(now);
        if (!info) {
            return;
        }

        const audio = this.audio;
        if (!audio) {
            return;
        }

        const trackChanged = this.currentTrackSrc !== info.src;

        if (trackChanged) {
            this.currentTrackSrc = info.src;
            audio.src = info.src;
            audio.loop = true;
            audio.volume = 0;
            this._syncGen++;
            const gen = this._syncGen;

            const onCanPlay = () => {
                audio.removeEventListener('canplay', onCanPlay);
                if (this._syncGen !== gen || this.currentTrackSrc !== info.src) {
                    return;
                }
                const dur = audio.duration || info.duration;
                try {
                    audio.currentTime = info.targetTime % dur;
                } catch (e) { }
                if (!this.isMuted && this.transitionPhase === 'normal') {
                    audio.play().then(() => {
                        if (this._syncGen !== gen || this.currentTrackSrc !== info.src) {
                            audio.pause();
                            audio.volume = 0;
                            return;
                        }
                        this.hasInteracted = true;
                        fadeAudio(audio, this.targetVolume, 1500);
                    }).catch(() => { });
                }
            };

            if (audio.readyState >= 2) {
                onCanPlay();
            } else {
                audio.addEventListener('canplay', onCanPlay, { once: true });
                audio.load();
            }
        } else {
            if (!this.isMuted && audio.paused && !audio._isStarting && this.transitionPhase === 'normal') {
                audio._isStarting = true;
                audio.play().then(() => {
                    audio._isStarting = false;
                    this.hasInteracted = true;
                    fadeAudio(audio, this.targetVolume, 1500);
                }).catch(() => {
                    audio._isStarting = false;
                });
            } else if (!this.isMuted && !audio.paused && this.transitionPhase === 'normal') {
                if (Math.abs(audio.volume - this.targetVolume) > 0.05 && !audio._fadeInterval) {
                    fadeAudio(audio, this.targetVolume, 1000);
                }
            }
        }
    }
};

window.MusicPlayer = MusicPlayer;