// A stable accessible heading accompanies a purely visual rotating phrase.
const rotation = document.querySelector('[data-headline-rotation]');
if (rotation) {
 const phrases = Array.from(rotation.querySelectorAll('.headline-phrase'));
 const button = document.querySelector('[data-headline-pause]');
 const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
 let index = 0;
 let paused = false;
 let visible = true;
 let timer;
 const sizeCurrentWord = () => {
  rotation.style.width = `${Math.ceil(phrases[index].getBoundingClientRect().width)}px`;
 };
 const stop = () => { window.clearTimeout(timer); timer = undefined; };
 const schedule = () => {
  stop();
  if (paused || preference.matches || document.hidden || !visible || phrases.length < 2) return;
  timer = window.setTimeout(() => {
   phrases.forEach(phrase => phrase.classList.remove('is-leaving'));
   phrases[index].classList.remove('is-current');
   phrases[index].classList.add('is-leaving');
   index = (index + 1) % phrases.length;
   phrases[index].classList.add('is-current');
   sizeCurrentWord();
   schedule();
  }, 3000);
 };
 const updateControl = () => {
  button.hidden = preference.matches;
  button.textContent = paused ? 'Resume headline' : 'Pause headline';
  button.setAttribute('aria-pressed', String(paused));
 };
 button.addEventListener('click', () => { paused = !paused; updateControl(); schedule(); });
 preference.addEventListener('change', () => { updateControl(); schedule(); });
 document.addEventListener('visibilitychange', schedule);
 if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
   visible = entries[0].isIntersecting;
   schedule();
  });
  observer.observe(rotation);
 }
 sizeCurrentWord();
 if ('ResizeObserver' in window) {
  const resizeObserver = new ResizeObserver(sizeCurrentWord);
  resizeObserver.observe(rotation.closest('.hero-copy'));
 } else window.addEventListener('resize', sizeCurrentWord);
 document.fonts?.ready.then(sizeCurrentWord);
 updateControl();
 schedule();
}
