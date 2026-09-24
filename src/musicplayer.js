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

const MusicPlayer = {
    worldAudio: null,
    traanAudio: null,
    announcementAudio: null,
    currentTrackSrc: '',
    isMuted: localStorage.getItem('user_soundtrack_muted') === 'true',
    activeLayout: (typeof window !== 'undefined' && window.location && window.location.pathname && window.location.pathname.toLowerCase().includes('/traan-zakshun')) ? 'traanstock' : ((typeof window !== 'undefined' && window.location && window.location.pathname && window.location.pathname.toLowerCase().includes('/date-seasons')) ? 'dateseasons' : 'worldevents'),
    hasInteracted: false,
    transitionPhase: 'normal',
    lastWorldSlotIndex: null,
    fadedOutSlotIndex: null,
    targetVolume: 1.0,

    init() {
        this.worldAudio = new Audio();
        this.worldAudio.preload = 'auto';
        this.worldAudio.loop = true;
        this.worldAudio.volume = 0;

        this.traanAudio = new Audio();
        this.traanAudio.preload = 'auto';
        this.traanAudio.loop = true;
        this.traanAudio.volume = 0;

        this.announcementAudio = new Audio('assets/sounds/Announcement.mp3');
        this.announcementAudio.preload = 'auto';
        this.announcementAudio.volume = 1.0;

        this.announcementAudio.addEventListener('ended', () => {
            this.handleAnnouncementEnded();
        });

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

            if (!this.isMuted) {
                const inactiveAudio = this.getInactiveAudio();
                if (inactiveAudio) {
                    inactiveAudio.pause();
                    inactiveAudio.volume = 0;
                }
                const audio = this.getActiveAudio();
                if (audio) {
                    const now = typeof getAppTime === 'function' ? getAppTime() : Date.now();
                    const info = this.getTargetTrackInfo(now);
                    if (info) {
                        const dur = audio.duration || info.duration;
                        try {
                            if (Math.abs(audio.currentTime - (info.targetTime % dur)) > 2) {
                                audio.currentTime = info.targetTime % dur;
                            }
                        } catch (e) { }
                    }
                    if (audio.paused || audio.volume < 0.05) {
                        audio.play().then(() => {
                            if (this.getActiveAudio() !== audio) {
                                audio.pause();
                                audio.volume = 0;
                                return;
                            }
                            fadeAudio(audio, this.targetVolume, 1500);
                        }).catch(() => { });
                    }
                }
            }
        };

        window.addEventListener('pointerdown', unlock, { capture: true });
        window.addEventListener('click', unlock, { capture: true });
        window.addEventListener('keydown', unlock, { capture: true });
        window.addEventListener('touchstart', unlock, { capture: true, passive: true });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !this.isMuted) {
                const inactiveAudio = this.getInactiveAudio();
                if (inactiveAudio) {
                    inactiveAudio.pause();
                    inactiveAudio.volume = 0;
                }
                const now = typeof getAppTime === 'function' ? getAppTime() : Date.now();
                const audio = this.getActiveAudio();
                if (audio && this.transitionPhase === 'normal') {
                    const info = this.getTargetTrackInfo(now);
                    if (info) {
                        const dur = audio.duration || info.duration;
                        const rawDiff = Math.abs(audio.currentTime - info.targetTime);
                        const circularDiff = Math.min(rawDiff, dur - rawDiff);
                        if (circularDiff > 4) {
                            try {
                                audio.currentTime = info.targetTime % dur;
                            } catch (e) { }
                        }
                        if (audio.paused && !this.isMuted) {
                            audio.play().then(() => {
                                if (this.getActiveAudio() !== audio) {
                                    audio.pause();
                                    audio.volume = 0;
                                    return;
                                }
                                this.hasInteracted = true;
                                fadeAudio(audio, this.targetVolume, 1500);
                            }).catch(() => { });
                        }
                    }
                }
            }
        });

        this.sync(initialNow, false);

        if (!this.isMuted) {
            const activeAudio = this.getActiveAudio();
            if (activeAudio) {
                const playPromise = activeAudio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        if (this.getActiveAudio() !== activeAudio) {
                            activeAudio.pause();
                            activeAudio.volume = 0;
                            return;
                        }
                        this.hasInteracted = true;
                        fadeAudio(activeAudio, this.targetVolume, 1500);
                    }).catch(() => { });
                }
            }
        }
    },

    getActiveAudio() {
        if (this.activeLayout === 'traanstock') {
            return this.traanAudio;
        }
        if (this.activeLayout === 'worldevents') {
            return this.worldAudio;
        }
        return null;
    },

    getInactiveAudio() {
        if (this.activeLayout === 'traanstock') {
            return this.worldAudio;
        }
        if (this.activeLayout === 'worldevents') {
            return this.traanAudio;
        }
        return null;
    },

    handleAnnouncementEnded() {
        if (this.transitionPhase === 'announcing') {
            this.transitionPhase = 'normal';
            if (this.activeLayout === 'worldevents' && !this.isMuted) {
                const now = typeof getAppTime === 'function' ? getAppTime() : Date.now();
                const info = this.getTargetTrackInfo(now);
                if (info && this.worldAudio) {
                    const trackChanged = this.currentTrackSrc !== info.src;
                    this.currentTrackSrc = info.src;
                    if (trackChanged || !this.worldAudio.src || !this.worldAudio.src.includes(info.src)) {
                        this.worldAudio.src = info.src;
                        this.worldAudio.loop = true;
                    }
                    const seekAndPlay = () => {
                        if (this.getActiveAudio() !== this.worldAudio) {
                            this.worldAudio.pause();
                            this.worldAudio.volume = 0;
                            return;
                        }
                        const dur = this.worldAudio.duration || info.duration;
                        try {
                            this.worldAudio.currentTime = info.targetTime % dur;
                        } catch (e) { }
                        if (!this.isMuted) {
                            this.worldAudio.play().then(() => {
                                if (this.getActiveAudio() !== this.worldAudio) {
                                    this.worldAudio.pause();
                                    this.worldAudio.volume = 0;
                                    return;
                                }
                                this.hasInteracted = true;
                                fadeAudio(this.worldAudio, this.targetVolume, 2000);
                            }).catch(() => { });
                        }
                    };
                    if (this.worldAudio.readyState >= 2) {
                        seekAndPlay();
                    } else {
                        this.worldAudio.addEventListener('canplay', seekAndPlay, { once: true });
                        if (trackChanged) {
                            this.worldAudio.load();
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

            if (layout === 'traanstock') {
                if (this.worldAudio) {
                    fadeAudio(this.worldAudio, 0, 800, () => {
                        if (this.worldAudio && this.getActiveAudio() !== this.worldAudio) {
                            this.worldAudio.pause();
                            this.worldAudio.volume = 0;
                        }
                    });
                }
            } else if (layout === 'worldevents') {
                if (this.traanAudio) {
                    fadeAudio(this.traanAudio, 0, 800, () => {
                        if (this.traanAudio && this.getActiveAudio() !== this.traanAudio) {
                            this.traanAudio.pause();
                            this.traanAudio.volume = 0;
                        }
                    });
                }
            } else {
                if (this.worldAudio) {
                    fadeAudio(this.worldAudio, 0, 800, () => {
                        this.worldAudio.pause();
                        this.worldAudio.volume = 0;
                    });
                }
                if (this.traanAudio) {
                    fadeAudio(this.traanAudio, 0, 800, () => {
                        this.traanAudio.pause();
                        this.traanAudio.volume = 0;
                    });
                }
            }

            const now = typeof getAppTime === 'function' ? getAppTime() : Date.now();
            this.sync(now);
        }
    },

    setMuted(muted) {
        this.isMuted = muted;
        if (this.isMuted) {
            fadeAudio(this.worldAudio, 0, 1000, () => {
                if (this.worldAudio) {
                    this.worldAudio.pause();
                }
            });
            fadeAudio(this.traanAudio, 0, 1000, () => {
                if (this.traanAudio) {
                    this.traanAudio.pause();
                }
            });
        } else {
            const now = typeof getAppTime === 'function' ? getAppTime() : Date.now();
            const audio = this.getActiveAudio();
            const info = this.getTargetTrackInfo(now);
            if (audio && info) {
                const dur = audio.duration || info.duration;
                try {
                    audio.currentTime = info.targetTime % dur;
                } catch (e) { }
                audio.play().then(() => {
                    this.hasInteracted = true;
                    fadeAudio(audio, this.targetVolume, 1500);
                }).catch(() => { });
            }
        }
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
        this.announcementAudio.volume = 1.0;
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
        if (this.activeLayout !== 'traanstock' && this.activeLayout !== 'worldevents') {
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
        const inactiveAudio = this.getInactiveAudio();
        if (inactiveAudio && !inactiveAudio.paused && !inactiveAudio._fadeInterval) {
            inactiveAudio.pause();
            inactiveAudio.volume = 0;
        }

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
                        if (this.worldAudio) {
                            this.worldAudio.pause();
                            this.worldAudio.volume = 0;
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
                            fadeAudio(this.worldAudio, 0, 3500, () => {
                                if (this.worldAudio) {
                                    this.worldAudio.pause();
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

        const audio = this.getActiveAudio();
        if (!audio) {
            return;
        }

        const trackChanged = this.currentTrackSrc !== info.src;

        if (trackChanged) {
            this.currentTrackSrc = info.src;
            audio.src = info.src;
            audio.loop = true;
            audio.volume = 0;

            const onCanPlay = () => {
                audio.removeEventListener('canplay', onCanPlay);
                if (this.getActiveAudio() !== audio) {
                    audio.pause();
                    audio.volume = 0;
                    return;
                }
                const dur = audio.duration || info.duration;
                try {
                    audio.currentTime = info.targetTime % dur;
                } catch (e) { }
                if (!this.isMuted && this.transitionPhase === 'normal') {
                    audio.play().then(() => {
                        if (this.getActiveAudio() !== audio) {
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
            if (this.getActiveAudio() !== audio) {
                audio.pause();
                audio.volume = 0;
                return;
            }
            if (!this.isMuted && audio.paused && !audio._isStarting && this.transitionPhase === 'normal') {
                audio._isStarting = true;
                const dur = audio.duration || info.duration;
                try {
                    if (audio.currentTime === 0) {
                        audio.currentTime = info.targetTime % dur;
                    }
                } catch (e) { }
                audio.play().then(() => {
                    audio._isStarting = false;
                    if (this.getActiveAudio() !== audio) {
                        audio.pause();
                        audio.volume = 0;
                        return;
                    }
                    this.hasInteracted = true;
                    fadeAudio(audio, this.targetVolume, 1500);
                }).catch(() => {
                    audio._isStarting = false;
                });
            } else if (!this.isMuted && !audio.paused && this.transitionPhase === 'normal') {
                if (audio.volume < this.targetVolume && !audio._fadeInterval) {
                    fadeAudio(audio, this.targetVolume, 1000);
                }
            }
        }
    }
};

window.MusicPlayer = MusicPlayer;