const burgerMenuBtn = document.getElementById('burger-menu-btn');
const sideMenuDropdown = document.getElementById('side-menu-dropdown');
const sideMenuSeparator = document.getElementById('side-menu-separator');
const menuGroupWorldEvents = document.getElementById('menu-group-worldevents');
const menuGroupTraan = document.getElementById('menu-group-traan');
const menuGroupDateSeasons = document.getElementById('menu-group-dateseasons');

const menuItemRemindWe = document.getElementById('menu-item-remind-we');
const menuRemindWeStatus = document.getElementById('menu-remind-we-status');
const menuItemAnimations = document.getElementById('menu-item-animations');
const menuAnimationsStatus = document.getElementById('menu-animations-status');
const menuVolumeSlider = document.getElementById('menu-volume-slider');

const eventTypeDropdown = document.getElementById('event-type-dropdown');
const eventTypeBtn = document.getElementById('event-type-btn');
const eventTypeLabel = document.getElementById('event-type-label');
const eventTypeMenu = document.getElementById('event-type-menu');
const eventTypeItems = document.querySelectorAll('.event-type-item');
const testEventBtn = document.getElementById('test-event-btn');
const cursorHoverBox = document.getElementById('cursor-hover-box');
let currentHoverTarget = null;
let testTimeOffsetMs = 0;

function getAppTime() {
	if (window.Clock) {
		return window.Clock.getTime();
	}
	return Date.now() + testTimeOffsetMs;
}

window.getAppTime = getAppTime;

let isRemindWE = localStorage.getItem('user_remind_we') === 'true';
window.isRemindWEEnabled = () => isRemindWE;
let isRemindTraan = localStorage.getItem('user_remind_traan') === 'true';
function getStoredSoundtrackVolume() {
	const saved = localStorage.getItem('user_soundtrack_volume');
	if (saved !== null && saved !== '') {
		const parsed = parseFloat(saved);
		if (!isNaN(parsed)) {
			const clamped = parsed > 1 ? parsed : parsed * 100;
			return Math.max(0, Math.min(100, Math.round(clamped)));
		}
	}
	return 50;
}

let soundtrackVolume = getStoredSoundtrackVolume();
let isAnimationsDisabled = localStorage.getItem('user_disable_animations') === 'true';
window.isAnimationsDisabled = () => isAnimationsDisabled;
if (isAnimationsDisabled) {
	document.body.classList.add('no-animations');
}

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
	const clean = window.location.pathname.replace(/\/(pages\/(world-events|traan-zakshun|date-seasons)|world-events|traan-zakshun|date-seasons)\/?$/, '');
	return clean.endsWith('/') ? clean.slice(0, -1) : clean;
}

function getInitialLayout() {
	const path = window.location.pathname.toLowerCase();
	if (path.includes('/traan-zakshun')) {
		return 'traanstock';
	}
	if (path.includes('/date-seasons')) {
		return 'dateseasons';
	}
	return 'worldevents';
}

function updateLayoutUrl(layout, replace = false) {
	const basePath = getBasePath();
	let targetSegment = '/world-events/';
	if (layout === 'traanstock') {
		targetSegment = '/traan-zakshun/';
	} else if (layout === 'dateseasons') {
		targetSegment = '/date-seasons/';
	}
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
}

function updateVolumeSliderUI(val) {
	if (!menuVolumeSlider) {
		return;
	}
	menuVolumeSlider.value = String(val);
	menuVolumeSlider.style.setProperty('--volume-percent', `${val}%`);
	menuVolumeSlider.setAttribute('data-hover-text', `Soundtrack Volume: ${val}%`);
	menuVolumeSlider.setAttribute('aria-valuenow', String(val));
	if (cursorHoverBox && currentHoverTarget === menuVolumeSlider) {
		cursorHoverBox.textContent = `Soundtrack Volume: ${val}%`;
	}
}

function setSoundtrackVolume(val) {
	soundtrackVolume = Math.max(0, Math.min(100, Math.round(val)));
	localStorage.setItem('user_soundtrack_volume', String(soundtrackVolume));
	updateVolumeSliderUI(soundtrackVolume);
	if (window.MusicPlayer) {
		window.MusicPlayer.setVolume(soundtrackVolume / 100);
	}
}

function updateAnimationsUI() {
	if (menuAnimationsStatus) {
		menuAnimationsStatus.textContent = isAnimationsDisabled ? 'On' : 'Off';
		menuAnimationsStatus.classList.toggle('status-active', isAnimationsDisabled);
	}
	document.body.classList.toggle('no-animations', isAnimationsDisabled);
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

function toggleEventTypeDropdown(open) {
	if (!eventTypeMenu || !eventTypeBtn) {
		return;
	}
	const isCurrentlyHidden = eventTypeMenu.classList.contains('layout-hidden');
	const shouldOpen = typeof open === 'boolean' ? open : isCurrentlyHidden;
	eventTypeMenu.classList.toggle('layout-hidden', !shouldOpen);
	eventTypeBtn.setAttribute('aria-expanded', String(shouldOpen));
	if (shouldOpen && cursorHoverBox && currentHoverTarget && currentHoverTarget.closest('#event-type-dropdown')) {
		cursorHoverBox.classList.remove('visible');
		currentHoverTarget = null;
	}
}

function closeEventTypeDropdown() {
	if (!eventTypeMenu || !eventTypeBtn) {
		return;
	}
	eventTypeMenu.classList.add('layout-hidden');
	eventTypeBtn.setAttribute('aria-expanded', 'false');
	if (cursorHoverBox && currentHoverTarget && currentHoverTarget.closest('#event-type-dropdown')) {
		cursorHoverBox.classList.remove('visible');
		currentHoverTarget = null;
	}
}

function updateEventTypeUI() {
	if (eventTypeLabel) {
		if (currentLayout === 'worldevents') {
			eventTypeLabel.textContent = 'World Events';
		} else if (currentLayout === 'traanstock') {
			eventTypeLabel.textContent = "Traan Zakshun's Market";
		} else if (currentLayout === 'dateseasons') {
			eventTypeLabel.textContent = 'Current Date and Season';
		} else {
			eventTypeLabel.textContent = 'Select Event Type';
		}
	}

	if (eventTypeItems) {
		eventTypeItems.forEach((item) => {
			const page = item.getAttribute('data-page');
			const isActive = page === currentLayout;
			item.classList.toggle('active', isActive);
			item.setAttribute('aria-selected', String(isActive));
		});
	}
}

function updateMenuGroupVisibility() {
	if (menuGroupWorldEvents) {
		menuGroupWorldEvents.classList.toggle('layout-hidden', currentLayout !== 'worldevents');
	}
	if (menuGroupTraan) {
		menuGroupTraan.classList.toggle('layout-hidden', currentLayout !== 'traanstock');
	}
	if (menuGroupDateSeasons) {
		menuGroupDateSeasons.classList.toggle('layout-hidden', currentLayout !== 'dateseasons');
	}
	if (sideMenuSeparator) {
		const hasPageSettings = (currentLayout === 'worldevents' && menuGroupWorldEvents && menuGroupWorldEvents.children.length > 0) ||
			(currentLayout === 'traanstock' && menuGroupTraan && menuGroupTraan.children.length > 0) ||
			(currentLayout === 'dateseasons' && menuGroupDateSeasons && menuGroupDateSeasons.children.length > 0);
		sideMenuSeparator.classList.toggle('layout-hidden', !hasPageSettings);
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
		if (window.DateSeasonsPage) {
			window.DateSeasonsPage.unmount();
		}
		if (window.WorldEventsLayout) {
			window.WorldEventsLayout.mount();
		}
	} else if (targetLayout === 'traanstock') {
		if (window.WorldEventsLayout) {
			window.WorldEventsLayout.unmount();
		}
		if (window.DateSeasonsPage) {
			window.DateSeasonsPage.unmount();
		}
		if (window.TraanStockLayout) {
			window.TraanStockLayout.mount();
		}
	} else if (targetLayout === 'dateseasons') {
		if (window.WorldEventsLayout) {
			window.WorldEventsLayout.unmount();
		}
		if (window.TraanStockLayout) {
			window.TraanStockLayout.unmount();
		}
		if (window.DateSeasonsPage) {
			window.DateSeasonsPage.mount();
		}
	}

	if (window.MusicPlayer) {
		window.MusicPlayer.setLayout(currentLayout);
	}

	updateEventTypeUI();
	updateMenuGroupVisibility();
	updateDebugButton();

	if (updateHistory === 'push') {
		updateLayoutUrl(currentLayout, false);
	} else if (updateHistory === 'replace') {
		updateLayoutUrl(currentLayout, true);
	}
}

function switchLayout(targetLayout, isInitial = false, updateHistory = 'push') {
	const curtain = document.getElementById('bg-black-curtain');
	if (isInitial || !curtain || currentLayout === targetLayout || isAnimationsDisabled) {
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

	if (window.DateSeasonsPage) {
		window.DateSeasonsPage.render(now);
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
	if (eventTypeMenu && !eventTypeMenu.contains(e.target) && e.target !== eventTypeBtn && !eventTypeBtn.contains(e.target)) {
		closeEventTypeDropdown();
	}
});

document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		closeBurgerMenu();
		closeEventTypeDropdown();
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

if (menuVolumeSlider) {
	updateVolumeSliderUI(soundtrackVolume);
	menuVolumeSlider.addEventListener('input', (e) => {
		setSoundtrackVolume(Number(e.target.value));
	});
	menuVolumeSlider.addEventListener('change', (e) => {
		setSoundtrackVolume(Number(e.target.value));
	});
}

if (menuItemAnimations) {
	menuItemAnimations.addEventListener('click', () => {
		isAnimationsDisabled = !isAnimationsDisabled;
		localStorage.setItem('user_disable_animations', String(isAnimationsDisabled));
		updateAnimationsUI();
	});
}

if (eventTypeBtn) {
	eventTypeBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		toggleEventTypeDropdown();
	});
}

if (eventTypeItems) {
	eventTypeItems.forEach((item) => {
		item.addEventListener('click', () => {
			const targetPage = item.getAttribute('data-page');
			if (targetPage && targetPage !== currentLayout) {
				switchLayout(targetPage);
			}
			closeEventTypeDropdown();
		});
	});
}

const isLocalhost = window.location.hostname === 'localhost' ||
	window.location.hostname === '127.0.0.1' ||
	window.location.hostname === '0.0.0.0' ||
	window.location.hostname.startsWith('192.168.') ||
	window.location.hostname.startsWith('10.') ||
	window.location.hostname === '';

function updateDebugButton() {
	if (!testEventBtn) {
		return;
	}
	if (!isLocalhost) {
		testEventBtn.classList.add('layout-hidden');
		return;
	}

	if (currentLayout === 'worldevents') {
		testEventBtn.classList.remove('layout-hidden');
		testEventBtn.textContent = 'Skip Time';
		testEventBtn.setAttribute('data-hover-text', 'Test transition to the next World Event (Localhost only)');
	} else if (currentLayout === 'traanstock') {
		testEventBtn.classList.remove('layout-hidden');
		testEventBtn.textContent = 'Randomize Stock';
		testEventBtn.setAttribute('data-hover-text', "Randomize Traan's stock to test theming (Localhost only)");
	} else {
		testEventBtn.classList.add('layout-hidden');
	}

	if (cursorHoverBox && currentHoverTarget === testEventBtn) {
		const newHoverText = testEventBtn.getAttribute('data-hover-text');
		if (newHoverText) {
			cursorHoverBox.textContent = newHoverText;
		}
	}
}

if (testEventBtn) {
	updateDebugButton();

	testEventBtn.addEventListener('click', () => {
		if (currentLayout === 'worldevents') {
			const now = getAppTime();
			const currentWorld = getWorldEventAtTimestamp(now);
			const targetNextEventTime = now + 20000;
			testTimeOffsetMs += (currentWorld.endTime - targetNextEventTime);
			if (window.Clock) {
				window.Clock.setOffset(testTimeOffsetMs);
			}
			const updatedNow = getAppTime();
			const updatedWorld = getWorldEventAtTimestamp(updatedNow);
			lastWorldSlotIndex = updatedWorld.slotIndex;
			if (window.MusicPlayer) {
				window.MusicPlayer.resetTransition();
				window.MusicPlayer.lastWorldSlotIndex = updatedWorld.slotIndex;
				window.MusicPlayer.sync(updatedNow, true);
			}
			render();
		} else if (currentLayout === 'traanstock') {
			if (window.TraanStockLayout && typeof window.TraanStockLayout.randomizeStock === 'function') {
				window.TraanStockLayout.randomizeStock();
			}
		}
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

	const eventTypeDropdownParent = target.closest('#event-type-dropdown');
	if (eventTypeDropdownParent && eventTypeMenu && !eventTypeMenu.classList.contains('layout-hidden')) {
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
if (window.DateSeasonsPage) {
	window.DateSeasonsPage.init();
}
if (window.MusicPlayer) {
	window.MusicPlayer.init(currentLayout);
}

switchLayout(currentLayout, true);
updateReminderUI();
updateVolumeSliderUI(soundtrackVolume);
if (window.MusicPlayer) {
	window.MusicPlayer.setVolume(soundtrackVolume / 100);
}
updateAnimationsUI();
render();
setInterval(render, 500);
