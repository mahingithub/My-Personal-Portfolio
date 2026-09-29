(() => {
  'use strict';

  /* ---------------------------------------------------------------------
   * Data (see js/projects.js)
   * ------------------------------------------------------------------- */
  const data = window.PORTFOLIO || { categories: [], projects: [] };
  const params = new URLSearchParams(location.search);
  const showDrafts = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || params.has('drafts');
  const draftQuery = params.has('drafts') ? '&drafts' : '';

  const projects = data.projects.filter(project => showDrafts || !project.draft);
  const published = data.projects.filter(project => !project.draft);
  // Concept work (`demo: true`) is always labelled and never counted as a real project.
  const realProjects = published.filter(project => !project.demo);
  const concepts = published.filter(project => project.demo);
  const categoryById = Object.fromEntries(data.categories.map(category => [category.id, category]));
  const categories = data.categories
    .map(category => ({ ...category, projects: projects.filter(project => project.category === category.id) }))
    .filter(category => category.projects.length);

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icon = name => `<svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg#${name}"/></svg>`;
  const pad = number => String(number).padStart(2, '0');
  const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
  const countLabel = list => {
    const real = list.filter(project => !project.demo).length;
    const concept = list.length - real;
    return [real && plural(real, 'project'), concept && plural(concept, 'concept')].filter(Boolean).join(' · ');
  };
  const projectUrl = project => `project.html?p=${encodeURIComponent(project.slug)}${draftQuery}`;
  const glow = project => escapeHtml(project.accent || '#7ee2b8');
  const siteLabel = project => {
    if (project.domain) return project.domain;
    try { return new URL(project.links.live).host; } catch { return project.name; }
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------------------------------------------------------------
   * Contact details (see js/contact.js)
   * ------------------------------------------------------------------- */
  const contact = window.CONTACT || {};
  const digitsOnly = value => String(value || '').replace(/\D/g, '');
  const whatsappUrl = text => contact.whatsapp ? `https://wa.me/${digitsOnly(contact.whatsapp)}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '';
  const greeting = project => project
    ? `Hi ${contact.name || 'there'}! I saw ${project.name} on your portfolio. I’d like something like it for my business, a premium version.`
    : `Hi ${contact.name || 'there'}! I found you through your portfolio and I’d like to talk about a project.`;
  // The project this page is about (case study pages), so messages can mention it.
  let pageProject = null;
  // The project brief on the homepage, with a project already picked as the reference.
  const briefUrl = project => `index.html${project ? `?ref=${encodeURIComponent(project.slug)}` : ''}#contact`;

  // Where the contact API runs: the backend on Render (it also works when Render serves these pages).
  const BACKEND_URL = 'https://my-personal-portfolio-lzff.onrender.com';

  const contactChannels = project => [
    contact.whatsapp && { id: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp', detail: 'Chat with me now', href: whatsappUrl(greeting(project)), external: true },
    contact.phone && { id: 'call', icon: 'call', label: 'Call me', detail: contact.phoneLabel || contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, '')}`, copy: contact.phoneLabel || contact.phone },
    contact.messenger && { id: 'messenger', icon: 'messenger', label: 'Messenger', detail: 'Message me on Facebook', href: `https://m.me/${encodeURIComponent(contact.messenger)}`, external: true },
    contact.email && { id: 'email', icon: 'mail', label: 'Email', detail: contact.email, href: `mailto:${contact.email}?subject=${encodeURIComponent(project ? `A project like ${project.name}` : 'A new project')}`, copy: contact.email },
  ].filter(Boolean);

  const socialLinks = () => [['linkedin', 'LinkedIn'], ['facebook', 'Facebook'], ['instagram', 'Instagram'], ['telegram', 'Telegram'], ['github', 'GitHub']]
    .filter(([key]) => /^https:\/\//.test(contact[key] || ''))
    .map(([key, label]) => `<a class="social" href="${escapeHtml(contact[key])}" target="_blank" rel="noopener noreferrer" aria-label="${label}">${icon(key)}</a>`)
    .join('');

  /* ---------------------------------------------------------------------
   * Shared markup
   * ------------------------------------------------------------------- */
  const screenshot = (project, eager = false) => {
    if (project.cover) {
      return `<img src="${escapeHtml(project.cover.src)}" alt="${escapeHtml(project.cover.alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
    }
    const category = categoryById[project.category] || {};
    const hint = project.draft ? '<span>Add a screenshot in <code>js/projects.js</code></span>' : '';
    return `<div class="placeholder-shot">${icon(category.icon || 'image')}${hint}</div>`;
  };

  const browser = (project, eager = false) => `
    <div class="browser">
      <div class="browser-bar" aria-hidden="true"><i></i><i></i><i></i><span>${escapeHtml(siteLabel(project))}</span></div>
      <div class="browser-view">${screenshot(project, eager)}</div>
    </div>`;

  const workCard = (project, index = 0) => {
    const category = categoryById[project.category] || {};
    const url = projectUrl(project);
    const live = project.links?.live;
    return `
      <article class="work-card reveal${project.draft ? ' is-draft' : ''}" data-category="${escapeHtml(project.category)}" style="--d:${index % 2}">
        <a class="work-media" href="${url}" style="--glow:${glow(project)}" data-tilt="6" data-cursor="View project" tabindex="-1" aria-hidden="true">
          <span class="chip">${icon(category.icon)}${escapeHtml(category.short)}${project.demo ? ' · Concept' : ''}</span>
          ${project.draft ? '<span class="draft-badge">Draft · only visible to you</span>' : ''}
          ${browser(project)}
        </a>
        <div class="work-body">
          <p class="work-type"><span>${escapeHtml(project.type)}</span><span>${escapeHtml(project.year)}</span></p>
          <h3><a href="${url}">${escapeHtml(project.name)}</a></h3>
          <p>${escapeHtml(project.summary)}</p>
          <ul class="tag-list" aria-label="Built with">${(project.stack || []).slice(0, 4).map(tech => `<li>${escapeHtml(tech)}</li>`).join('')}</ul>
          <div class="work-actions">
            <a class="text-link" href="${url}">${project.demo ? 'View design concept' : 'View case study'} ${icon('arrow-right')}</a>
            ${live ? `<a class="text-link text-link-muted" href="${escapeHtml(live)}" target="_blank" rel="noopener noreferrer">Visit live site ${icon('arrow-up-right')}</a>` : ''}
          </div>
        </div>
      </article>`;
  };

  /* ---------------------------------------------------------------------
   * Motion helpers: reveal on scroll, tilt on hover
   * ------------------------------------------------------------------- */
  const revealObserver = 'IntersectionObserver' in window && !reduceMotion
    ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        element.classList.add('is-in');
        revealObserver.unobserve(element);
        // Drop the stagger delay once the element has arrived, so hover effects respond instantly.
        const delay = Number(getComputedStyle(element).getPropertyValue('--d')) || 0;
        window.setTimeout(() => element.classList.add('is-done'), 1000 + delay * 80);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    : null;

  const reveal = (root = document) => {
    root.querySelectorAll('.reveal:not(.is-in)').forEach(element => {
      if (revealObserver) revealObserver.observe(element);
      else element.classList.add('is-in', 'is-done');
    });
  };

  const bindTilt = (root = document) => {
    if (!finePointer || reduceMotion) return;
    root.querySelectorAll('[data-tilt]:not([data-tilt-ready])').forEach(element => {
      element.dataset.tiltReady = '';
      const max = Number(element.dataset.tilt) || 8;
      let bounds = null;
      element.addEventListener('pointerenter', () => { bounds = element.getBoundingClientRect(); });
      element.addEventListener('pointermove', event => {
        bounds ||= element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        element.classList.add('is-tilting');
        element.style.setProperty('--tx', `${((0.5 - y) * max).toFixed(2)}deg`);
        element.style.setProperty('--ty', `${((x - 0.5) * max).toFixed(2)}deg`);
        element.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        element.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      });
      element.addEventListener('pointerleave', () => {
        bounds = null;
        element.classList.remove('is-tilting');
        element.style.setProperty('--tx', '0deg');
        element.style.setProperty('--ty', '0deg');
      });
    });
  };

  // Counts a number up from zero, keeping any text around it: "3 apps" runs 0 → 3 apps.
  const counting = new WeakMap();
  const countUp = (element, { delay = 0, duration = 1300 } = {}) => {
    element.dataset.countTo ??= element.textContent;
    const final = element.dataset.countTo;
    const match = /^(\D*?)(\d+(?:\.\d+)?)(.*)$/s.exec(final);
    if (!match || reduceMotion) return;
    const [, before, number, after] = match;
    const target = Number(number);
    const decimals = (number.split('.')[1] || '').length;
    const start = performance.now() + delay;
    cancelAnimationFrame(counting.get(element));
    const step = now => {
      const progress = Math.min(Math.max((now - start) / duration, 0), 1);
      const eased = 1 - (1 - progress) ** 4;
      element.textContent = progress < 1 ? `${before}${(target * eased).toFixed(decimals)}${after}` : final;
      if (progress < 1) counting.set(element, requestAnimationFrame(step));
    };
    counting.set(element, requestAnimationFrame(step));
  };

  const enhance = root => {
    reveal(root);
    bindTilt(root);
  };

  /* ---------------------------------------------------------------------
   * Navigation
   * ------------------------------------------------------------------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('main-nav');
  const closeMenu = () => {
    if (!menuToggle || !navigation) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    navigation.classList.remove('is-open');
  };
  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navigation?.classList.toggle('is-open', !isOpen);
  });
  navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuToggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (navigation && !navigation.contains(event.target) && !menuToggle?.contains(event.target)) closeMenu();
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', closeMenu);

  // Highlight the section in view (homepage only — other pages mark their link statically).
  const highlightOnScroll = (links, sections, attribute) => {
    if (!('IntersectionObserver' in window) || !links.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          const active = link.hash === `#${entry.target.id}`;
          if (attribute === 'class') link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', attribute === 'class' ? 'location' : 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(section => observer.observe(section));
  };
  if (document.getElementById('home')) {
    highlightOnScroll([...(navigation?.querySelectorAll('a') || [])], document.querySelectorAll('main section[id]'), 'class');
  }

  /* ---------------------------------------------------------------------
   * Homepage hero: 3D stage, stats and tech marquee
   * ------------------------------------------------------------------- */
  const hero = document.querySelector('[data-hero]');
  const heroStage = document.querySelector('[data-hero-stage]');
  const scene = document.querySelector('[data-scene]');
  if (hero && heroStage && scene) initHeroScene();

  function initHeroScene() {
    // The scene is designed at 760px wide; cards hang ~50px past each side, so fit 860px.
    const FIT_WIDTH = 860;
    const fit = () => scene.style.setProperty('--scale', (heroStage.clientWidth / FIT_WIDTH).toFixed(4));
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(heroStage);
    else window.addEventListener('resize', fit);

    if (reduceMotion) return;

    // Pointer: the scene eases toward the cursor, and a soft light follows it.
    const RANGE = 7;
    const target = { x: 0, y: 0, scroll: 0 };
    const current = { x: 0, y: 0, scroll: 0 };
    let frame = 0;
    const tick = () => {
      current.x += (target.x - current.x) * 0.075;
      current.y += (target.y - current.y) * 0.075;
      current.scroll += (target.scroll - current.scroll) * 0.12;
      scene.style.setProperty('--ry', `${current.x.toFixed(3)}deg`);
      scene.style.setProperty('--rx', `${current.y.toFixed(3)}deg`);
      scene.style.setProperty('--sp', current.scroll.toFixed(4));
      const settled = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) + Math.abs(target.scroll - current.scroll) < 0.002;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };

    if (finePointer) {
      hero.addEventListener('pointermove', event => {
        const bounds = hero.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        target.x = (x - 0.5) * 2 * RANGE;
        target.y = (0.5 - y) * 2 * RANGE * 0.7;
        hero.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        hero.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        wake();
      });
      hero.addEventListener('pointerleave', () => {
        target.x = 0;
        target.y = 0;
        wake();
      });
    }

    // Scroll: the stage tips back as the hero leaves the screen.
    const onScroll = () => {
      target.scroll = Math.min(Math.max(window.scrollY / (hero.offsetHeight || 1), 0), 1);
      wake();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const heroStats = document.querySelector('[data-hero-stats]');
  const technologies = [...new Set(realProjects.flatMap(project => project.stack || []))];
  if (heroStats && realProjects.length) {
    const industries = new Set(realProjects.map(project => project.category)).size;
    heroStats.innerHTML = [
      [industries, industries === 1 ? 'Industry' : 'Industries'],
      [realProjects.length, realProjects.length === 1 ? 'Project' : 'Projects'],
      ...(concepts.length ? [[concepts.length, concepts.length === 1 ? 'UI concept' : 'UI concepts']] : []),
      [technologies.length, 'Technologies used'],
    ].map(([value, label]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
    heroStats.hidden = false;
    // Wait for the page transition curtain, if there is one, before counting.
    const arrived = document.documentElement.classList.contains('pt-in');
    heroStats.querySelectorAll('dd').forEach((value, index) => countUp(value, { delay: (arrived ? 700 : 350) + index * 120 }));
  }

  const marquee = document.querySelector('[data-stack-marquee]');
  if (marquee && technologies.length) {
    const list = technologies.map(tech => `<li>${escapeHtml(tech)}</li>`).join('');
    // Two identical lists make the loop seamless; the copy is hidden from screen readers.
    marquee.innerHTML = `<ul>${list}</ul><ul aria-hidden="true">${list}</ul>`;
  }

  /* ---------------------------------------------------------------------
   * Homepage: industries and work grid
   * ------------------------------------------------------------------- */
  const industryGrid = document.getElementById('industry-grid');
  if (industryGrid) {
    const cards = categories.map((category, index) => `
      <a class="industry-card reveal" href="work.html#${category.id}" data-tilt="8" style="--d:${index}">
        <span class="industry-top"><span class="industry-icon">${icon(category.icon)}</span><span class="industry-index">${pad(index + 1)}</span></span>
        <h3>${escapeHtml(category.name)}</h3>
        <p>${escapeHtml(category.blurb)}</p>
        <span class="industry-count">${countLabel(category.projects)} ${icon('arrow-right')}</span>
      </a>`);
    cards.push(`
      <a class="industry-card industry-card-cta reveal" href="#contact" data-tilt="8" style="--d:${categories.length}">
        <span class="industry-top"><span class="industry-icon">${icon('spark')}</span></span>
        <h3>Your industry next?</h3>
        <p>New sector, same care. Tell me how your business works and I’ll plan the site around it.</p>
        <span class="industry-count">Start a conversation ${icon('arrow-right')}</span>
      </a>`);
    industryGrid.innerHTML = cards.join('');
    const total = cards.length;
    industryGrid.style.setProperty('--cols', total <= 4 ? total : total % 4 === 0 ? 4 : 3);
  }

  /* ---------------------------------------------------------------------
   * Homepage: featured work spotlight and "See all projects"
   * ------------------------------------------------------------------- */
  // To choose the featured projects, add `featured: true` to their entries in js/projects.js.
  // Until any are marked, the first three published client projects with a screenshot are used.
  const withCover = published.filter(project => project.cover);
  const marked = withCover.filter(project => project.featured);
  const featured = marked.length ? marked.slice(0, 5) : withCover.filter(project => !project.demo).slice(0, 3);

  const spotlight = document.getElementById('spotlight');
  if (spotlight) {
    if (featured.length) initSpotlight();
    else spotlight.parentElement.hidden = true;
  }

  function initSpotlight() {
    const count = featured.length;
    const autoplay = count > 1 && !reduceMotion;

    const tab = (project, index) => `
      <button class="spot-tab" type="button" role="tab" id="spot-tab-${index}" aria-controls="spot-panel-${index}" aria-selected="false" tabindex="-1" style="--tab-accent:${glow(project)}">
        <span class="spot-tab-index">${pad(index + 1)}</span>
        <span class="spot-tab-label"><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(categoryById[project.category]?.short)}</small></span>
        <span class="spot-tab-progress" aria-hidden="true"><i></i></span>
      </button>`;

    const card = (project, index) => `
      <a class="spot-card" href="${projectUrl(project)}" tabindex="-1" data-index="${index}" style="--glow:${glow(project)}">
        <span class="spot-tag">${icon(categoryById[project.category]?.icon)}${escapeHtml(project.name)}</span>
        ${browser(project, index === 0)}
        <span class="spot-shine"><i></i></span>
      </a>`;

    const phone = (project, index) => project.mobile ? `
      <div class="spot-phone" data-index="${index}"><div class="device-phone"><img src="${escapeHtml(project.mobile.src)}" alt="" loading="lazy" decoding="async"></div></div>` : '';

    const panel = (project, index) => {
      const category = categoryById[project.category] || {};
      const live = project.links?.live;
      const stack = project.stack || [];
      const words = String(project.headline || project.name).split(/\s+/);
      let step = 0;
      const stagger = () => `style="--s:${step++}"`;
      return `
        <div class="spot-panel" role="tabpanel" id="spot-panel-${index}" aria-labelledby="spot-tab-${index}">
          <p class="spot-kicker" ${stagger()}><span class="spot-pill">${icon(category.icon)}${escapeHtml(category.name)}</span>${project.status ? `<span class="spot-status"><span class="status-dot"></span>${escapeHtml(project.status)}</span>` : ''}</p>
          <h3 class="spot-title" ${stagger()} aria-label="${escapeHtml(words.join(' '))}"><span aria-hidden="true">${words.map((word, i) => `<span class="w"><span style="--i:${i}">${escapeHtml(word)}</span></span>`).join(' ')}</span></h3>
          <p class="spot-summary" ${stagger()}>${escapeHtml(project.summary)}</p>
          ${project.stats?.length
            ? `<ul class="spot-stats" ${stagger()}>${project.stats.slice(0, 3).map(stat => `<li><strong data-count>${escapeHtml(stat.value)}</strong><span>${escapeHtml(stat.label)}</span></li>`).join('')}</ul>`
            : `<dl class="spot-meta" ${stagger()}><div><dt>Type</dt><dd>${escapeHtml(project.type)}</dd></div><div><dt>My role</dt><dd>${escapeHtml(project.role)}</dd></div></dl>`}
          <ul class="tag-list" ${stagger()} aria-label="Built with">${stack.slice(0, 5).map(tech => `<li>${escapeHtml(tech)}</li>`).join('')}${stack.length > 5 ? `<li>+${stack.length - 5} more</li>` : ''}</ul>
          <div class="spot-actions" ${stagger()}>
            <a class="button button-primary" href="${projectUrl(project)}">View case study<span class="visually-hidden">: ${escapeHtml(project.name)}</span> ${icon('arrow-right')}</a>
            ${live ? `<a class="button button-ghost" href="${escapeHtml(live)}" target="_blank" rel="noopener noreferrer">Visit live site ${icon('arrow-up-right')}</a>` : ''}
          </div>
          <p class="spot-more" ${stagger()}><a class="text-link" href="${briefUrl(project)}" data-brief-ref="${escapeHtml(project.slug)}">Want one like this? Let’s plan yours ${icon('arrow-right')}</a></p>
        </div>`;
    };

    spotlight.innerHTML = `
      <div class="spot-bar"${count < 2 ? ' hidden' : ''}>
        <div class="spot-tabs" role="tablist" aria-label="Featured projects">${featured.map(tab).join('')}</div>
        ${autoplay ? '<button class="spot-toggle" type="button" aria-label="Pause the slideshow"><i aria-hidden="true"></i></button>' : ''}
      </div>
      <div class="spot-body">
        <div class="spot-stage" aria-hidden="true">
          <div class="spot-glow"></div>
          <div class="spot-deck">${featured.map(card).join('')}${featured.map(phone).join('')}</div>
        </div>
        <div class="spot-panels">${featured.map(panel).join('')}</div>
      </div>`;
    spotlight.style.setProperty('--spot-duration', '7s');
    spotlight.classList.toggle('is-autoplay', autoplay);

    const tabList = spotlight.querySelector('[role="tablist"]');
    const tabs = [...spotlight.querySelectorAll('[role="tab"]')];
    const panels = [...spotlight.querySelectorAll('[role="tabpanel"]')];
    const stage = spotlight.querySelector('.spot-stage');
    const deck = spotlight.querySelector('.spot-deck');
    const cards = [...spotlight.querySelectorAll('.spot-card')];
    const phones = [...spotlight.querySelectorAll('.spot-phone')];
    const toggle = spotlight.querySelector('.spot-toggle');
    let active = -1;
    let seen = false;

    const replay = (element, className) => {
      element.classList.remove(className);
      void element.offsetWidth; // restart the CSS animation
      element.classList.add(className);
    };

    const select = (requested, { focus = false } = {}) => {
      const index = (requested + count) % count;
      if (index === active) return;
      const previous = active;
      active = index;

      spotlight.style.setProperty('--spot-accent', featured[index].accent || '#7ee2b8');
      tabs.forEach((item, i) => {
        item.setAttribute('aria-selected', String(i === index));
        item.tabIndex = i === index ? 0 : -1;
      });
      if (focus) tabs[index].focus();
      // On narrow screens the tabs scroll sideways; keep the current one in view without moving the page.
      if (tabList.scrollWidth > tabList.clientWidth) {
        tabList.scrollTo({ left: tabs[index].offsetLeft - (tabList.clientWidth - tabs[index].offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      panels.forEach((item, i) => item.classList.toggle('is-active', i === index));

      // The deck: the chosen card comes to the front, the others line up behind it.
      cards.forEach((item, i) => {
        const depth = (i - index + count) % count;
        item.style.setProperty('--k', depth);
        item.classList.toggle('is-front', depth === 0);
        item.classList.toggle('is-far', depth > 2);
        item.dataset.cursor = depth === 0 ? 'View case study' : 'Bring forward';
      });
      phones.forEach(item => item.classList.toggle('is-active', Number(item.dataset.index) === index));

      if (previous >= 0 && !reduceMotion) {
        replay(cards[previous], 'is-leaving');
        replay(cards[index], 'is-arriving');
      }
      if (seen) panels[index].querySelectorAll('[data-count]').forEach(value => countUp(value, { delay: 380, duration: 1100 }));
    };

    // Autoplay runs only while the spotlight is on screen and nobody is hovering, focusing or has paused it.
    const state = { visible: false, hover: false, focus: false, paused: false };
    const sync = () => spotlight.classList.toggle('is-running', autoplay && state.visible && !state.hover && !state.focus && !state.paused && !document.hidden);
    spotlight.addEventListener('animationend', event => {
      if (event.animationName === 'spot-progress') select(active + 1);
      if (event.animationName === 'spot-leave') event.target.classList.remove('is-leaving');
      if (event.animationName === 'spot-shine') event.target.closest('.spot-card')?.classList.remove('is-arriving');
    });
    spotlight.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { state.hover = true; sync(); } });
    spotlight.addEventListener('pointerleave', () => { state.hover = false; sync(); });
    spotlight.addEventListener('focusin', event => { state.focus = event.target.matches(':focus-visible'); sync(); });
    spotlight.addEventListener('focusout', event => { if (!spotlight.contains(event.relatedTarget)) { state.focus = false; sync(); } });
    document.addEventListener('visibilitychange', sync);
    toggle?.addEventListener('click', () => {
      state.paused = !state.paused;
      toggle.classList.toggle('is-paused', state.paused);
      toggle.setAttribute('aria-label', state.paused ? 'Play the slideshow' : 'Pause the slideshow');
      sync();
    });

    const onFirstView = () => {
      seen = true;
      spotlight.classList.add('is-seen', 'is-intro');
      window.setTimeout(() => spotlight.classList.remove('is-intro'), 1600);
      panels[active].querySelectorAll('[data-count]').forEach(value => countUp(value, { delay: 600 }));
    };
    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver(([entry]) => {
        state.visible = entry.isIntersecting;
        if (state.visible && !seen) onFirstView();
        sync();
      }, { threshold: 0.3 }).observe(spotlight);
    } else {
      seen = true;
      spotlight.classList.add('is-seen');
    }

    tabList.addEventListener('click', event => {
      const item = event.target.closest('[role="tab"]');
      if (item) select(tabs.indexOf(item));
    });
    tabList.addEventListener('keydown', event => {
      const moves = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: count - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      select(moves[event.key], { focus: true });
    });

    // A card at the back comes forward when clicked; the front card opens its case study.
    let swiped = false;
    stage.addEventListener('click', event => {
      const item = event.target.closest('.spot-card');
      if (!item) return;
      if (swiped || !item.classList.contains('is-front')) {
        event.preventDefault();
        if (!swiped) select(Number(item.dataset.index));
      }
      swiped = false;
    });

    // Swipe between projects on touch screens.
    let swipeStart = null;
    stage.addEventListener('pointerdown', event => {
      swiped = false;
      swipeStart = event.pointerType === 'mouse' ? null : event.clientX;
    });
    stage.addEventListener('pointerup', event => {
      if (swipeStart === null) return;
      const distance = event.clientX - swipeStart;
      swipeStart = null;
      if (Math.abs(distance) < 40) return;
      swiped = true;
      select(active + (distance < 0 ? 1 : -1));
    });

    // The deck leans toward the pointer.
    if (finePointer && !reduceMotion) {
      const target = { x: 0, y: 0 };
      const current = { x: 0, y: 0 };
      let frame = 0;
      const tick = () => {
        current.x += (target.x - current.x) * 0.08;
        current.y += (target.y - current.y) * 0.08;
        deck.style.setProperty('--ry', `${current.x.toFixed(3)}deg`);
        deck.style.setProperty('--rx', `${current.y.toFixed(3)}deg`);
        frame = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) < 0.01 ? 0 : requestAnimationFrame(tick);
      };
      stage.addEventListener('pointermove', event => {
        const bounds = stage.getBoundingClientRect();
        target.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
        target.y = (0.5 - (event.clientY - bounds.top) / bounds.height) * 8;
        if (!frame) frame = requestAnimationFrame(tick);
      });
      stage.addEventListener('pointerleave', () => {
        target.x = 0;
        target.y = 0;
        if (!frame) frame = requestAnimationFrame(tick);
      });
    }

    select(0);
  }

  const seeAll = document.getElementById('see-all');
  if (seeAll) {
    const covers = [...projects.filter(project => project.cover && !featured.includes(project)), ...featured].slice(0, 3);
    const industries = `${categories.length} ${categories.length === 1 ? 'industry' : 'industries'}`;
    const summary = [countLabel(projects), industries].filter(Boolean).join(' · ');
    const names = projects.map(project => escapeHtml(project.name)).join(' <i>•</i> ');
    const roll = text => [...text].map((char, index) => char === ' '
      ? ' '
      : `<span class="roll-char"><span data-char="${escapeHtml(char)}" style="--i:${index}">${escapeHtml(char)}</span></span>`).join('');
    seeAll.innerHTML = `
      <a class="see-all" href="work.html" aria-label="See all projects: ${escapeHtml(summary)}" data-magnetic="0.22" data-pt-label="All projects">
        <span class="see-all-ticker" aria-hidden="true" style="--ticker-duration:${Math.max(24, projects.length * 6)}s"><span>${names} <i>•</i> </span><span>${names} <i>•</i> </span></span>
        <span class="see-all-stack" aria-hidden="true">${covers.map(project => `<span><img src="${escapeHtml(project.cover.src)}" alt="" loading="lazy" decoding="async"></span>`).join('')}</span>
        <span class="see-all-copy" aria-hidden="true"><strong>${roll('See all projects')}</strong><small>${escapeHtml(summary)}</small></span>
        <span class="see-all-go" data-magnetic-item aria-hidden="true">${icon('arrow-right')}${icon('arrow-right')}</span>
      </a>`;
  }

  /* ---------------------------------------------------------------------
   * Work page: every project, grouped by industry
   * ------------------------------------------------------------------- */
  const catalog = document.getElementById('work-catalog');
  const jumpLinks = document.getElementById('jump-links');
  if (catalog && jumpLinks) {
    jumpLinks.innerHTML = categories
      .map(category => `<li><a href="#${category.id}">${icon(category.icon)}${escapeHtml(category.name)} <span>${category.projects.length}</span></a></li>`)
      .join('');
    catalog.innerHTML = categories.map((category, index) => `
      <section class="industry-section" id="${category.id}" aria-labelledby="${category.id}-title">
        <div class="industry-intro reveal">
          <span class="industry-icon">${icon(category.icon)}</span>
          <p class="industry-index">${pad(index + 1)} / ${pad(categories.length)} · ${countLabel(category.projects)}</p>
          <h2 id="${category.id}-title">${escapeHtml(category.name)}</h2>
          <p>${escapeHtml(category.blurb)}</p>
          ${category.offer?.length ? `<h3>Typical projects</h3><ul class="offer-list">${category.offer.map(item => `<li>${icon('check')}${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
          <a class="text-link" href="index.html#contact">Start a project like this ${icon('arrow-up-right')}</a>
        </div>
        <div class="industry-projects">${category.projects.map(workCard).join('')}</div>
      </section>`).join('');

    // Content is rendered after load, so honour a #industry link manually.
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'instant' });
    highlightOnScroll([...jumpLinks.querySelectorAll('a')], catalog.querySelectorAll('.industry-section'), 'aria');
  }

  /* ---------------------------------------------------------------------
   * Case study page: project.html?p=<slug>
   * ------------------------------------------------------------------- */
  const caseStudy = document.getElementById('case-study');
  if (caseStudy) renderCaseStudy();

  function renderCaseStudy() {
    const project = projects.find(item => item.slug === params.get('p'));
    if (!project) {
      document.title = 'Project not found · Asraf Alom';
      caseStudy.innerHTML = `
        <section class="container page-hero not-found">
          <p class="eyebrow"><span class="section-dash"></span> Project not found</p>
          <h1>That project isn’t here.</h1>
          <p class="lead">It may have moved or been renamed. Every published project is on the work page.</p>
          <a class="button button-primary" href="work.html">Browse all work ${icon('arrow-right')}</a>
        </section>`;
      return;
    }

    pageProject = project;
    const category = categoryById[project.category] || {};
    const links = project.links || {};
    const gallery = project.gallery || [];
    const others = projects.filter(item => item !== project);
    const next = others.length ? projects[(projects.indexOf(project) + 1) % projects.length] : null;
    const nextCategory = next ? categoryById[next.category] || {} : null;

    document.title = `${project.name} · ${category.name || 'Project'} · Asraf Alom`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', project.summary);

    let sectionNumber = 0;
    const section = (title, body, { intro = '', wide = false } = {}) => `
      <section class="case-section${wide ? ' case-section-wide' : ''} container">
        <div class="case-label reveal"><div><span>${pad(++sectionNumber)}</span><h2>${title}</h2></div>${intro ? `<p>${intro}</p>` : ''}</div>
        <div class="case-body reveal" style="--d:1">${body}</div>
      </section>`;

    const sections = [];
    if (project.challenge || project.solution) {
      sections.push(section('The brief', `
        <div class="brief-grid">
          ${project.challenge ? `<div><h3>The challenge</h3><p>${escapeHtml(project.challenge)}</p></div>` : ''}
          ${project.solution ? `<div><h3>${project.demo ? 'Design direction' : 'The solution'}</h3><p>${escapeHtml(project.solution)}</p></div>` : ''}
        </div>`));
    }
    if (project.process?.length) {
      sections.push(section('How I built it', `
        <ol class="steps">${project.process.map((step, index) => `
          <li><span class="step-number">${pad(index + 1)}</span><div><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></div></li>`).join('')}
        </ol>`));
    }
    if (project.features?.length) {
      sections.push(section(project.demo ? 'Proposed features' : 'What it does', `
        <div class="feature-grid">${project.features.map(feature => `
          <article class="feature"><h3>${escapeHtml(feature.title)}</h3><p>${escapeHtml(feature.text)}</p></article>`).join('')}
        </div>`));
    }
    if (gallery.length) {
      sections.push(section(project.demo ? 'Design preview' : 'The result', `
        <div class="gallery${gallery.length === 1 ? ' gallery-single' : gallery.length % 3 === 0 && gallery.length > 3 ? ' gallery-three' : ''}" style="--glow:${glow(project)}">${gallery.map((shot, index) => `
          <figure>
            <button class="shot${/mobile/.test(shot.src) ? ' shot-tall' : ''}" type="button" data-shot="${index}" data-tilt="5" aria-label="View larger: ${escapeHtml(shot.caption || shot.alt)}">
              <img src="${escapeHtml(shot.src)}" alt="${escapeHtml(shot.alt)}" loading="lazy" decoding="async">
            </button>
            <figcaption><span>${pad(index + 1)}</span>${escapeHtml(shot.caption || '')}</figcaption>
          </figure>`).join('')}
        </div>`, { wide: true, intro: `Select any screen to see it full size.${project.galleryNote ? ` ${escapeHtml(project.galleryNote)}` : ''}` }));
    }
    if (project.stack?.length) {
      sections.push(section('Built with', `
        <ul class="stack-list">${project.stack.map(tech => `<li>${escapeHtml(tech)}</li>`).join('')}</ul>
        ${links.source ? `<a class="text-link" href="${escapeHtml(links.source)}" target="_blank" rel="noopener noreferrer">Explore the source code on GitHub ${icon('arrow-up-right')}</a>` : ''}`));
    }

    const liveToolbar = links.live ? `
      <div class="showcase-toolbar">
        <div class="segmented" role="group" aria-label="Preview">
          <button type="button" data-mode="shots" aria-pressed="true">${icon('image')}Screenshot</button>
          <button type="button" data-mode="live" aria-pressed="false">${icon('play')}Try it live</button>
        </div>
        <div class="segmented" role="group" aria-label="Screen size" data-device-group hidden>
          <button type="button" data-device="desktop" aria-pressed="true">${icon('monitor')}Desktop</button>
          <button type="button" data-device="mobile" aria-pressed="false">${icon('phone')}Mobile</button>
        </div>
        <a class="text-link" href="${escapeHtml(links.live)}" target="_blank" rel="noopener noreferrer">Open in a new tab ${icon('arrow-up-right')}</a>
      </div>` : '';

    caseStudy.innerHTML = `
      <article>
        <section class="case-hero container" aria-labelledby="case-title">
          <nav class="crumbs" aria-label="Breadcrumb"><ol>
            <li><a href="work.html">Work</a></li>
            <li><a href="work.html#${escapeHtml(project.category)}">${escapeHtml(category.name)}</a></li>
            <li aria-current="page">${escapeHtml(project.name)}</li>
          </ol></nav>
          ${project.draft ? '<p class="draft-note"><strong>Draft preview.</strong> Only you can see this page, because it is marked <code>draft: true</code> in <code>js/projects.js</code>. Add images, then remove that line to publish it.</p>' : ''}
          ${project.demo ? `<p class="concept-note"><strong>Independent UI concept.</strong> A design study for ${escapeHtml((category.name || 'this industry').toLowerCase())}, shown as static previews with illustrative content.</p>` : ''}
          <p class="eyebrow"><span class="industry-pill">${icon(category.icon)}${escapeHtml(category.name)}</span></p>
          <div class="case-heading">
            <h1 id="case-title">${escapeHtml(project.headline || project.name)}</h1>
            <div>
              <p class="lead">${escapeHtml(project.summary)}</p>
              <div class="case-actions">
                ${links.live ? `<a class="button button-primary" href="${escapeHtml(links.live)}" target="_blank" rel="noopener noreferrer">${escapeHtml(links.liveLabel || 'Visit the live site')} ${icon('arrow-up-right')}</a>` : ''}
                ${links.source ? `<a class="button button-ghost" href="${escapeHtml(links.source)}" target="_blank" rel="noopener noreferrer">${icon('github')}View the code</a>` : ''}
                <a class="button button-ghost" href="${briefUrl(project)}">${icon('spark')}Get one like this</a>
              </div>
            </div>
          </div>
          <dl class="case-meta">
            <div><dt>Project</dt><dd>${escapeHtml(project.name)}</dd></div>
            <div><dt>Type</dt><dd>${escapeHtml(project.type)}</dd></div>
            <div><dt>My role</dt><dd>${escapeHtml(project.role)}</dd></div>
            <div><dt>Year</dt><dd>${escapeHtml(project.year)}</dd></div>
            <div><dt>Status</dt><dd><span class="status-pill">${escapeHtml(project.status)}</span></dd></div>
          </dl>
        </section>

        <section class="showcase container" aria-label="Project preview">
          ${liveToolbar}
          <div class="showcase-stage" style="--glow:${glow(project)}" data-mode="shots" data-device="desktop">
            <div class="showcase-scene">
              ${browser(project, true)}
              ${project.mobile ? `<div class="phone"><div class="device-phone"><img src="${escapeHtml(project.mobile.src)}" alt="${escapeHtml(project.mobile.alt)}" loading="lazy" decoding="async"></div></div>` : ''}
            </div>
          </div>
        </section>

        ${project.stats?.length ? `<div class="container"><ul class="stats">${project.stats.map((stat, index) => `<li class="reveal" style="--d:${index}"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(stat.label)}</span></li>`).join('')}</ul></div>` : ''}

        ${sections.join('')}

        <section class="container cta-band case-cta reveal" aria-labelledby="case-cta-title">
          <div>
            <p class="eyebrow"><span class="status-dot"></span> Like what you see?</p>
            <h2 id="case-cta-title">Want one like ${escapeHtml(project.name)}, made for your business?</h2>
            <p>Show me what you have in mind. I’ll reply with ideas for a premium version, a clear plan and a quote.</p>
          </div>
          <div class="cta-actions">
            ${contact.whatsapp ? `<a class="button button-primary" href="${escapeHtml(whatsappUrl(greeting(project)))}" target="_blank" rel="noopener noreferrer">${icon('whatsapp')}Ask on WhatsApp</a>` : ''}
            <a class="button ${contact.whatsapp ? 'button-ghost' : 'button-primary'}" href="${briefUrl(project)}">Plan it with me ${icon('arrow-right')}</a>
          </div>
        </section>

        ${next ? `
        <a class="next-project container" href="${projectUrl(next)}" data-cursor="Next project">
          <span><small>Next project · ${escapeHtml(nextCategory.name)}</small><strong>${escapeHtml(next.name)}</strong></span>
          <span class="next-thumb" style="--glow:${glow(next)}">${next.cover ? `<img src="${escapeHtml(next.cover.src)}" alt="" loading="lazy" decoding="async">` : ''}</span>
          <span class="next-arrow" aria-hidden="true">${icon('arrow-right')}</span>
        </a>` : ''}
      </article>`;

    initShowcase(project);
    initLightbox(gallery);
  }

  function initShowcase(project) {
    const stage = caseStudy.querySelector('.showcase-stage');
    const showcaseScene = stage?.querySelector('.showcase-scene');
    if (!stage || !showcaseScene) return;

    // The device follows the pointer while it is shown as a 3D mockup.
    if (finePointer && !reduceMotion) {
      stage.addEventListener('pointermove', event => {
        if (stage.dataset.mode === 'live') return;
        const bounds = stage.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        showcaseScene.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
        showcaseScene.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
      });
      stage.addEventListener('pointerleave', () => {
        showcaseScene.style.setProperty('--ry', '0deg');
        showcaseScene.style.setProperty('--rx', '0deg');
      });
    }

    const toolbar = caseStudy.querySelector('.showcase-toolbar');
    if (!toolbar) return;
    const deviceGroup = toolbar.querySelector('[data-device-group]');
    const barLabel = stage.querySelector('.browser-bar span');
    const shotLabel = barLabel.textContent;
    const liveLabel = siteLabel({ ...project, domain: '' });
    let frame = null;

    toolbar.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      button.parentElement.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));

      if (button.dataset.mode) {
        const live = button.dataset.mode === 'live';
        // In live mode the CSS turns the device to face the viewer.
        stage.dataset.mode = button.dataset.mode;
        deviceGroup.hidden = !live;
        barLabel.textContent = live ? liveLabel : shotLabel;
        if (live && !frame) {
          // Load the live site only when asked, so the page stays fast.
          frame = document.createElement('iframe');
          frame.src = project.links.live;
          frame.title = `${project.name}, live site`;
          frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
          stage.querySelector('.browser').append(frame);
        }
      }
      if (button.dataset.device) stage.dataset.device = button.dataset.device;
    });
  }

  function initLightbox(gallery) {
    const dialog = document.getElementById('lightbox');
    if (!dialog || !gallery.length || typeof dialog.showModal !== 'function') return;
    const image = dialog.querySelector('img');
    const caption = dialog.querySelector('figcaption');
    let current = 0;

    const show = index => {
      current = (index + gallery.length) % gallery.length;
      const shot = gallery[current];
      image.src = shot.src;
      image.alt = shot.alt;
      caption.textContent = `${pad(current + 1)} / ${pad(gallery.length)} · ${shot.caption || ''}`;
    };

    dialog.querySelectorAll('.lightbox-nav').forEach(button => { button.hidden = gallery.length < 2; });
    caseStudy.addEventListener('click', event => {
      const trigger = event.target.closest('[data-shot]');
      if (!trigger) return;
      show(Number(trigger.dataset.shot));
      dialog.showModal();
    });
    dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.lightbox-prev').addEventListener('click', () => show(current - 1));
    dialog.querySelector('.lightbox-next').addEventListener('click', () => show(current + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
    });
    // Clicking the dark background closes the viewer.
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
  }

  // Everything is rendered; animate it in and wire up the tilt effects.
  enhance(document);

  /* ---------------------------------------------------------------------
   * Page transitions: moving to another page sweeps a curtain out from
   * the click, named after where you're going. The next page lifts it
   * (see the inline script in each page's <head>).
   * ------------------------------------------------------------------- */
  const root = document.documentElement;
  if (root.classList.contains('pt-in')) window.setTimeout(() => root.classList.add('pt-done'), 1200);

  const pageKey = url => `${url.pathname.replace(/\/index\.html$/, '/')}${url.search}`;
  const internalPage = link => {
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return null;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/(\/|\.html)$/.test(url.pathname)) return null;
    return url;
  };

  const destination = (url, link) => {
    if (link.dataset.ptLabel) return { label: link.dataset.ptLabel };
    const page = url.pathname.split('/').pop() || 'index.html';
    if (page === 'project.html') {
      const project = data.projects.find(item => item.slug === url.searchParams.get('p'));
      if (project) return { label: project.name, color: project.accent };
    }
    if (page === 'work.html') return { label: categoryById[url.hash.slice(1)]?.name || 'All projects' };
    if (url.hash === '#contact') return { label: 'Let’s talk' };
    return { label: 'Asraf Alom' };
  };

  let leaving = false;
  if (!reduceMotion) {
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href]');
      const url = internalPage(link);
      if (!url || pageKey(url) === pageKey(location)) return;
      event.preventDefault();
      if (leaving) return;
      leaving = true;

      const { label, color } = destination(url, link);
      const accent = /^#[\da-f]{3,8}$/i.test(color || '') ? color : '#7ee2b8';
      // Keyboard activation has no pointer position, so start from the link itself.
      const bounds = link.getBoundingClientRect();
      const x = event.detail ? event.clientX : bounds.left + bounds.width / 2;
      const y = event.detail ? event.clientY : bounds.top + bounds.height / 2;

      const curtain = document.createElement('div');
      curtain.className = 'pt';
      curtain.setAttribute('aria-hidden', 'true');
      curtain.style.cssText = `--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;--pt-color:${accent}`;
      curtain.innerHTML = `<span class="pt-label">${escapeHtml(label)}</span>`;
      document.body.append(curtain);
      try { sessionStorage.setItem('pt', JSON.stringify({ label, color: accent, at: Date.now() })); } catch { /* private mode */ }

      let gone = false;
      const go = () => {
        if (gone) return;
        gone = true;
        location.assign(url.href);
      };
      curtain.addEventListener('animationend', event => { if (event.animationName === 'pt-cover') go(); });
      window.setTimeout(go, 800);
    });
  }

  // Coming back with the browser's Back button can restore this page mid-transition.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    leaving = false;
    document.querySelectorAll('.pt').forEach(curtain => curtain.remove());
  });

  // Fetch the next page while the visitor is still deciding, so it opens instantly.
  const prefetched = new Set();
  const prefetch = event => {
    const url = internalPage(event.target.closest?.('a[href]'));
    if (!url || prefetched.has(url.pathname + url.search) || pageKey(url) === pageKey(location)) return;
    prefetched.add(url.pathname + url.search);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = url.pathname + url.search;
    document.head.append(hint);
  };
  document.addEventListener('pointerover', prefetch, { passive: true });
  document.addEventListener('focusin', prefetch);

  /* ---------------------------------------------------------------------
   * Button feedback: primary buttons lean toward the pointer, and every
   * button answers a press with a ripple.
   * ------------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.button-primary, [data-magnetic]').forEach(element => {
      const mover = element.querySelector('[data-magnetic-item]') || element;
      const strength = Number(element.dataset.magnetic) || 0.3;
      const target = { x: 0, y: 0 };
      const current = { x: 0, y: 0 };
      let frame = 0;
      const tick = () => {
        current.x += (target.x - current.x) * 0.16;
        current.y += (target.y - current.y) * 0.16;
        const settled = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) < 0.05;
        mover.style.translate = settled && !target.x && !target.y ? '' : `${current.x.toFixed(2)}px ${current.y.toFixed(2)}px`;
        frame = settled ? 0 : requestAnimationFrame(tick);
      };
      element.addEventListener('pointermove', event => {
        const bounds = mover.getBoundingClientRect();
        const limit = Math.min(bounds.width, bounds.height) * 0.35;
        const clamp = value => Math.max(-limit, Math.min(limit, value));
        target.x = clamp((event.clientX - (bounds.left - current.x + bounds.width / 2)) * strength);
        target.y = clamp((event.clientY - (bounds.top - current.y + bounds.height / 2)) * strength);
        if (!frame) frame = requestAnimationFrame(tick);
      });
      element.addEventListener('pointerleave', () => {
        target.x = 0;
        target.y = 0;
        if (!frame) frame = requestAnimationFrame(tick);
      });
    });
  }

  if (!reduceMotion) {
    document.addEventListener('pointerdown', event => {
      const button = event.target.closest('.button, .see-all, .spot-tab, .filter-button, .segmented button');
      if (!button) return;
      let host = button.querySelector(':scope > .ripple-host');
      if (!host) {
        host = document.createElement('span');
        host.className = 'ripple-host';
        host.setAttribute('aria-hidden', 'true');
        if (getComputedStyle(button).position === 'static') button.style.position = 'relative';
        button.append(host);
      }
      const bounds = button.getBoundingClientRect();
      const size = Math.hypot(bounds.width, bounds.height) * 2;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.cssText = `left:${event.clientX - bounds.left}px;top:${event.clientY - bounds.top}px;width:${size}px;height:${size}px`;
      ripple.addEventListener('animationend', () => ripple.remove());
      host.append(ripple);
    });
  }

  /* ---------------------------------------------------------------------
   * Cursor badge: over a project preview, a label follows the pointer
   * to say what a click will do. Set it with data-cursor="…".
   * ------------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    const badge = document.createElement('div');
    badge.className = 'cursor-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = '<span></span>';
    document.body.append(badge);
    const text = badge.firstElementChild;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    let zone = null;
    const tick = () => {
      current.x += (target.x - current.x) * 0.22;
      current.y += (target.y - current.y) * 0.22;
      badge.style.transform = `translate3d(${current.x.toFixed(1)}px, ${current.y.toFixed(1)}px, 0)`;
      frame = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) < 0.2 ? 0 : requestAnimationFrame(tick);
    };
    const hide = () => {
      zone = null;
      badge.classList.remove('is-visible');
    };
    document.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      target.x = event.clientX;
      target.y = event.clientY;
      const next = event.target.closest?.('[data-cursor]') || null;
      if (next && !zone) {
        // Appear at the pointer rather than sliding in from where it was last seen.
        current.x = target.x;
        current.y = target.y;
      }
      zone = next;
      if (zone && text.textContent !== zone.dataset.cursor) text.textContent = zone.dataset.cursor;
      badge.classList.toggle('is-visible', Boolean(zone));
      if (!frame) frame = requestAnimationFrame(tick);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
  }

  /* ---------------------------------------------------------------------
   * Contact: quick channels, the floating "Let's talk" button and the
   * project brief. The details come from js/contact.js.
   * ------------------------------------------------------------------- */
  const year = new Date().getFullYear();
  document.querySelectorAll('#copyright-year').forEach(element => { element.textContent = year; });

  const channelItem = channel => `
    <li class="channel channel-${channel.id}">
      <a href="${escapeHtml(channel.href)}"${channel.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
        <span class="channel-icon">${icon(channel.icon)}</span>
        <span class="channel-text"><strong>${escapeHtml(channel.label)}</strong><small>${escapeHtml(channel.detail)}</small></span>
        ${icon('arrow-up-right')}
      </a>
      ${channel.copy ? `<button class="channel-copy" type="button" data-copy="${escapeHtml(channel.copy)}" aria-label="Copy ${escapeHtml(channel.copy)}">${icon('copy')}</button>` : ''}
    </li>`;

  // Copy buttons: a phone number or email address, one tap.
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy]');
    if (!button || button.classList.contains('is-copied')) return;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
    } catch {
      return;
    }
    button.classList.add('is-copied');
    button.innerHTML = icon('check');
    button.setAttribute('aria-label', 'Copied');
    window.setTimeout(() => {
      button.classList.remove('is-copied');
      button.innerHTML = icon('copy');
      button.setAttribute('aria-label', `Copy ${button.dataset.copy}`);
    }, 1800);
  });

  const channelList = document.getElementById('contact-channels');
  if (channelList) {
    const socials = socialLinks();
    channelList.innerHTML = contactChannels().map(channelItem).join('') + (socials ? `<li class="socials">${socials}</li>` : '');
  }

  const form = document.getElementById('contactForm');
  const talkChannels = contactChannels(pageProject);
  if (talkChannels.length) initTalk();
  if (form) initBrief();

  // A floating button on every page that opens the quickest ways to reach you.
  function initTalk() {
    const talk = document.createElement('div');
    talk.className = 'talk';
    talk.innerHTML = `
      <div class="talk-panel" id="talk-panel" role="dialog" aria-labelledby="talk-title">
        <div class="talk-head">
          <img src="assets/asraf-avatar.jpg" alt="" width="44" height="44">
          <p><strong id="talk-title">Talk to ${escapeHtml(contact.name || 'me')}</strong><span><span class="status-dot"></span> Available for projects</span></p>
          <button class="talk-close" type="button" aria-label="Close">${icon('close')}</button>
        </div>
        <p class="talk-intro">${pageProject
          ? `Want something like ${escapeHtml(pageProject.name)}? Message me, or plan it with me in a minute.`
          : 'Tell me what you’re planning, or show me a project you like.'}</p>
        <ul class="talk-channels">${talkChannels.map(channelItem).join('')}</ul>
        <a class="button button-primary talk-brief" href="${form ? '#contact' : briefUrl(pageProject)}">Plan your project ${icon('arrow-right')}</a>
      </div>
      <button class="talk-toggle" type="button" aria-expanded="false" aria-controls="talk-panel">
        <span class="talk-ring" aria-hidden="true"></span>${icon('chat')}<span class="talk-label">Let’s talk</span>
      </button>`;
    document.body.append(talk);

    const toggle = talk.querySelector('.talk-toggle');
    const panel = talk.querySelector('.talk-panel');
    const setOpen = (open, { returnFocus = false } = {}) => {
      talk.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) panel.querySelector('.talk-channels a')?.focus({ preventScroll: true });
      else if (returnFocus) toggle.focus();
    };
    toggle.addEventListener('click', () => setOpen(!talk.classList.contains('is-open')));
    talk.querySelector('.talk-close').addEventListener('click', () => setOpen(false, { returnFocus: true }));
    panel.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && talk.classList.contains('is-open')) setOpen(false, { returnFocus: true });
    });
    document.addEventListener('pointerdown', event => {
      if (talk.classList.contains('is-open') && !talk.contains(event.target)) setOpen(false);
    });

    // On the homepage, stay out of the way of the hero and of the contact section itself.
    const quiet = ['home', 'contact'].map(id => document.getElementById(id)).filter(Boolean);
    if (quiet.length && 'IntersectionObserver' in window) {
      const inView = new Map();
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => inView.set(entry.target, entry.intersectionRatio > (entry.target.id === 'home' ? 0.4 : 0.15)));
        const away = [...inView.values()].some(Boolean);
        talk.classList.toggle('is-away', away);
        if (away) setOpen(false);
      }, { threshold: [0, 0.15, 0.4, 0.6] });
      quiet.forEach(section => observer.observe(section));
    }
  }

  // The project brief: visitors tap their answers and the message writes itself.
  function initBrief() {
    const status = document.getElementById('formStatus');
    const refList = document.getElementById('briefRefs');
    const urlField = form.querySelector('.brief-url');
    const levelField = form.querySelector('.brief-level');
    const preview = document.getElementById('briefPreview');
    const whatsappLink = document.getElementById('briefWhatsApp');
    const doneCount = document.getElementById('briefDone');
    const submitButton = document.getElementById('contactSubmitBtn');
    const nameInput = document.getElementById('contactName');
    const reachInput = document.getElementById('contactReach');
    const urlInput = document.getElementById('briefUrl');
    const detailsInput = document.getElementById('contactMessage');

    const references = projects.filter(project => project.cover);
    const refOption = (value, thumb, title, detail) => `
      <label class="ref">
        <input type="radio" name="ref" value="${escapeHtml(value)}">
        <span class="ref-card"><span class="ref-thumb">${thumb}</span><span class="ref-name"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></span></span>
      </label>`;
    refList.innerHTML = [
      ...references.map(project => refOption(project.slug, `<img src="${escapeHtml(project.cover.src)}" alt="" loading="lazy" decoding="async">`, project.name, [categoryById[project.category]?.short, project.demo && 'UI concept'].filter(Boolean).join(' · '))),
      refOption('other', icon('globe'), 'Another website', 'Paste a link'),
      refOption('none', icon('spark'), 'Not yet', 'Let’s plan it'),
    ].join('');

    if (contact.whatsapp) {
      whatsappLink.hidden = false;
      document.getElementById('briefNote').textContent = 'WhatsApp opens with this message ready to send. Or send it from here and I’ll reply by WhatsApp, phone or email. Your details are only used to reply to you.';
    } else {
      submitButton.classList.replace('button-ghost', 'button-primary');
    }

    const levels = { premium: 'a premium version for my business', similar: 'something similar for my business', inspiration: 'just as inspiration' };
    const checked = name => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
    const read = () => {
      const ref = checked('ref');
      return {
        need: checked('need'),
        ref,
        project: references.find(project => project.slug === ref) || null,
        url: ref === 'other' ? urlInput.value.trim() : '',
        level: checked('level') || 'premium',
        timeline: checked('timeline'),
        name: nameInput.value.trim(),
        reach: reachInput.value.trim(),
        details: detailsInput.value.trim(),
      };
    };

    // The message itself. WhatsApp shows *text* in bold.
    const compose = (brief, { bold = false } = {}) => {
      const label = text => (bold ? `*${text}*` : text);
      const lines = [];
      if (brief.need) lines.push(`${label('What I need:')} ${brief.need}`);
      const liked = brief.project ? `${brief.project.name} (${new URL(projectUrl(brief.project), location.href).href})` : brief.url;
      if (liked) lines.push(`${label('Like:')} ${liked}, ${levels[brief.level]}`);
      if (brief.ref === 'none') lines.push(`${label('Reference:')} Nothing yet, I’d like to plan it together`);
      if (brief.timeline) lines.push(`${label('Timeline:')} ${brief.timeline}`);
      const sign = [brief.name, brief.reach].filter(Boolean).join(' · ');
      return [
        `Hi ${contact.name || 'there'}! I found you through your portfolio${lines.length ? '.' : ' and I’d like to talk about a project.'}`,
        lines.join('\n'),
        brief.details,
        sign && `— ${sign}`,
      ].filter(Boolean).join('\n\n');
    };

    const update = () => {
      const brief = read();
      urlField.hidden = brief.ref !== 'other';
      levelField.hidden = !(brief.project || brief.ref === 'other');
      const answered = { need: brief.need, ref: brief.ref, timeline: brief.timeline, you: brief.reach };
      form.querySelectorAll('.brief-step').forEach(step => step.classList.toggle('is-answered', Boolean(answered[step.dataset.step])));
      const done = Object.values(answered).filter(Boolean).length;
      doneCount.textContent = done;
      form.style.setProperty('--brief-progress', done / 4);
      const message = compose(brief, { bold: true });
      preview.innerHTML = escapeHtml(message).replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
      whatsappLink.href = whatsappUrl(message);
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);

    // Keep the chosen reference in view in the sideways-scrolling list.
    const pick = slug => {
      const input = [...form.querySelectorAll('input[name="ref"]')].find(item => item.value === slug);
      if (!input) return false;
      input.checked = true;
      update();
      const card = input.closest('.ref');
      refList.scrollTo({ left: card.offsetLeft - (refList.clientWidth - card.offsetWidth) / 2 });
      return true;
    };
    if (params.get('ref')) pick(params.get('ref'));

    // "Want one like this?" links on this page pick the project and jump to the brief.
    document.addEventListener('click', event => {
      const link = event.target.closest('[data-brief-ref]');
      if (!link || !pick(link.dataset.briefRef)) return;
      event.preventDefault();
      document.getElementById('contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }, true);

    document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
      const input = [...form.querySelectorAll('input[name="need"]')].find(item => item.value === link.dataset.service);
      if (input) input.checked = true;
      update();
    }));

    update();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const reachKind = value => {
      if (emailPattern.test(value)) return 'email';
      return /^[+\d\s().-]+$/.test(value) && digitsOnly(value).length >= 7 ? 'phone' : '';
    };
    [nameInput, reachInput].forEach(input => input.addEventListener('input', () => input.removeAttribute('aria-invalid')));

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitButton.disabled) return;
      const brief = read();
      const kind = reachKind(brief.reach);
      const problem = brief.name.length < 2
        ? [nameInput, 'Please add your name, so I know who I’m talking to.']
        : !kind
          ? [reachInput, 'Please add a WhatsApp or phone number, or an email address, so I can reply.']
          : null;
      if (problem) {
        problem[0].setAttribute('aria-invalid', 'true');
        problem[0].focus();
        status.dataset.state = 'error';
        status.textContent = problem[1];
        return;
      }

      const payload = {
        name: brief.name,
        [kind]: brief.reach,
        subject: [brief.need || 'A new project', brief.project && `like ${brief.project.name}`].filter(Boolean).join(' · ').slice(0, 200),
        message: compose(brief).slice(0, 5000),
      };
      const fallback = contact.whatsapp ? 'send it on WhatsApp instead' : `email me at ${contact.email}`;
      const buttonText = submitButton.querySelector('span');
      const originalText = buttonText.textContent;
      submitButton.disabled = true;
      buttonText.textContent = 'Sending…';
      form.setAttribute('aria-busy', 'true');
      status.dataset.state = 'pending';
      status.textContent = '';
      // A free Render service that has been asleep can take up to a minute to answer.
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 60000);
      const slow = window.setTimeout(() => { buttonText.textContent = 'Still sending…'; }, 6000);
      try {
        const response = await fetch(`${BACKEND_URL}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const result = await response.json().catch(() => null);
        if (response.ok && result?.success) {
          status.dataset.state = 'success';
          status.textContent = `Thank you, ${brief.name}! Your brief is on its way. I’ll reply ${kind === 'email' ? 'by email' : 'on WhatsApp or by phone'}.`;
          form.reset();
          update();
        } else {
          const errors = Array.isArray(result?.errors) ? result.errors.map(error => typeof error === 'string' ? error : error.message).filter(Boolean).join(' ') : '';
          throw new Error(errors || (response.status === 429
            ? `You’ve sent several briefs recently. Please try again later, or ${fallback}.`
            : `Your brief could not be sent. Please try again, or ${fallback}.`));
        }
      } catch (error) {
        status.dataset.state = 'error';
        status.textContent = error.name === 'AbortError' || error instanceof TypeError
          ? `The connection didn’t go through. Your message is still here. Try again, or ${fallback}.`
          : error.message;
      } finally {
        window.clearTimeout(timeout);
        window.clearTimeout(slow);
        submitButton.disabled = false;
        buttonText.textContent = originalText;
        form.removeAttribute('aria-busy');
      }
    });
  }
})();
