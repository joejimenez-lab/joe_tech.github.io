document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('flex');
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      event.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
      }
    });
  });

  function animateCounter(element) {
    const target = parseInt(element.dataset.target, 10);
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(progress * target);

      if (target > 1000) {
        element.textContent = (current / 1000).toFixed(0) + 'K+';
      } else {
        element.textContent = current + (target === 24 ? 'hr' : target === 98 ? '%' : '');
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('counter')) {
          animateCounter(entry.target);
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
  document.querySelectorAll('.counter').forEach(el => observer.observe(el));

  const floatingIcons = document.getElementById('floating-icons');
  document.addEventListener('mousemove', event => {
    const mouseX = (event.clientX / window.innerWidth - 0.5) * 20;
    const mouseY = (event.clientY / window.innerHeight - 0.5) * 20;

    const icons = floatingIcons.querySelectorAll('svg');
    icons.forEach((icon, index) => {
      const speed = (index + 1) * 0.1;
      icon.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px)`;
    });
  });

  const bookingForm = document.getElementById('booking-form');
  const toast = document.getElementById('toast');
  const toastTitle = toast?.querySelector('.font-semibold');
  const toastBody = toast?.querySelector('.text-sm');
  let toastTimeout;

  const showToast = ({ title, body, isError = false }) => {
    if (!toast) return;
    if (toastTitle) toastTitle.textContent = title;
    if (toastBody) toastBody.textContent = body;
    toast.classList.toggle('bg-green-500', !isError);
    toast.classList.toggle('bg-red-500', isError);
    toast.style.transform = 'translateY(0)';
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.style.transform = 'translateY(8rem)';
    }, 3000);
  };

  bookingForm.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(bookingForm);
    const payload = {
      fullName: formData.get('fullName'),
      phoneNumber: formData.get('phoneNumber'),
      email: formData.get('email'),
      deviceType: formData.get('deviceType'),
      issue: formData.get('issue')
    };

    try {
      const response = await fetch('/.netlify/functions/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Unable to submit booking');
      }

      showToast({
        title: 'Booking Confirmed!',
        body: 'Joe received your request and will contact you shortly.'
      });
      bookingForm.reset();
    } catch (error) {
      showToast({
        title: 'Submission Failed',
        body: 'Please try again or reach us at 626 344 2562.',
        isError: true
      });
    }
  });

  document.querySelectorAll('.card-3d').forEach((card, index) => {
    card.style.transitionDelay = `${index * 100}ms`;
  });

  const typingHeadline = document.querySelector('.typing-headline');
  if (typingHeadline) {
    const phrases = JSON.parse(typingHeadline.dataset.phrases || '[]');
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 80;
    const deletingSpeed = 40;
    const pause = 2000;

    const type = () => {
      const currentPhrase = phrases[phraseIndex] || '';
      if (!isDeleting) {
        typingHeadline.textContent = currentPhrase.slice(0, charIndex + 1);
        charIndex += 1;
        if (charIndex === currentPhrase.length) {
          isDeleting = true;
          setTimeout(type, pause);
          return;
        }
      } else {
        typingHeadline.textContent = currentPhrase.slice(0, charIndex - 1);
        charIndex -= 1;
        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }
      setTimeout(type, isDeleting ? deletingSpeed : typingSpeed);
    };

    if (phrases.length) {
      type();
    }
  }

});
