const burgerMenuBtn = document.getElementById('burger-menu-btn');
const sideMenuDropdown = document.getElementById('side-menu-dropdown');
const menuGroupWorldEvents = document.getElementById('menu-group-worldevents');
const menuGroupTraan = document.getElementById('menu-group-traan');

const menuItemRemindWe = document.getElementById('menu-item-remind-we');
const menuRemindWeStatus = document.getElementById('menu-remind-we-status');
const menuItemRemindTraan = document.getElementById('menu-item-remind-traan');
const menuRemindTraanStatus = document.getElementById('menu-remind-traan-status');
const soundtrackButtons = document.querySelectorAll('.menu-item-soundtrack');
const soundtrackStatuses = document.querySelectorAll('.menu-soundtrack-status');

const layoutSwitchBtn = document.getElementById('layout-switch-btn');
const layoutSwitchLabel = document.getElementById('layout-switch-label');
const testEventBtn = document.getElementById('test-event-btn');
const cursorHoverBox = document.getElementById('cursor-hover-box');
let currentHoverTarget = null;
let testTimeOffsetMs = 0;

function getAppTime() {
	return Date.now() + testTimeOffsetMs;
}

window.getAppTime = getAppTime;

let isRemindWE = localStorage.getItem('user_remind_we') === 'true';
window.isRemindWEEnabled = () => isRemindWE;
let isRemindTraan = localStorage.getItem('user_remind_traan') === 'true';
let isSoundtrackMuted = localStorage.getItem('user_soundtrack_muted') === 'true';

const announcementAudio = new Audio('assets/sounds/Announcement.mp3');
announcementAudio.preload = 'auto';

let lastWorldSlotIndex = null;
let lastDisasterSlotIndex = null;
let lastTraanSlotIndex = null;

const redirectPath = sessionStorage.getItem('redirect_path');
if (redirectPath) {
	sessionStorage.removeItem('redirect_path');
	if (window.location.pathname !== redirectPath) {
		window.history.replaceState(null, '', redirectPath);
	}
}

function getBasePath() {
	const clean = window.location.pathname.replace(/\/(world-events|traan-zakshun)\/?$/, '');
	return clean.endsWith('/') ? clean.slice(0, -1) : clean;
}

function getInitialLayout() {
	const path = window.location.pathname.toLowerCase();
	if (path.includes('/traan-zakshun')) {
		return 'traanstock';
	}
	return 'worldevents';
}

function updateLayoutUrl(layout, replace = false) {
	const basePath = getBasePath();
	const targetSegment = layout === 'traanstock' ? '/traan-zakshun/' : '/world-events/';
	const targetPath = `${basePath}${targetSegment}`;
	if (window.location.pathname !== targetPath) {
		if (replace) {
			window.history.replaceState({ layout }, '', targetPath);
		} else {
			window.history.pushState({ layout }, '', targetPath);
		}
	}
}

let currentLayout = getInitialLayout();

function updateReminderUI() {
	if (menuRemindWeStatus) {
		menuRemindWeStatus.textContent = isRemindWE ? 'On' : 'Off';
		menuRemindWeStatus.classList.toggle('status-active', isRemindWE);
	}
	if (menuRemindTraanStatus) {
		menuRemindTraanStatus.textContent = isRemindTraan ? 'On' : 'Off';
		menuRemindTraanStatus.classList.toggle('status-active', isRemindTraan);
	}
}

function updateSoundtrackUI() {
	soundtrackStatuses.forEach((statusEl) => {
		statusEl.textContent = isSoundtrackMuted ? 'Muted' : 'Unmuted';
		statusEl.classList.toggle('status-muted', isSoundtrackMuted);
		statusEl.classList.toggle('status-active', !isSoundtrackMuted);
	});
}

function showDesktopNotification(title, body, icon) {
	if (!('Notification' in window)) {
		return;
	}
	if (Notification.permission === 'granted') {
		try {
			new Notification(title, {
				body: body,
				icon: icon || 'assets/images/BattleRoyale.webp'
			});
		} catch (e) { }
	}
}

function requestNotificationPermission() {
	if ('Notification' in window && Notification.permission === 'default') {
		Notification.requestPermission();
	}
}

function playAnnouncementSound() {
	if (window.MusicPlayer) {
		window.MusicPlayer.playAnnouncement();
	} else {
		announcementAudio.currentTime = 0;
		announcementAudio.play().catch(() => { });
	}
}

function checkEventTransitions(currentWorld, currentDisaster, currentTraan) {
	let shouldPlayTraanSound = false;
	let weNotification = null;
	let traanNotification = null;

	if (lastWorldSlotIndex !== null && currentWorld && currentWorld.slotIndex !== lastWorldSlotIndex) {
		weNotification = {
			title: 'World Event: ' + currentWorld.event.name,
			body: currentWorld.event.name + ' has started!',
			icon: currentWorld.event.bgImage
		};
	}

	if (lastDisasterSlotIndex !== null && currentDisaster && currentDisaster.slotIndex !== lastDisasterSlotIndex) {
		if (!weNotification) {
			weNotification = {
				title: 'Disaster: ' + currentDisaster.disaster.name,
				body: currentDisaster.disaster.name + ' has started!',
				icon: currentDisaster.disaster.bgImage
			};
		}
	}

	if (lastTraanSlotIndex !== null && currentTraan && currentTraan.slotIndex !== lastTraanSlotIndex) {
		shouldPlayTraanSound = true;
		traanNotification = {
			title: "Traan Zakshun's Rotation",
			body: "Traan Zakshun's stock has updated!",
			icon: 'assets/images/Traan.webp'
		};
	}

	if (currentWorld) {
		lastWorldSlotIndex = currentWorld.slotIndex;
	}
	if (currentDisaster) {
		lastDisasterSlotIndex = currentDisaster.slotIndex;
	}
	if (currentTraan) {
		lastTraanSlotIndex = currentTraan.slotIndex;
	}

	if (isRemindWE && weNotification) {
		showDesktopNotification(weNotification.title, weNotification.body, weNotification.icon);
	}

	if (isRemindTraan && shouldPlayTraanSound) {
		playAnnouncementSound();
		if (traanNotification) {
			showDesktopNotification(traanNotification.title, traanNotification.body, traanNotification.icon);
		}
	}
}

function updateLayoutSwitchUI() {
	if (layoutSwitchLabel) {
		if (currentLayout === 'worldevents') {
			layoutSwitchLabel.textContent = "Switch to Traan Zakshun's Rotation";
		} else {
			layoutSwitchLabel.textContent = 'Switch to World Events';
		}
	}
	if (layoutSwitchBtn) {
		const hoverText = currentLayout === 'worldevents'
			? "Switch to Traan's Hourly Market and Black Market Rotation, Info is fetched from the Deepwoken Info Discord Server."
			: "Switch to World Events, Updates every half hour / Every Hour for Etrean Disasters";
		layoutSwitchBtn.setAttribute('data-hover-text', hoverText);
		if (currentHoverTarget === layoutSwitchBtn && cursorHoverBox) {
			cursorHoverBox.textContent = hoverText;
		}
	}
}

function updateMenuGroupVisibility() {
	if (menuGroupWorldEvents) {
		menuGroupWorldEvents.classList.toggle('layout-hidden', currentLayout !== 'worldevents');
	}
	if (menuGroupTraan) {
		menuGroupTraan.classList.toggle('layout-hidden', currentLayout !== 'traanstock');
	}
}

let layoutTransitionTimeout = null;
let layoutFadeInTimeout = null;

function applyLayout(targetLayout, updateHistory = 'push') {
	currentLayout = targetLayout;
	localStorage.setItem('user_active_layout', currentLayout);

	if (targetLayout === 'worldevents') {
		if (window.TraanStockLayout) {
			window.TraanStockLayout.unmount();
		}
		if (window.WorldEventsLayout) {
			window.WorldEventsLayout.mount();
		}
	} else if (targetLayout === 'traanstock') {
		if (window.WorldEventsLayout) {
			window.WorldEventsLayout.unmount();
		}
		if (window.TraanStockLayout) {
			window.TraanStockLayout.mount();
		}
	}

	if (window.MusicPlayer) {
		window.MusicPlayer.setLayout(currentLayout);
	}

	updateLayoutSwitchUI();
	updateMenuGroupVisibility();

	if (updateHistory === 'push') {
		updateLayoutUrl(currentLayout, false);
	} else if (updateHistory === 'replace') {
		updateLayoutUrl(currentLayout, true);
	}
}

function switchLayout(targetLayout, isInitial = false, updateHistory = 'push') {
	const curtain = document.getElementById('bg-black-curtain');
	if (isInitial || !curtain || currentLayout === targetLayout) {
		applyLayout(targetLayout, isInitial ? 'replace' : updateHistory);
		if (curtain) {
			curtain.classList.remove('fade-black');
		}
		return;
	}

	clearTimeout(layoutTransitionTimeout);
	clearTimeout(layoutFadeInTimeout);

	curtain.classList.add('fade-black');

	layoutTransitionTimeout = setTimeout(() => {
		applyLayout(targetLayout, updateHistory);

		layoutFadeInTimeout = setTimeout(() => {
			curtain.classList.remove('fade-black');
		}, 50);
	}, 600);
}

window.addEventListener('popstate', (e) => {
	const targetLayout = (e.state && e.state.layout) || getInitialLayout();
	if (targetLayout !== currentLayout) {
		switchLayout(targetLayout, false, 'none');
	}
});

function toggleBurgerMenu() {
	if (!sideMenuDropdown || !burgerMenuBtn) {
		return;
	}
	const isCurrentlyHidden = sideMenuDropdown.classList.contains('layout-hidden');
	sideMenuDropdown.classList.toggle('layout-hidden', !isCurrentlyHidden);
	burgerMenuBtn.setAttribute('aria-expanded', String(isCurrentlyHidden));
	if (!isCurrentlyHidden && cursorHoverBox && currentHoverTarget && currentHoverTarget.closest('#side-menu-dropdown')) {
		cursorHoverBox.classList.remove('visible');
		currentHoverTarget = null;
	}
}

function closeBurgerMenu() {
	if (!sideMenuDropdown || !burgerMenuBtn) {
		return;
	}
	sideMenuDropdown.classList.add('layout-hidden');
	burgerMenuBtn.setAttribute('aria-expanded', 'false');
	if (cursorHoverBox && currentHoverTarget && currentHoverTarget.closest('#side-menu-dropdown')) {
		cursorHoverBox.classList.remove('visible');
		currentHoverTarget = null;
	}
}

function render() {
	const now = getAppTime();
	let worldResult = null;
	let traanResult = null;

	if (window.WorldEventsLayout) {
		worldResult = window.WorldEventsLayout.render(now);
	}

	if (window.TraanStockLayout) {
		traanResult = window.TraanStockLayout.render(now);
	}

	const currentWorld = worldResult ? worldResult.currentWorld : null;
	const currentDisaster = worldResult ? worldResult.currentDisaster : null;
	checkEventTransitions(currentWorld, currentDisaster, traanResult);

	if (window.MusicPlayer) {
		window.MusicPlayer.sync(now);
	}
}

if (burgerMenuBtn) {
	burgerMenuBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		toggleBurgerMenu();
	});
}

document.addEventListener('click', (e) => {
	if (sideMenuDropdown && !sideMenuDropdown.contains(e.target) && e.target !== burgerMenuBtn && !burgerMenuBtn.contains(e.target)) {
		closeBurgerMenu();
	}
});

document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		closeBurgerMenu();
	}
});

if (menuItemRemindWe) {
	menuItemRemindWe.addEventListener('click', () => {
		isRemindWE = !isRemindWE;
		localStorage.setItem('user_remind_we', String(isRemindWE));
		if (isRemindWE) {
			requestNotificationPermission();
		}
		updateReminderUI();
	});
}

if (menuItemRemindTraan) {
	menuItemRemindTraan.addEventListener('click', () => {
		isRemindTraan = !isRemindTraan;
		localStorage.setItem('user_remind_traan', String(isRemindTraan));
		if (isRemindTraan) {
			requestNotificationPermission();
		}
		updateReminderUI();
	});
}

soundtrackButtons.forEach((btn) => {
	btn.addEventListener('click', () => {
		isSoundtrackMuted = !isSoundtrackMuted;
		localStorage.setItem('user_soundtrack_muted', String(isSoundtrackMuted));
		updateSoundtrackUI();
		if (window.MusicPlayer) {
			window.MusicPlayer.setMuted(isSoundtrackMuted);
		}
	});
});

if (layoutSwitchBtn) {
	layoutSwitchBtn.addEventListener('click', () => {
		const nextLayout = currentLayout === 'worldevents' ? 'traanstock' : 'worldevents';
		switchLayout(nextLayout);
	});
}

const isLocalhost = window.location.hostname === 'localhost' ||
	window.location.hostname === '127.0.0.1' ||
	window.location.hostname === '';

if (testEventBtn) {
	if (isLocalhost) {
		testEventBtn.classList.remove('layout-hidden');
	} else {
		testEventBtn.classList.add('layout-hidden');
	}

	testEventBtn.addEventListener('click', () => {
		const now = getAppTime();
		const currentWorld = getWorldEventAtTimestamp(now);
		const targetNextEventTime = now + 20000;
		testTimeOffsetMs += (currentWorld.endTime - targetNextEventTime);
		const updatedNow = getAppTime();
		const updatedWorld = getWorldEventAtTimestamp(updatedNow);
		lastWorldSlotIndex = updatedWorld.slotIndex;
		if (window.MusicPlayer) {
			window.MusicPlayer.resetTransition();
			window.MusicPlayer.lastWorldSlotIndex = updatedWorld.slotIndex;
			window.MusicPlayer.sync(updatedNow, true);
		}
		render();
	});
}

function updateCursorHover(e) {
	if (!cursorHoverBox) {
		return;
	}
	const target = e.target.closest('[data-hover-text]');
	if (!target) {
		if (currentHoverTarget) {
			currentHoverTarget = null;
			cursorHoverBox.classList.remove('visible');
		}
		return;
	}

	const menuDropdownParent = target.closest('#side-menu-dropdown');
	if (menuDropdownParent && menuDropdownParent.classList.contains('layout-hidden')) {
		if (currentHoverTarget) {
			currentHoverTarget = null;
			cursorHoverBox.classList.remove('visible');
		}
		return;
	}

	const text = target.getAttribute('data-hover-text');
	if (!text) {
		if (currentHoverTarget) {
			currentHoverTarget = null;
			cursorHoverBox.classList.remove('visible');
		}
		return;
	}

	if (currentHoverTarget !== target || cursorHoverBox.textContent !== text) {
		currentHoverTarget = target;
		cursorHoverBox.textContent = text;
	}

	cursorHoverBox.classList.add('visible');

	const offset = 14;
	let x = e.clientX + offset;
	let y = e.clientY + offset;

	const boxWidth = cursorHoverBox.offsetWidth || 220;
	const boxHeight = cursorHoverBox.offsetHeight || 36;

	if (x + boxWidth > window.innerWidth - 10) {
		x = e.clientX - boxWidth - offset;
	}
	if (y + boxHeight > window.innerHeight - 10) {
		y = e.clientY - boxHeight - offset;
	}

	cursorHoverBox.style.left = `${Math.max(6, x)}px`;
	cursorHoverBox.style.top = `${Math.max(6, y)}px`;
}

function hideCursorHover() {
	if (cursorHoverBox) {
		cursorHoverBox.classList.remove('visible');
		currentHoverTarget = null;
	}
}

document.addEventListener('mousemove', updateCursorHover);
document.addEventListener('mouseleave', hideCursorHover);
window.addEventListener('blur', hideCursorHover);
document.addEventListener('touchstart', hideCursorHover, { passive: true });

const unlockAudio = () => {
	if (window.MusicPlayer && window.MusicPlayer.announcementAudio) {
		window.MusicPlayer.announcementAudio.load();
	}
	announcementAudio.load();
	window.removeEventListener('pointerdown', unlockAudio, { capture: true });
	window.removeEventListener('click', unlockAudio, { capture: true });
	window.removeEventListener('keydown', unlockAudio, { capture: true });
	window.removeEventListener('touchstart', unlockAudio, { capture: true });
};
window.addEventListener('pointerdown', unlockAudio, { capture: true, once: true });
window.addEventListener('click', unlockAudio, { capture: true, once: true });
window.addEventListener('keydown', unlockAudio, { capture: true, once: true });
window.addEventListener('touchstart', unlockAudio, { capture: true, once: true, passive: true });

if (window.WorldEventsLayout) {
	window.WorldEventsLayout.init();
}
if (window.TraanStockLayout) {
	window.TraanStockLayout.init();
}
if (window.MusicPlayer) {
	window.MusicPlayer.init();
}

switchLayout(currentLayout, true);
updateReminderUI();
updateSoundtrackUI();
render();
setInterval(render, 500);
