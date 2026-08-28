/* ==========================================================================
   CHOLD Initiative — site behaviour
   Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Header: scrolled state + mobile nav
     ------------------------------------------------------------------ */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');

  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
    var top = document.querySelector('.to-top');
    if (top) top.classList.toggle('is-visible', window.scrollY > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
      document.body.style.overflow = !open ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        document.body.style.overflow = '';
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------------------------
     Animated counters  —  <span data-count="5000000" data-suffix="+">
     ------------------------------------------------------------------ */
  function formatNumber(n) {
    return n.toLocaleString('en-US');
  }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (isNaN(target)) return;
    if (reduceMotion) {
      el.textContent = prefix + (decimals ? target.toFixed(decimals) : formatNumber(target)) + suffix;
      return;
    }
    var duration = 1700;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var value = target * eased;
      el.textContent = prefix + (decimals ? value.toFixed(decimals) : formatNumber(Math.floor(value))) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + (decimals ? target.toFixed(decimals) : formatNumber(target)) + suffix;
    }
    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
    } else {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            co.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }

  /* ------------------------------------------------------------------
     Tabbed explorer (What We Do)
     ------------------------------------------------------------------ */
  var explorers = document.querySelectorAll('[data-explorer]');
  explorers.forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]'));
    if (!tabs.length) return;

    function select(index, focus) {
      tabs.forEach(function (t, i) {
        var on = i === index;
        t.setAttribute('aria-selected', String(on));
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      panels.forEach(function (p, i) { p.hidden = i !== index; });
      if (focus) tabs[index].focus();
      if (location.hash !== '#' + tabs[index].dataset.key) {
        history.replaceState(null, '', '#' + tabs[index].dataset.key);
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });

    // Deep-link support (#lims etc.)
    var hash = location.hash.replace('#', '');
    var startIndex = 0;
    tabs.forEach(function (t, i) { if (t.dataset.key === hash) startIndex = i; });
    select(startIndex, false);
    if (hash && startIndex > 0) {
      setTimeout(function () {
        root.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }, 120);
    }
  });

  /* ------------------------------------------------------------------
     Accordions
     ------------------------------------------------------------------ */
  document.querySelectorAll('.acc-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var expanded = head.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(head.getAttribute('aria-controls'));
      var card = head.closest('.acc');
      head.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.classList.toggle('is-open', !expanded);
      if (card) card.classList.toggle('is-open', !expanded);
    });
  });

  /* ------------------------------------------------------------------
     Forms — validation + submit
     Set data-endpoint on the <form> to POST somewhere (e.g. Formspree).
     With no endpoint, it falls back to opening the visitor's mail client.
     ------------------------------------------------------------------ */
  function setError(field, message) {
    field.classList.add('has-error');
    var e = field.querySelector('.field-error');
    if (e) e.textContent = message;
  }
  function clearError(field) { field.classList.remove('has-error'); }

  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    var status = form.querySelector('.form-status');

    function showStatus(kind, message) {
      if (!status) return;
      status.className = 'form-status is-visible ' + kind;
      status.textContent = message;
      status.setAttribute('role', 'status');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      var firstBad = null;

      form.querySelectorAll('.field').forEach(function (field) {
        var input = field.querySelector('input, select, textarea');
        if (!input || !input.hasAttribute('required')) { clearError(field); return; }
        var v = (input.value || '').trim();
        if (input.type === 'checkbox') {
          if (!input.checked) { setError(field, 'Please confirm to continue.'); valid = false; firstBad = firstBad || input; }
          else clearError(field);
          return;
        }
        if (!v) {
          setError(field, 'This field is required.');
          valid = false; firstBad = firstBad || input;
        } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
          setError(field, 'Please enter a valid email address.');
          valid = false; firstBad = firstBad || input;
        } else {
          clearError(field);
        }
      });

      if (!valid) {
        showStatus('err', 'Please correct the highlighted fields and try again.');
        if (firstBad) firstBad.focus();
        return;
      }

      var endpoint = form.getAttribute('data-endpoint');
      var btn = form.querySelector('[type="submit"]');
      var original = btn ? btn.textContent : '';

      if (!endpoint) {
        // Graceful fallback: compose an email in the visitor's mail client.
        var to = form.getAttribute('data-mailto') || 'info@choldinitiative.org';
        var subject = encodeURIComponent(form.getAttribute('data-subject') || 'Website enquiry');
        var lines = [];
        form.querySelectorAll('input, select, textarea').forEach(function (i) {
          if (i.type === 'submit' || i.type === 'hidden' || !i.name) return;
          if (i.type === 'checkbox') { lines.push(i.name + ': ' + (i.checked ? 'Yes' : 'No')); return; }
          if (i.value) lines.push(i.name + ': ' + i.value);
        });
        window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + encodeURIComponent(lines.join('\n'));
        showStatus('ok', 'Your email client should now open with your message ready to send. If it does not, please write to ' + to + ' directly.');
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      var isApplyEndpoint = endpoint.includes('/api/apply') || endpoint.includes('functions/apply');
      var reqHeaders = { 'Accept': 'application/json' };
      var reqBody;

      if (isApplyEndpoint) {
        if (window.location.hostname.includes('netlify')) {
          endpoint = '/.netlify/functions/apply';
        }
        reqHeaders['Content-Type'] = 'application/json';
        reqBody = JSON.stringify({
          name: (form.querySelector('[name="Full name"]') || {}).value || '',
          email: (form.querySelector('[name="Email"]') || {}).value || '',
          phone: (form.querySelector('[name="Phone"]') || {}).value || '',
          location: (form.querySelector('[name="Location"]') || {}).value || '',
          area: (form.querySelector('[name="Opportunity area"]') || {}).value || '',
          type: (form.querySelector('[name="Engagement type"]') || {}).value || '',
          cv: (form.querySelector('[name="CV link"]') || {}).value || '',
          message: (form.querySelector('[name="Message"]') || {}).value || ''
        });
      } else {
        reqBody = new FormData(form);
      }

      fetch(endpoint, {
        method: 'POST',
        body: reqBody,
        headers: reqHeaders
      }).then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      }).then(function (resObj) {
        if (resObj.ok) {
          form.reset();
          if (isApplyEndpoint) {
            showStatus('ok', 'Thank you for applying! We have received your application. A confirmation email has been sent to your inbox. If your background matches our requirements, we will contact you directly.');
          } else {
            showStatus('ok', 'Thank you. Your message has reached the CHOLD Initiative team — we typically respond within three working days.');
          }
        } else {
          showStatus('err', (resObj.data && resObj.data.error) ? resObj.data.error : 'Something went wrong sending your message. Please email info@choldinitiative.org instead.');
        }
      }).catch(function (err) {
        console.warn('Form submit error:', err);
        showStatus('err', 'We could not reach the server. Please check your connection or email info@choldinitiative.org.');
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = original; }
      });
    });

    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field && field.classList.contains('has-error')) clearError(field);
      });
    });
  });

  /* ------------------------------------------------------------------
     Back to top
     ------------------------------------------------------------------ */
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------------
     Current year in footer
     ------------------------------------------------------------------ */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
