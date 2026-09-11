'use strict';
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
function closeMenu() { navigation.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('is-open', open); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('is-open')) { closeMenu(); menuButton.focus(); } });
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
window.matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
const form = document.querySelector('#repair-form');
if (form) {
 const params = new URLSearchParams(window.location.search);
 const selected = params.get('repair');
 const field = form.elements.namedItem('service');
 if (selected && Array.from(field.options).some(option => option.value === selected)) field.value = selected;
 const displayField = form.elements.namedItem('display');
 const displayGroup = document.getElementById('display-preference');
 const displayChoice = params.get('display');
 const syncDisplayPreference = () => {
  const screenRepair = field.value === 'Screen repair';
  displayGroup.hidden = !screenRepair;
  displayField.disabled = !screenRepair;
  if (!screenRepair) displayField.value = 'Help me choose';
 };
 if (selected === 'Screen repair' && Array.from(displayField.options).some(option => option.value === displayChoice)) displayField.value = displayChoice;
 syncDisplayPreference();
 field.addEventListener('change', syncDisplayPreference);
 form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const subject = `Repair quote: ${data.get('device')}`;
  const body = [`Hi Joe, I’d like a repair quote.`, '', `Name: ${data.get('name')}`, `Email: ${data.get('email')}`, `Phone: ${data.get('phone') || 'Not provided'}`, `Device: ${data.get('device')}`, `Repair: ${data.get('service')}`, ...(data.get('service') === 'Screen repair' ? [`Display preference: ${data.get('display')}`] : []), '', 'What’s happening:', data.get('issue')].join('\n');
  const mailto = `mailto:joe@joestechrepair.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
  document.getElementById('form-status').textContent = 'Your email app should open with your repair details. Send the email there to contact Joe. Nothing has been submitted through this website. If no draft opens, use the email address or text number on this page.';
 });
}

// Photo links still open the original image when JavaScript is unavailable.
const photoLinks = Array.from(document.querySelectorAll('a[data-photo]'));
if (photoLinks.length && typeof HTMLDialogElement !== 'undefined') {
 const viewer = document.createElement('dialog');
 viewer.className = 'photo-viewer';
 viewer.setAttribute('aria-labelledby', 'viewer-title');
 viewer.innerHTML = '<div class="viewer-top"><h2 id="viewer-title" class="viewer-title" aria-live="polite"></h2><button class="viewer-close" type="button" autofocus>Close</button></div><div class="viewer-canvas"><img class="viewer-image" alt=""></div><div class="viewer-bottom"><div class="viewer-buttons"><button class="viewer-step viewer-prev" type="button" aria-label="Previous photo">←</button><button class="viewer-step viewer-next" type="button" aria-label="Next photo">→</button></div><span class="viewer-count"></span><a class="viewer-original" target="_blank" rel="noopener noreferrer">Open full-size image</a></div>';
 document.body.append(viewer);
 const photo = viewer.querySelector('.viewer-image');
 const title = viewer.querySelector('.viewer-title');
 let activeIndex = 0;
 let opener;
 let previousOverflow = '';
 const showPhoto = index => {
  activeIndex = (index + photoLinks.length) % photoLinks.length;
  const link = photoLinks[activeIndex];
  photo.src = link.href;
  photo.alt = link.querySelector('img').alt;
  title.textContent = link.closest('figure').querySelector('figcaption').textContent;
  viewer.querySelector('.viewer-original').href = link.href;
  viewer.querySelector('.viewer-count').textContent = `${activeIndex + 1} / ${photoLinks.length}`;
 };
 photoLinks.forEach((link, index) => link.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  opener = link;
  showPhoto(index);
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  viewer.showModal();
 }));
 viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
 viewer.querySelector('.viewer-prev').addEventListener('click', () => showPhoto(activeIndex - 1));
 viewer.querySelector('.viewer-next').addEventListener('click', () => showPhoto(activeIndex + 1));
 viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
 viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(activeIndex - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(activeIndex + 1); }
 });
 viewer.addEventListener('close', () => {
  document.body.style.overflow = previousOverflow;
  opener?.focus({preventScroll: true});
 });
}

// Finite, decorative icon sequences. Copy and links never depend on animation.
const repairMotionItems = document.querySelectorAll('[data-repair-motion]');
if (repairMotionItems.length) {
 const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
 const playRepairMotion = element => {
  if (motionPreference.matches || document.hidden || element.classList.contains('motion-playing')) return;
  element.classList.add('motion-playing');
 };
 repairMotionItems.forEach(element => {
  element.addEventListener('animationend', event => {
   if (event.animationName === element.dataset.motionEnd || event.animationName === 'service-nod') element.classList.remove('motion-playing');
  });
  element.addEventListener('pointerenter', () => playRepairMotion(element));
  element.addEventListener('focusin', () => playRepairMotion(element));
 });
 if ('IntersectionObserver' in window) {
  const motionObserver = new IntersectionObserver(entries => {
   entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    playRepairMotion(entry.target);
    motionObserver.unobserve(entry.target);
   });
  }, {threshold: .25});
  repairMotionItems.forEach(element => motionObserver.observe(element));
 }
 const stopRepairMotion = () => repairMotionItems.forEach(element => element.classList.remove('motion-playing'));
 motionPreference.addEventListener('change', event => { if (event.matches) stopRepairMotion(); });
 document.addEventListener('visibilitychange', () => { if (document.hidden) stopRepairMotion(); });
}
