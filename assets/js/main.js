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

    initServiceMap();
    hydrateWeatherPanel();
    hydrateGithubPanel();
    initContactForm();
    initAccordion();
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

        fetch('https://httpbin.org/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: 'joe-tech.github.io',
                submittedAt: new Date().toISOString(),
                payload
            })
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
                    alertBox.textContent = 'We could not reach the scheduling service. Please call or text (626) 555-1024.';
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
