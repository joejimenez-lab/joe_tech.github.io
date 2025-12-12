document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    const yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }

    const currentPage = document.body.dataset.page;
    if (currentPage && navLinks) {
        const activeLink = navLinks.querySelector(`[data-nav="${currentPage}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    initPageIntro();
    initScrollReveal();
    initTerminal();
    initServiceMap();
    hydrateWeatherPanel();
    hydrateGithubPanel();
    initContactForm();
    initAccordion();
    initTypingText();
});

function initServiceMap() {
    const mapContainer = document.getElementById('service-map');
    if (!mapContainer || typeof L === 'undefined') return;

    const map = L.map(mapContainer).setView([34.0853, -117.9609], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const serviceAreas = [
        {
            coords: [34.0853, -117.9609],
            title: 'Baldwin Park HQ',
            description: 'Primary service base with same-day response.'
        },
        {
            coords: [34.0522, -118.2437],
            title: 'Los Angeles Coverage',
            description: 'On-site and remote service across the greater LA area.'
        },
        {
            coords: [34.1478, -118.1445],
            title: 'Pasadena & San Gabriel Valley',
            description: 'Popular for campus and research lab support.'
        }
    ];

    serviceAreas.forEach(area => {
        L.marker(area.coords).addTo(map).bindPopup(`<strong>${area.title}</strong><br>${area.description}`);
    });
}

function hydrateWeatherPanel() {
    const weatherPanel = document.querySelector('[data-weather]');
    if (!weatherPanel) return;

    const weatherStatus = weatherPanel.querySelector('[data-weather-status]');
    const temperatureEl = weatherPanel.querySelector('[data-weather-temp]');

    weatherStatus.textContent = 'Loading latest conditions...';

    fetch('https://api.open-meteo.com/v1/forecast?latitude=34.0853&longitude=-117.9609&current=temperature_2m,weather_code&timezone=America/Los_Angeles')
        .then(res => {
            if (!res.ok) throw new Error('Weather data unavailable');
            return res.json();
        })
        .then(data => {
            const current = data.current;
            const description = mapWeatherCode(current.weather_code);
            temperatureEl.textContent = `${Math.round(current.temperature_2m)}°F`;
            weatherStatus.textContent = `${description} in Baldwin Park`;
        })
        .catch(() => {
            weatherStatus.textContent = 'Weather service is temporarily unavailable.';
        });
}

function mapWeatherCode(code) {
    const codes = {
        0: 'Clear skies',
        1: 'Mostly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Light rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Light snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        80: 'Rain showers',
        81: 'Heavy rain showers',
        82: 'Severe rain showers'
    };
    return codes[code] || 'Live conditions';
}

function hydrateGithubPanel() {
    const githubPanel = document.querySelector('[data-github]');
    if (!githubPanel) return;

    const repoNameEl = githubPanel.querySelector('[data-repo-name]');
    const starsEl = githubPanel.querySelector('[data-repo-stars]');
    const updatedEl = githubPanel.querySelector('[data-repo-updated]');

    repoNameEl.textContent = 'Loading projects...';

    fetch('https://api.github.com/users/joe-tech/repos?sort=updated&per_page=1')
        .then(res => {
            if (!res.ok) throw new Error('GitHub rate limit');
            return res.json();
        })
        .then(repos => {
            if (!Array.isArray(repos) || repos.length === 0) throw new Error('No repositories found');
            const repo = repos[0];
            repoNameEl.innerHTML = `<a href="${repo.html_url}" target="_blank" rel="noopener">${repo.name}</a>`;
            starsEl.textContent = `${repo.stargazers_count} stars`;
            updatedEl.textContent = `Updated ${new Date(repo.updated_at).toLocaleDateString()}`;
        })
        .catch(() => {
            repoNameEl.textContent = 'Unable to load GitHub projects right now.';
            starsEl.textContent = '';
            updatedEl.textContent = '';
        });
}

function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const alertBox = document.querySelector('[data-form-alert]');
    form.addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());

        if (alertBox) {
            alertBox.textContent = 'Sending your request...';
            alertBox.classList.add('alert');
        }

        fetch('/.netlify/functions/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(() => {
                if (alertBox) {
                    alertBox.textContent = 'Thanks! Your request is in queue and Joe will reach out within 1 business hour.';
                }
                form.reset();
            })
            .catch(() => {
                if (alertBox) {
                    alertBox.textContent = 'I could not reach the scheduling service. Please call or text 626 344 2562.';
                }
            });
    });
}

function initAccordion() {
    const accordionButtons = document.querySelectorAll('[data-accordion-toggle]');
    accordionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const content = document.getElementById(targetId);
            const icon = button.querySelector('span:last-child');
            if (!content) return;
            const expanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', String(!expanded));
            content.hidden = expanded;
            if (icon) {
                icon.textContent = expanded ? '+' : '–';
            }
        });
    });
}

function initTypingText() {
    const typers = document.querySelectorAll('.typing-text');
    typers.forEach(typer => {
        const phrases = JSON.parse(typer.dataset.typing || '[]');
        if (!phrases.length) return;

        let phraseIndex = 0;
        let charIndex = 0;
        let deleting = false;
        const typingSpeed = 80;
        const deletingSpeed = 40;
        const pause = 1800;

        const type = () => {
            const currentPhrase = phrases[phraseIndex];
            if (!deleting) {
                typer.textContent = currentPhrase.slice(0, charIndex + 1);
                charIndex += 1;
                if (charIndex === currentPhrase.length) {
                    deleting = true;
                    setTimeout(type, pause);
                    return;
                }
            } else {
                typer.textContent = currentPhrase.slice(0, charIndex - 1);
                charIndex -= 1;
                if (charIndex === 0) {
                    deleting = false;
                    phraseIndex = (phraseIndex + 1) % phrases.length;
                }
            }
            setTimeout(type, deleting ? deletingSpeed : typingSpeed);
        };

        type();
    });
}

function initPageIntro() {
    const loader = document.querySelector('.page-loader');
    if (!loader) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hideLoader = () => {
        loader.classList.add('is-hidden');
        document.body.classList.add('page-loaded');
    };

    if (prefersReducedMotion) {
        hideLoader();
        return;
    }

    if (document.readyState === 'complete') {
        setTimeout(hideLoader, 350);
    } else {
        window.addEventListener('load', () => setTimeout(hideLoader, 350), { once: true });
    }
}

function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal-up');
    if (!revealEls.length) return;

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealEls.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    revealEls.forEach(el => observer.observe(el));
}

function initTerminal() {
    const terminal = document.querySelector('[data-terminal]');
    if (!terminal) return;

    const outputEl = terminal.querySelector('[data-terminal-output]');
    if (!outputEl) return;

    const sidePanel = document.querySelector('[data-terminal-side]');
    const sideStatus = sidePanel ? sidePanel.querySelector('[data-side-status]') : null;
    const sideReveals = sidePanel ? Array.from(sidePanel.querySelectorAll('[data-side-reveal]')) : [];
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines = [
        'whoami -> joe_jimenez (ms cs @ csla)',
        'git clone git@github.com:joe-tech/portfolio && cd portfolio',
        'pnpm install --frozen-lockfile',
        'pnpm lint && pnpm test --runInBand',
        'render_about_panel --mode slide-in',
        'duckdb : export ./data/telemetry.parquet -> dashboards/',
        'simulate_phone_repair.sh [#####-----] reseat usb-c port',
        'simulate_phone_repair.sh [##########] thermal check = ok',
        'netlify deploy --prod --message "portfolio refresh"',
        'status: build green · ready to share'
    ];

    let lineIndex = 0;
    const cursor = document.createElement('span');
    cursor.className = 'terminal-cursor';
    outputEl.appendChild(cursor);

    const pulseSide = () => {
        if (!sidePanel) return;
        sidePanel.classList.add('pulse');
        setTimeout(() => sidePanel.classList.remove('pulse'), 420);
    };

    const revealSideContent = () => {
        if (!sidePanel) return;
        sidePanel.classList.add('is-open');
        if (!sideReveals.length) return;
        sideReveals.forEach((el, idx) => {
            setTimeout(() => el.classList.add('visible'), prefersReducedMotion ? 0 : 80 * idx);
        });
        if (sideStatus) {
            setTimeout(() => sideStatus.textContent = 'Panel synced.', prefersReducedMotion ? 0 : 80 * sideReveals.length);
        }
    };

    const typeLine = () => {
        if (lineIndex >= lines.length) {
            cursor.classList.add('idle');
            setTimeout(() => {
                outputEl.innerHTML = '';
                outputEl.appendChild(cursor);
                cursor.classList.remove('idle');
                lineIndex = 0;
                typeLine();
            }, 2800);
            return;
        }

        const line = lines[lineIndex];
        const lineEl = document.createElement('div');
        lineEl.className = 'terminal-line';

        const prompt = document.createElement('span');
        prompt.className = 'prompt';
        prompt.textContent = 'joe@repair:~$';
        const textSpan = document.createElement('span');

        lineEl.appendChild(prompt);
        lineEl.appendChild(textSpan);
        outputEl.insertBefore(lineEl, cursor);
        pulseSide();

        let charIndex = 0;
        const stepTime = prefersReducedMotion ? 0 : 12;

        const typeChar = () => {
            textSpan.textContent = line.slice(0, charIndex + 1);
            charIndex += 1;
            outputEl.scrollTop = outputEl.scrollHeight;

            if (charIndex < line.length) {
                setTimeout(typeChar, stepTime);
            } else {
                lineIndex += 1;
                if (line.includes('render_about_panel')) {
                    revealSideContent();
                }
                setTimeout(typeLine, prefersReducedMotion ? 0 : 160);
            }
        };

        if (prefersReducedMotion) {
            textSpan.textContent = line;
            lineIndex += 1;
            if (line.includes('render_about_panel')) {
                revealSideContent();
            }
            setTimeout(typeLine, 0);
        } else {
            typeChar();
        }
    };

    if (prefersReducedMotion && sidePanel) {
        revealSideContent();
    }

    typeLine();
}
