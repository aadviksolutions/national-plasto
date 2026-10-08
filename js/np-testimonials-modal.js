/**
 * National Plasto - Testimonials Video & Media Lightbox Modal + Interactive Marquee Engine
 * - Smooth continuous GPU requestAnimationFrame marquee
 * - Instant responsive manual scroll (Prev / Next buttons, Mouse Drag, Touch Swipe, Trackpad / Wheel)
 * - Auto-resumes seamlessly after user interaction
 * - Uncropped popup video / photo lightbox
 */
(function () {
  'use strict';

  function initTestimonialsModal() {
    var modal = document.getElementById('npTestiModal');
    if (!modal) return;

    var backdrop = modal.querySelector('.np-testi-modal__backdrop');
    var closeBtn = modal.querySelector('.np-testi-modal__close');
    var mediaContainer = modal.querySelector('.np-testi-modal__media-container');
    var badgeEl = modal.querySelector('.np-testi-modal__badge');
    var titleEl = modal.querySelector('.np-testi-modal__title');
    var descEl = modal.querySelector('.np-testi-modal__desc');

    function closeModal() {
      if (!modal.classList.contains('active')) return;
      modal.classList.remove('active');
      document.body.classList.remove('np-modal-open');

      if (mediaContainer) {
        var video = mediaContainer.querySelector('video');
        if (video) {
          try {
            video.pause();
            video.removeAttribute('src');
            video.load();
          } catch (e) {}
        }
        mediaContainer.innerHTML = '';
      }
    }

    function openModalWithVideo(src, title, tag, desc) {
      if (!mediaContainer) return;
      mediaContainer.innerHTML = '';

      var video = document.createElement('video');
      video.className = 'np-modal-video';
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = src;

      var source = document.createElement('source');
      source.src = src;
      source.type = 'video/mp4';
      video.appendChild(source);

      mediaContainer.appendChild(video);

      if (badgeEl) badgeEl.textContent = tag || 'Video Testimonial';
      if (titleEl) titleEl.textContent = title || '';
      if (descEl) descEl.textContent = desc || '';

      modal.classList.add('active');
      document.body.classList.add('np-modal-open');

      video.load();
      var playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {
          // Fallback if browser policy blocks autoplay
        });
      }
    }

    function openModalWithPhoto(src, title, tag, desc) {
      if (!mediaContainer) return;
      mediaContainer.innerHTML = '';

      var img = document.createElement('img');
      img.className = 'np-modal-photo';
      img.src = src;
      img.alt = title || 'Facility Showcase';

      mediaContainer.appendChild(img);

      if (badgeEl) badgeEl.textContent = tag || 'Photo Showcase';
      if (titleEl) titleEl.textContent = title || '';
      if (descEl) descEl.textContent = desc || '';

      modal.classList.add('active');
      document.body.classList.add('np-modal-open');
    }

    // Attach click listeners to all video triggers
    document.querySelectorAll('.np-video-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var src = this.getAttribute('data-video');
        var title = this.getAttribute('data-title');
        var tag = this.getAttribute('data-tag');
        var desc = this.getAttribute('data-desc');
        if (src) {
          openModalWithVideo(src, title, tag, desc);
        }
      });
    });

    // Attach click listeners to photo triggers
    document.querySelectorAll('.np-photo-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var src = this.getAttribute('data-photo');
        var title = this.getAttribute('data-title');
        var tag = this.getAttribute('data-tag');
        var desc = this.getAttribute('data-desc');
        if (src) {
          openModalWithPhoto(src, title, tag, desc);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  function initTestimonialsMarquee() {
    var containers = document.querySelectorAll('.np-testi-marquee-container');
    containers.forEach(function (container) {
      var track = container.querySelector('.np-testi-marquee-track');
      if (!track) return;

      var currentX = 0;
      var targetX = 0;
      var isDragging = false;
      var isHovered = false;
      var isManualAnimating = false;
      var startX = 0;
      var dragMoved = 0;
      var resumeTimeout = null;
      var lastTime = null;
      var baseSpeed = 48; // pixels per second (smooth, continuous)

      function getHalfWidth() {
        return (track.scrollWidth / 2) || 2500;
      }

      function normalizeX(x, half) {
        if (!half) half = getHalfWidth();
        while (x <= -half) x += half;
        while (x > 0) x -= half;
        return x;
      }

      function pauseAndResumeAfter(delayMs) {
        if (resumeTimeout) clearTimeout(resumeTimeout);
        isManualAnimating = true;
        resumeTimeout = setTimeout(function () {
          isManualAnimating = false;
        }, delayMs || 2200);
      }

      // Prev / Next navigation button handlers
      var wrapper = container.closest('.np-testi-marquee-wrapper') || container.parentElement;
      var prevBtn = wrapper.querySelector('.np-testi-prev');
      var nextBtn = wrapper.querySelector('.np-testi-next');
      var cardStep = 314; // card (290px) + gap (24px)

      if (prevBtn) {
        prevBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          targetX = currentX + cardStep;
          pauseAndResumeAfter(2500);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          targetX = currentX - cardStep;
          pauseAndResumeAfter(2500);
        });
      }

      // Mouse drag handlers
      container.addEventListener('mousedown', function (e) {
        if (e.target.closest('button')) return;
        isDragging = true;
        startX = e.pageX;
        dragMoved = 0;
        targetX = currentX;
        if (resumeTimeout) clearTimeout(resumeTimeout);
        container.classList.add('np-is-dragging');
      });

      window.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        var dx = e.pageX - startX;
        startX = e.pageX;
        dragMoved += Math.abs(dx);
        currentX += dx;
        targetX = currentX;
        var half = getHalfWidth();
        currentX = normalizeX(currentX, half);
        targetX = currentX;
        track.style.transform = 'translate3d(' + currentX + 'px, 0, 0)';
      });

      window.addEventListener('mouseup', function () {
        if (!isDragging) return;
        isDragging = false;
        container.classList.remove('np-is-dragging');
        pauseAndResumeAfter(1800);
      });

      // Mobile Touch Swipe Handlers
      container.addEventListener('touchstart', function (e) {
        if (!e.touches || !e.touches[0]) return;
        isDragging = true;
        startX = e.touches[0].pageX;
        dragMoved = 0;
        targetX = currentX;
        if (resumeTimeout) clearTimeout(resumeTimeout);
      }, { passive: true });

      container.addEventListener('touchmove', function (e) {
        if (!isDragging || !e.touches || !e.touches[0]) return;
        var curTouch = e.touches[0].pageX;
        var dx = curTouch - startX;
        startX = curTouch;
        dragMoved += Math.abs(dx);
        currentX += dx;
        targetX = currentX;
        var half = getHalfWidth();
        currentX = normalizeX(currentX, half);
        targetX = currentX;
        track.style.transform = 'translate3d(' + currentX + 'px, 0, 0)';
      }, { passive: true });

      container.addEventListener('touchend', function () {
        isDragging = false;
        pauseAndResumeAfter(1800);
      });

      // Mouse Wheel / Trackpad horizontal scrolling
      container.addEventListener('wheel', function (e) {
        var dx = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        if (Math.abs(dx) > 1) {
          currentX -= dx * 0.9;
          targetX = currentX;
          var half = getHalfWidth();
          currentX = normalizeX(currentX, half);
          targetX = currentX;
          track.style.transform = 'translate3d(' + currentX + 'px, 0, 0)';
          pauseAndResumeAfter(1800);
        }
      }, { passive: true });

      // Hover to pause
      container.addEventListener('mouseenter', function () {
        isHovered = true;
      });
      container.addEventListener('mouseleave', function () {
        isHovered = false;
        if (!isDragging) {
          pauseAndResumeAfter(1200);
        }
      });

      // Prevent card modal click when dragging
      track.addEventListener('click', function (e) {
        if (dragMoved > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      // Main 60fps Animation Loop
      function animateLoop(now) {
        if (!lastTime) lastTime = now;
        var dt = (now - lastTime) / 1000;
        if (dt > 0.1) dt = 0.016; // Prevent jumps on tab background
        lastTime = now;

        var half = getHalfWidth();

        if (isDragging) {
          // Handled in mousemove / touchmove
        } else if (isManualAnimating) {
          // Smooth spring lerp towards targetX
          var diff = targetX - currentX;
          if (Math.abs(diff) > 0.5) {
            currentX += diff * 0.15;
          } else {
            currentX = targetX;
          }
          currentX = normalizeX(currentX, half);
          targetX = normalizeX(targetX, half);
          track.style.transform = 'translate3d(' + currentX + 'px, 0, 0)';
        } else if (!isHovered) {
          // Continuous marquee scroll
          currentX -= baseSpeed * dt;
          currentX = normalizeX(currentX, half);
          targetX = currentX;
          track.style.transform = 'translate3d(' + currentX + 'px, 0, 0)';
        }

        requestAnimationFrame(animateLoop);
      }

      requestAnimationFrame(animateLoop);
    });
  }

  function initAll() {
    initTestimonialsModal();
    initTestimonialsMarquee();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
