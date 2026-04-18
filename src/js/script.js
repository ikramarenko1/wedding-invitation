const TARGET = new Date('2026-06-06T14:00:00+03:00');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX_DELAY = 8;

function pluralize(n, forms) {
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod100 >= 11 && mod100 <= 19) return forms[2];
	if (mod10 === 1) return forms[0];
	if (mod10 >= 2 && mod10 <= 4) return forms[1];
	return forms[2];
}

const LABELS = {
	days: ['день', 'дні', 'днів'],
	hours: ['година', 'години', 'годин'],
	minutes: ['хвилину', 'хвилини', 'хвилин'],
	seconds: ['секунду', 'секунди', 'секунд'],
};

function pad(n) {
	return String(n).padStart(2, '0');
}

const UNITS = ['days', 'hours', 'minutes', 'seconds'];
const numEls = {};
const labelEls = {};
UNITS.forEach(unit => {
	numEls[unit] = document.querySelector(`.${unit} .digits__num`);
	labelEls[unit] = document.querySelector(`.${unit} .digits__label`);
});

function setDigit(el, newVal) {
	if (!el || el.textContent === newVal) return;
	el.classList.remove('is-flipping');
	void el.offsetWidth;
	el.classList.add('is-flipping');
	setTimeout(() => { el.textContent = newVal; }, 200);
	el.addEventListener('animationend', () => el.classList.remove('is-flipping'), { once: true });
}

function updateTimer() {
	const diff = TARGET - Date.now();
	if (diff <= 0) {
		UNITS.forEach(unit => {
			setDigit(numEls[unit], '00');
			labelEls[unit].textContent = LABELS[unit][2];
		});
		return;
	}
	const days = Math.floor(diff / 86400000);
	const hours = Math.floor((diff % 86400000) / 3600000);
	const minutes = Math.floor((diff % 3600000) / 60000);
	const seconds = Math.floor((diff % 60000) / 1000);
	const values = { days, hours, minutes, seconds };
	UNITS.forEach(unit => {
		setDigit(numEls[unit], pad(values[unit]));
		labelEls[unit].textContent = pluralize(values[unit], LABELS[unit]);
	});
}

updateTimer();
setInterval(updateTimer, 1000);

function createLineMask(el, cssVar, { threshold = 0.25, duration = 1500, onProgress, onReset } = {}) {
	if (!el || reducedMotion) return;
	let rafId = null;

	function reset() {
		if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
		el.style.setProperty(cssVar, 'linear-gradient(to bottom, black 0%, transparent 0%)');
		if (onReset) onReset();
	}

	function animate() {
		let start = null;
		function frame(ts) {
			if (!start) start = ts;
			const pct = Math.min(100, Math.round((ts - start) / duration * 100));
			el.style.setProperty(cssVar, `linear-gradient(to bottom, black ${pct}%, transparent ${pct}%)`);
			if (onProgress) onProgress(pct);
			if (pct < 100) rafId = requestAnimationFrame(frame);
		}
		rafId = requestAnimationFrame(frame);
	}

	reset();
	new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) animate();
			else if (entry.boundingClientRect.top > 0) reset();
		});
	}, { threshold }).observe(el);
}

const timingEvents = Array.from(document.querySelectorAll('.timing__event'));
const EVENT_TRIGGERS = [20, 47, 92];
timingEvents.forEach((el, i) => {
	el.classList.add('reveal', i % 2 === 0 ? 'reveal--left' : 'reveal--right');
});

createLineMask(document.querySelector('.timing__table'), '--timing-mask', {
	threshold: 0.25,
	duration: 1500,
	onProgress: (pct) => {
		EVENT_TRIGGERS.forEach((t, i) => {
			if (pct >= t) timingEvents[i]?.classList.add('is-visible');
		});
	},
	onReset: () => timingEvents.forEach(el => el.classList.remove('is-visible')),
});

createLineMask(document.querySelector('.details__container'), '--details-mask', {
	threshold: 0.15,
	duration: 2000,
});

const REVEAL_MAP = [
	{ sel: '.calendar__header' },
	{ sel: '.calendar__table', mod: 'reveal--scale', delay: 1 },
	{ sel: '.calendar__footer', delay: 2 },
	{ sel: '.location__title' },
	{ sel: '.location__arch', mod: 'reveal--scale', delay: 1 },
	{ sel: '.location__name', mod: 'reveal--left', delay: 2 },
	{ sel: '.location__address', mod: 'reveal--left', delay: 3 },
	{ sel: '.location__btn', delay: 4 },
	{ sel: '.dresscode__title' },
	{ sel: '.dresscode__subtitle', delay: 1 },
	{ sel: '.dresscode__image', mod: 'reveal--left', delay: 2 },
	{ sel: '.dresscode__text', mod: 'reveal--right', delay: 2 },
	{ sel: '.details__title' },
	{ sel: '.details__text', delay: 1 },
	{ sel: '.details__envelope', mod: 'reveal--scale', delay: 2 },
	{ sel: '.details__photo', mod: 'reveal--right', delay: 3 },
	{ sel: '.transfer__title' },
	{ sel: '.transfer__text', delay: 1 },
	{ sel: '.when__title' },
	{ sel: '.when__digits', mod: 'reveal--scale', stagger: true },
	{ sel: '.when__colon', mod: 'reveal--scale', stagger: true },
	{ sel: '.when__candle.left', mod: 'reveal--left', delay: 5 },
	{ sel: '.when__candle.right', mod: 'reveal--right', delay: 5 },
	{ sel: '.timing__title' },
	{ sel: '.questions__title' },
	{ sel: '.questions__form', delay: 1 },
	{ sel: '.footer__title' },
	{ sel: '.footer__photo', mod: 'reveal--scale', delay: 1 },
];

function setupReveal() {
	REVEAL_MAP.forEach(({ sel, mod, delay, stagger }) => {
		document.querySelectorAll(sel).forEach((el, i) => {
			el.classList.add('reveal');
			if (mod) el.classList.add(mod);
			const d = stagger ? i + 1 : (delay || 0);
			if (d) el.classList.add(`reveal--delay-${Math.min(d, MAX_DELAY)}`);
		});
	});

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) entry.target.classList.add('is-visible');
			else if (entry.boundingClientRect.top > 0) entry.target.classList.remove('is-visible');
		});
	}, { threshold: 0.3 });

	document.querySelectorAll('.reveal:not(.timing__event)').forEach(el => observer.observe(el));
}

setupReveal();

const SHEET_URL = 'тут пока заглушка';

function showToast(title, text = '') {
	const toast = document.createElement('div');
	toast.className = 'toast';
	toast.setAttribute('role', 'status');
	toast.innerHTML = `
		<div class="toast__title">${title}</div>
		${text ? `<div class="toast__text">${text}</div>` : ''}
		<div class="toast__progress"></div>
	`;
	document.body.appendChild(toast);
	requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('is-visible')));
	setTimeout(() => {
		toast.classList.remove('is-visible');
		toast.addEventListener('transitionend', () => toast.remove(), { once: true });
	}, 4500);
}

function addError(group, msg) {
	let err = group.querySelector('.questions__error');
	if (!err) {
		err = document.createElement('div');
		err.className = 'questions__error';
		err.setAttribute('role', 'alert');
		group.appendChild(err);
	}
	err.textContent = msg;
	err.classList.add('is-visible');
}

function clearErrors(form) {
	form.querySelectorAll('.questions__error').forEach(el => el.classList.remove('is-visible'));
	form.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));
}

function validateForm(form) {
	let valid = true;

	const nameInput = form.querySelector('[name="name"]');
	if (nameInput.value.trim().length < 2) {
		nameInput.classList.add('is-error');
		addError(nameInput.closest('.questions__group'), 'Будь ласка, вкажіть ваше ім\'я та прізвище');
		valid = false;
	}

	const attendance = form.querySelector('[name="attendance"]:checked');
	if (!attendance) {
		const row = form.querySelector('[name="attendance"]').closest('.questions__row');
		row.classList.add('is-error');
		addError(row.closest('.questions__group'), 'Будь ласка, оберіть відповідь');
		valid = false;
	}

	return valid;
}

const questionsForm = document.querySelector('.questions__form');
if (questionsForm) {
	const btn = questionsForm.querySelector('.questions__button');

	function checkReady() {
		const nameOk = questionsForm.querySelector('[name="name"]').value.trim().length >= 2;
		const attendanceOk = !!questionsForm.querySelector('[name="attendance"]:checked');
		btn.disabled = !(nameOk && attendanceOk);
	}

	btn.disabled = true;

	questionsForm.querySelector('[name="name"]').addEventListener('input', function () {
		this.classList.remove('is-error');
		const err = this.closest('.questions__group')?.querySelector('.questions__error');
		if (err) err.classList.remove('is-visible');
		checkReady();
	});

	questionsForm.querySelectorAll('[name="attendance"]').forEach(radio => {
		radio.addEventListener('change', () => {
			const row = radio.closest('.questions__row');
			row?.classList.remove('is-error');
			const err = row?.closest('.questions__group')?.querySelector('.questions__error');
			if (err) err.classList.remove('is-visible');
			checkReady();
		});
	});

	questionsForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		clearErrors(questionsForm);
		if (!validateForm(questionsForm)) return;

		const fd = new FormData(questionsForm);
		const data = {
			name: fd.get('name'),
			attendance: fd.get('attendance'),
			alcohol: fd.getAll('alcohol').join(', ') || '—',
			comment: fd.get('comment') || '—',
		};

		btn.disabled = true;
		const originalText = btn.textContent;
		btn.textContent = 'Надсилаємо...';

		try {
			await fetch(SHEET_URL, {
				method: 'POST',
				mode: 'no-cors',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			questionsForm.reset();
			showToast('Дякуємо!', 'Ваша відповідь надіслана');
		} catch {
			showToast('Помилка', 'Будь ласка, спробуйте ще раз');
		} finally {
			btn.textContent = originalText;
			checkReady();
		}
	});
}
