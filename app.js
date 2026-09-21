const WORLD_EVENTS = [
  {
    name: 'Battle Royale',
    gradientClass: 'gradient-battle-royale',
    textGlowClass: 'text-glow-battle-royale',
    bgImage: 'assets/BattleRoyale.webp'
  },
  {
    name: 'Carnival of Hearts',
    gradientClass: 'gradient-carnival',
    textGlowClass: 'text-glow-carnival',
    bgImage: 'assets/Carnival.webp'
  },
  {
    name: 'Interluminary Interloper',
    gradientClass: 'gradient-interluminary',
    textGlowClass: 'text-glow-interluminary',
    bgImage: 'assets/Parasol.webp'
  }
];

const DISASTERS = [
  {
    name: 'Cinders of Etris',
    gradientClass: 'disaster-gradient-etris',
    textGlowClass: 'text-glow-etris',
    bgImage: 'assets/CindersOfEtris.webp'
  },
  {
    name: 'Doom of Caeranthil',
    gradientClass: 'disaster-gradient-caeranthil',
    textGlowClass: 'text-glow-caeranthil',
    bgImage: 'assets/Caeranthil.webp'
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

const pastEventNameElement = document.getElementById('past-event-name');
const nextEventNameElement = document.getElementById('next-event-name');
const currentEventNameElement = document.getElementById('current-event-name');
const joinStatusElement = document.getElementById('join-status');
const mainTimerElement = document.getElementById('main-timer');

const pastDisasterNameElement = document.getElementById('past-disaster-name');
const nextDisasterNameElement = document.getElementById('next-disaster-name');
const currentDisasterNameElement = document.getElementById('current-disaster-name');
const disasterTimerElement = document.getElementById('disaster-timer');
const disasterTimerBlock = document.getElementById('disaster-timer-block');

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

  if (minutes > 0) {
    return `${minutes} ${minuteUnit} and ${seconds} ${secondUnit} left until next ${what}`;
  }
  return `${seconds} ${secondUnit} left until next ${what}`;
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
    if (bottomTimersGrid) {
      bottomTimersGrid.classList.remove('single-column');
    }
    if (disasterTimerColumn) {
      disasterTimerColumn.classList.remove('timer-hidden');
    }
    if (disasterTimerBlock) {
      disasterTimerBlock.classList.remove('timer-hidden');
    }
    if (bgBackdrop) {
      bgBackdrop.classList.add('slashed');
    }
    disasterTimerElement.classList.remove('timer-hidden');
    disastersToggleLabel.textContent = 'Hide Etrean Luminant Disasters';
  } else {
    eventsGrid.classList.add('single-column');
    if (bottomTimersGrid) {
      bottomTimersGrid.classList.add('single-column');
    }
    if (disasterTimerColumn) {
      disasterTimerColumn.classList.add('timer-hidden');
    }
    if (disasterTimerBlock) {
      disasterTimerBlock.classList.add('timer-hidden');
    }
    if (bgBackdrop) {
      bgBackdrop.classList.remove('slashed');
    }
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

  applyPreviewStyling(pastEventNameElement, previous.event);
  applyPreviewStyling(nextEventNameElement, next.event);

  currentEventNameElement.textContent = current.event.name;
  currentEventNameElement.className = `current-event-title event-gradient-text ${current.event.gradientClass} ${current.event.textGlowClass}`;

  const timeUntilNext = current.endTime - now;
  mainTimerElement.textContent = formatDurationLabel(timeUntilNext, 'World Event');

  const elapsedSinceStart = now - current.startTime;
  const remainingJoinWindow = JOIN_WINDOW_MS - elapsedSinceStart;

  if (remainingJoinWindow > 0) {
    const formattedJoin = formatCountdown(remainingJoinWindow);
    joinStatusElement.innerHTML = `Time Left to join: <span class="status-active-value">${formattedJoin}</span>`;
  } else {
    joinStatusElement.innerHTML = `You can <span class="status-no-longer">no longer</span> join this event`;
  }
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
    return;
  }

  if (pastDisasterNameElement) {
    applyPreviewStyling(pastDisasterNameElement, previous.disaster);
  }
  applyPreviewStyling(nextDisasterNameElement, next.disaster);

  currentDisasterNameElement.textContent = current.disaster.name;
  currentDisasterNameElement.className = `current-event-title event-gradient-text ${current.disaster.gradientClass} ${current.disaster.textGlowClass}`;

  const timeUntilNext = current.endTime - now;
  disasterTimerElement.textContent = formatDurationLabel(timeUntilNext, 'Disaster');
}

function render() {
  const now = Date.now();
  renderWorldEvents(now);
  renderDisasters(now);
}

disastersToggleBtn.addEventListener('click', () => {
  isDisastersVisible = !isDisastersVisible;
  localStorage.setItem('user_disasters_visible', String(isDisastersVisible));
  updateDisastersVisibilityUI();
  render();
});

updateDisastersVisibilityUI();
render();
setInterval(render, 500);
