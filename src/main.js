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

const WORLD_ANCHOR_TIMESTAMP = Date.UTC(2026, 8, 20, 22, 30, 0);
const DISASTER_ANCHOR_TIMESTAMP = Date.UTC(2026, 8, 20, 22, 0, 0);

const WORLD_INTERVAL_MS = 30 * 60 * 1000;
const DISASTER_INTERVAL_MS = 60 * 60 * 1000;
const JOIN_WINDOW_MS = 5 * 60 * 1000;

const bgBackdrop = document.getElementById('bg-backdrop');
const bgImageElement = document.getElementById('bg-image');
const bgImageDisasterElement = document.getElementById('bg-image-disaster');
const disastersToggleBtn = document.getElementById('disasters-toggle');
const disastersToggleLabel = document.getElementById('disasters-toggle-label');
const eventsGrid = document.getElementById('events-grid');
const disasterSection = document.getElementById('disaster-section');
const bottomTimersGrid = document.getElementById('bottom-timers-grid');
const disasterTimerColumn = document.getElementById('disaster-timer-column');
const disasterTimerBlock = document.getElementById('disaster-timer-block');

const pastEventNameElement = document.getElementById('past-event-name');
const nextEventNameElement = document.getElementById('next-event-name');
const currentEventNameElement = document.getElementById('current-event-name');
const joinStatusElement = document.getElementById('join-status');
const mainTimerElement = document.getElementById('main-timer');
const mainMobileTimerElement = document.getElementById('main-mobile-timer');

const pastDisasterNameElement = document.getElementById('past-disaster-name');
const nextDisasterNameElement = document.getElementById('next-disaster-name');
const currentDisasterNameElement = document.getElementById('current-disaster-name');
const disasterTimerElement = document.getElementById('disaster-timer');
const disasterMobileTimerElement = document.getElementById('disaster-mobile-timer');

const muteToggleBtn = document.getElementById('mute-toggle');
const muteToggleLabel = document.getElementById('mute-toggle-label');

let isMuted = localStorage.getItem('user_sound_muted') === 'true';
const announcementAudio = new Audio('assets/sounds/Announcement.mp3');
announcementAudio.preload = 'auto';

let lastWorldSlotIndex = null;
let lastDisasterSlotIndex = null;

let isDisastersVisible = localStorage.getItem('user_disasters_visible') !== 'false';
let currentActiveBg = '';
let currentActiveDisasterBg = '';

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

function updateDisastersVisibilityUI() {
	if (isDisastersVisible) {
		eventsGrid.classList.remove('single-column');
		if (bottomTimersGrid)
			bottomTimersGrid.classList.remove('single-column');

		if (disasterTimerColumn)
			disasterTimerColumn.classList.remove('timer-hidden');

		if (disasterTimerBlock)
			disasterTimerBlock.classList.remove('timer-hidden');

		if (bgBackdrop)
			bgBackdrop.classList.add('slashed');

		disasterTimerElement.classList.remove('timer-hidden');
		disastersToggleLabel.textContent = 'Hide Etrean Luminant Disasters';
	} else {
		eventsGrid.classList.add('single-column');
		if (bottomTimersGrid)
			bottomTimersGrid.classList.add('single-column');

		if (disasterTimerColumn)
			disasterTimerColumn.classList.add('timer-hidden');

		if (disasterTimerBlock)
			disasterTimerBlock.classList.add('timer-hidden');

		if (bgBackdrop)
			bgBackdrop.classList.remove('slashed');

		disasterTimerElement.classList.add('timer-hidden');
		disastersToggleLabel.textContent = 'Show Etrean Luminant Disasters';
	}
	disastersToggleBtn.setAttribute('aria-pressed', String(isDisastersVisible));
	disastersToggleBtn.classList.toggle('active', isDisastersVisible);
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

function renderWorldEvents(now) {
	const current = getWorldEventAtTimestamp(now);
	const previous = getWorldEventAtTimestamp(current.startTime - 1);
	const next = getWorldEventAtTimestamp(current.endTime + 1);

	if (currentActiveBg !== current.event.bgImage) {
		currentActiveBg = current.event.bgImage;
		bgImageElement.style.backgroundImage = `url("${current.event.bgImage}")`;
	}

	currentEventNameElement.textContent = current.event.name;
	currentEventNameElement.className = `current-event-title event-gradient-text ${current.event.gradientClass} ${current.event.textGlowClass}`;

	const elapsedSinceStart = now - current.startTime;
	const remainingJoinWindow = JOIN_WINDOW_MS - elapsedSinceStart;

	if (remainingJoinWindow > 0) {
		const formattedJoin = formatCountdown(remainingJoinWindow);
		joinStatusElement.innerHTML = `Time Left to join: <span class="status-active-value">${formattedJoin}</span>`;
	} else {
		joinStatusElement.innerHTML = `You can <span class="status-no-longer">no longer</span> join this event`;
	}

	if (pastEventNameElement) {
		applyPreviewStyling(pastEventNameElement, previous.event);
	}
	if (nextEventNameElement) {
		applyPreviewStyling(nextEventNameElement, next.event);
	}

	const timeUntilNext = current.endTime - now;
	if (mainTimerElement) {
		mainTimerElement.textContent = formatDurationLabel(timeUntilNext, 'World Event');
	}
	if (mainMobileTimerElement) {
		mainMobileTimerElement.innerHTML = `<span class="event-gradient-text ${next.event.gradientClass}">${next.event.name}</span>&nbsp;in ${formatDurationLabel(timeUntilNext)}`;
	}
	return current;
}

function renderDisasters(now) {
	const current = getDisasterAtTimestamp(now);
	const previous = getDisasterAtTimestamp(current.startTime - 1);
	const next = getDisasterAtTimestamp(current.endTime + 1);

	if (currentActiveDisasterBg !== current.disaster.bgImage) {
		currentActiveDisasterBg = current.disaster.bgImage;
		if (bgImageDisasterElement) {
			bgImageDisasterElement.style.backgroundImage = `url("${current.disaster.bgImage}")`;
		}
	}

	if (!isDisastersVisible) {
		return current;
	}

	currentDisasterNameElement.textContent = current.disaster.name;
	currentDisasterNameElement.className = `current-event-title event-gradient-text ${current.disaster.gradientClass} ${current.disaster.textGlowClass}`;

	if (pastDisasterNameElement) {
		applyPreviewStyling(pastDisasterNameElement, previous.disaster);
	}
	if (nextDisasterNameElement) {
		applyPreviewStyling(nextDisasterNameElement, next.disaster);
	}

	const timeUntilNext = current.endTime - now;
	if (disasterTimerElement) {
		disasterTimerElement.textContent = formatDurationLabel(timeUntilNext, 'Disaster');
	}
	if (disasterMobileTimerElement) {
		disasterMobileTimerElement.innerHTML = `<span class="event-gradient-text ${next.disaster.gradientClass}">${next.disaster.name}</span>&nbsp;in ${formatDurationLabel(timeUntilNext)}`;
	}
	return current;
}

function updateMuteUI() {
	if (isMuted) {
		muteToggleLabel.textContent = 'Unmute';
		muteToggleBtn.setAttribute('aria-pressed', 'true');
		muteToggleBtn.classList.add('active');
	} else {
		muteToggleLabel.textContent = 'Mute';
		muteToggleBtn.setAttribute('aria-pressed', 'false');
		muteToggleBtn.classList.remove('active');
	}
}

function playAnnouncementSound() {
	if (isMuted) {
		return;
	}
	announcementAudio.currentTime = 0;
	announcementAudio.play().catch(() => { });
}

function checkEventTransitions(currentWorld, currentDisaster) {
	let shouldPlaySound = false;

	if (lastWorldSlotIndex !== null && currentWorld && currentWorld.slotIndex !== lastWorldSlotIndex) {
		shouldPlaySound = true;
	}
	if (lastDisasterSlotIndex !== null && currentDisaster && currentDisaster.slotIndex !== lastDisasterSlotIndex) {
		shouldPlaySound = true;
	}

	if (currentWorld) {
		lastWorldSlotIndex = currentWorld.slotIndex;
	}
	if (currentDisaster) {
		lastDisasterSlotIndex = currentDisaster.slotIndex;
	}

	if (shouldPlaySound) {
		playAnnouncementSound();
	}
}

function render() {
	const now = Date.now();
	const currentWorld = renderWorldEvents(now);
	const currentDisaster = renderDisasters(now);
	checkEventTransitions(currentWorld, currentDisaster);
}

disastersToggleBtn.addEventListener('click', () => {
	isDisastersVisible = !isDisastersVisible;
	localStorage.setItem('user_disasters_visible', String(isDisastersVisible));
	updateDisastersVisibilityUI();
	render();
});

if (muteToggleBtn) {
	muteToggleBtn.addEventListener('click', () => {
		isMuted = !isMuted;
		localStorage.setItem('user_sound_muted', String(isMuted));
		if (isMuted) {
			announcementAudio.pause();
			announcementAudio.currentTime = 0;
		}
		updateMuteUI();
	});
}

const unlockAudio = () => {
	announcementAudio.load();
	document.removeEventListener('click', unlockAudio);
	document.removeEventListener('keydown', unlockAudio);
};
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('keydown', unlockAudio, { once: true });

updateDisastersVisibilityUI();
updateMuteUI();
render();
setInterval(render, 500);
