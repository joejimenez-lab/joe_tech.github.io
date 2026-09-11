// Use the artist's complete teardown, including its original materials and animation.
(() => {
 const stage = document.querySelector('[data-teardown]');
 if (!stage || !window.Sketchfab) return;
 const frame = stage.querySelector('iframe');
 const controls = stage.querySelector('.teardown-controls');
 const slider = stage.querySelector('input');
 const output = stage.querySelector('output');
 const play = stage.querySelector('[data-teardown-play]');
 const reset = stage.querySelector('[data-teardown-reset]');
 const reduce = matchMedia('(prefers-reduced-motion: reduce)');
 let api, duration = 0, playing = false, timer, originalCamera;
 const update = percent => {
  slider.value = Math.round(percent);
  output.value = percent < 1 ? 'Assembled' : percent > 99 ? 'Exploded view' : `${Math.round(percent)}%`;
  slider.setAttribute('aria-valuetext', output.value);
 };
 const stopped = () => { playing = false; play.textContent = 'Play teardown'; clearInterval(timer); };
 const started = () => {
  stopped(); playing = true; play.textContent = 'Pause teardown';
  timer = setInterval(() => api.getCurrentTime((error, seconds) => {
   if (!error && playing) update(Math.min(100, seconds / duration * 100));
  }), 180);
 };
 const pause = () => { api?.pause(); stopped(); };
 const seek = percent => { pause(); api.seekTo(duration * percent / 100); update(percent); };
 new Sketchfab('1.12.1', frame).init('708eaa5d195544918e5f70b69eedcdfa', {
  autostart: 1, animation_autoplay: 0, camera: 0, dnt: 1, scrollwheel: 0, ui_theme: 'dark',
  success(viewer) {
   api = viewer;
   api.addEventListener('viewerready', () => {
    api.setBackground({color: [.035, .047, .07]});
    api.getCameraLookAt((error, camera) => { if (!error) originalCamera = camera; });
    api.getAnimations((error, animations) => {
     if (error || !animations?.length) return;
     const [uid, , seconds] = animations[0];
     if (!(seconds > 0)) return;
     duration = seconds;
     api.setCurrentAnimationByUID(uid, error => {
      if (error) return;
      api.setCycleMode('one');
      seek(100);
      controls.hidden = false;
     });
    });
   });
   api.addEventListener('animationEnded', () => { stopped(); update(100); });
   api.addEventListener('animationStop', stopped);
   api.addEventListener('animationPlay', () => { if (duration) started(); });
   api.start();
  },
  error() { controls.hidden = true; }
 });
 slider.addEventListener('input', () => seek(Number(slider.value)));
 play.addEventListener('click', () => {
  if (playing) { pause(); return; }
  if (Number(slider.value) >= 99) { api.seekTo(0); update(0); }
  api.play(error => { if (!error) started(); });
 });
 reset.addEventListener('click', () => {
  seek(100);
  if (originalCamera) api.setCameraLookAt(originalCamera.position, originalCamera.target, reduce.matches ? 0 : .6);
 });
 document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
 reduce.addEventListener('change', event => { if (event.matches) pause(); });
 new IntersectionObserver(entries => { if (!entries[0].isIntersecting && playing) pause(); }, {threshold: .05}).observe(stage);
})();
