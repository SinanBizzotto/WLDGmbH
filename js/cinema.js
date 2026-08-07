// WebLabDesignFrontend/js/cinema.js
//
// Cinematic showcase: one continuous virtual-camera scroll journey —
// brand -> MacBook -> inside the screen -> digital world -> back out ->
// responsive morph -> iPhone -> inside the screen -> mobile world -> exit
// -> finale. A single GSAP + ScrollTrigger master timeline, scrub-linked
// to scroll position (no React/JS state per frame — GSAP owns the tween).
//
// #cinema is always plain, linear, readable HTML (see index.html). This
// module only activates the pinned camera rig once GSAP + ScrollTrigger
// are present AND the user has not requested reduced motion; on any
// failure it leaves the static fallback exactly as it was. That gate is
// the "cinema--active" class on <html>, referenced throughout styles.css.
//
// The core trick that keeps the whole thing feeling like ONE continuous
// shot rather than a slideshow: .cinema__portal is a SINGLE, always-fixed
// element whose width/height/top/left/borderRadius are tweened by GSAP.
// .cinema__world (nav + content) always fills it at 100%/100%. It starts
// sized/positioned to sit exactly inside the Mac's screen, grows to fill
// the viewport, contracts back down into iPhone proportions, and grows to
// fullscreen again — the SAME DOM subtree the whole time, never crossfaded
// against a duplicate. It has to be a *sibling* of .cinema__mac/.cinema__
// phone, not a child: any CSS transform on an ancestor (rotation, scale,
// translateZ — all of which the device rigs get) creates a new containing
// block for position:fixed descendants, which would silently break its
// viewport tracking.

// GSAP/ScrollTrigger are loaded via plain <script> tags right before this
// module, so by spec they're guaranteed to have run by the time a deferred
// module executes — but a script-optimization layer sitting in front of the
// site (Cloudflare's Rocket Loader and similar) can rewrite/reorder plain
// <script> tags and break that guarantee silently. Poll briefly instead of
// checking once, so a few hundred ms of unlucky load order doesn't
// permanently strand the page on the static fallback.
function whenGsapReady(callback, attemptsLeft = 60) {
  if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    callback();
    return;
  }
  if (attemptsLeft <= 0) {
    console.warn('cinema: GSAP/ScrollTrigger never became available — leaving static fallback in place');
    return;
  }
  setTimeout(() => whenGsapReady(callback, attemptsLeft - 1), 50);
}

function initCinema() {
  const section = document.getElementById('cinema');
  if (!section) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  whenGsapReady(() => activateCinema(section));
}

function activateCinema(section) {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  const q = (sel) => section.querySelector(sel);
  const qa = (sel) => Array.from(section.querySelectorAll(sel));

  const siteHeader = document.querySelector('.header');
  const stage = q('[data-cinema-stage]');
  const portal = q('[data-cinema="portal"]');
  const world = q('[data-cinema="world"]');
  const intro = q('[data-cinema="intro"]');
  const macRig = q('[data-cinema="macRig"]');
  const mac = q('[data-cinema="mac"]');
  const macChrome = qa('[data-cinema="macChrome"]');
  const macScreen = section.querySelector('.cinema__macScreen');
  const macSweep = q('[data-cinema="macSweep"]');
  const phoneRig = q('[data-cinema="phoneRig"]');
  const phone = q('[data-cinema="phone"]');
  const phoneSweep = q('[data-cinema="phoneSweep"]');
  const finale = q('[data-cinema="finale"]');
  const navDesktop = q('[data-cinema="navDesktop"]');
  const navMobile = q('[data-cinema="navMobile"]');
  const landing = q('[data-cinema="landing"]');
  const pillars = q('[data-cinema="pillars"]');
  const pillarItems = qa('[data-cinema-pillar]');
  const showcase = q('[data-cinema="showcase"]');
  const projects = qa('[data-cinema-project]');
  const exitScreen = q('[data-cinema="exit"]');
  const app = q('[data-cinema="app"]');
  const orbA = section.querySelector('[data-cinema-orb="a"]');
  const orbB = section.querySelector('[data-cinema-orb="b"]');
  const orbC = section.querySelector('[data-cinema-orb="c"]');
  const particleHost = q('[data-cinema-particles]');

  const required = [stage, portal, world, intro, macRig, mac, phoneRig, phone, finale, macScreen];
  if (required.some((el) => !el)) return;

  let scrollTriggerInstance = null;
  let timeline = null;
  let resizeTimer = null;

  function buildParticles() {
    if (!particleHost || particleHost.childElementCount) return;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const narrow = window.innerWidth < 640;
    if (coarsePointer && narrow) return; // skip entirely on small touch screens
    const count = narrow ? 10 : 22;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'cinema__particle';
      const size = 2 + Math.round(Math.random() * 3);
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.round(Math.random() * 100)}%`;
      p.style.top = `${Math.round(Math.random() * 100)}%`;
      p.style.setProperty('--pOpacity', (0.25 + Math.random() * 0.4).toFixed(2));
      p.style.setProperty('--pDriftX', `${Math.round((Math.random() - 0.5) * 6)}vw`);
      p.style.animationDuration = `${14 + Math.round(Math.random() * 16)}s`;
      p.style.animationDelay = `-${Math.round(Math.random() * 20)}s`;
      frag.appendChild(p);
    }
    particleHost.appendChild(frag);
  }

  // Measures where the portal needs to sit for the "inside the Mac" and
  // "inside the iPhone" states, in real viewport pixels — by temporarily
  // forcing the stage into the exact box it will occupy once pinned
  // (position:fixed, full viewport) and reading the placeholder screens'
  // real rendered rects. This way the target geometry always matches
  // whatever the CSS (clamp()s, aspect-ratio, borders, vw-based widths)
  // actually renders, instead of a hand-duplicated copy of that math that
  // would silently drift out of sync the next time the CSS changes.
  function measureTargets() {
    const prevStyle = stage.getAttribute('style') || '';
    stage.style.position = 'fixed';
    stage.style.top = '0';
    stage.style.left = '0';
    stage.style.width = '100vw';
    stage.style.height = `${window.innerHeight}px`;

    const macScreenRect = macScreen.getBoundingClientRect();
    const phoneRect = phone.getBoundingClientRect();
    const phoneBorder = parseFloat(getComputedStyle(phone).borderTopWidth) || 8;

    stage.setAttribute('style', prevStyle);

    return {
      mac: {
        top: macScreenRect.top,
        left: macScreenRect.left,
        width: macScreenRect.width,
        height: macScreenRect.height,
        borderRadius: 5,
      },
      phone: {
        top: phoneRect.top + phoneBorder,
        left: phoneRect.left + phoneBorder,
        width: phoneRect.width - phoneBorder * 2,
        height: phoneRect.height - phoneBorder * 2,
        borderRadius: 26,
      },
      full: { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: 0 },
    };
  }

  function teardown() {
    if (scrollTriggerInstance) { scrollTriggerInstance.kill(); scrollTriggerInstance = null; }
    if (timeline) { timeline.kill(); timeline = null; }
  }

  function build() {
    teardown();
    buildParticles();
    document.documentElement.classList.add('cinema--active');

    const targets = measureTargets();
    const { mac: macT, phone: phoneT, full: fullT } = targets;

    // ---- Initial states (scene 0, pre-scroll) ----
    gsap.set(portal, {
      position: 'fixed',
      top: macT.top, left: macT.left, width: macT.width, height: macT.height,
      borderRadius: macT.borderRadius,
      rotationX: 6, rotationY: -12, rotationZ: 1, z: -90,
      opacity: 0,
    });
    gsap.set(mac, {
      z: -1500, scale: .5, opacity: 0, filter: 'blur(18px)',
      rotationX: 10, rotationY: -18, rotationZ: 2, transformOrigin: '50% 50%',
    });
    gsap.set(macChrome, { opacity: 1, y: 0 });
    gsap.set(macSweep, { opacity: 0, backgroundPosition: '-40% -40%' });
    gsap.set([macRig, phoneRig, finale], { opacity: 0 });
    gsap.set(intro, { opacity: 1, z: 0, scale: 1, filter: 'blur(0px)' });
    gsap.set(phone, {
      z: -900, scale: .6, opacity: 0, filter: 'blur(14px)',
      rotationX: -3, rotationY: 14, transformOrigin: '50% 50%',
    });
    gsap.set(phoneSweep, { opacity: 0, backgroundPosition: '-40% -40%' });
    if (navMobile) gsap.set(navMobile, { display: 'flex', opacity: 0 });
    if (navDesktop) gsap.set(navDesktop, { opacity: 1, z: 0 });
    if (landing) gsap.set(landing, { opacity: 0, y: 14 });
    if (pillars) gsap.set(pillars, { opacity: 0, y: 14 });
    if (pillarItems.length) gsap.set(pillarItems, { z: 0 });
    if (projects.length) gsap.set(projects, { opacity: 0, x: 60, y: 0, scale: 1 });
    if (exitScreen) gsap.set(exitScreen, { opacity: 0, y: 14 });
    if (app) gsap.set(app, { opacity: 0, y: 14 });
    // Monochrome brightness journey: dark graphite at the start, slowly
    // brightening toward near-white by the iPhone/finale — never a hue.
    // Real color stays reserved for the project content itself.
    if (orbA) gsap.set(orbA, { color: '#2a2a2a' });
    if (orbB) gsap.set(orbB, { color: '#3a3a3a' });
    if (orbC) gsap.set(orbC, { color: '#6a6a6a', opacity: .22 });
    if (siteHeader) gsap.set(siteHeader, { opacity: 1, pointerEvents: 'auto' });

    // 8.4x (was 7.2x): the Mac/iPhone screens now carry substantially more
    // real content (landing -> pillars -> 3-project showcase -> exit, and a
    // full mobile app) than the earlier placeholder beats/list, so each
    // state needs more scroll distance to stay readable and unhurried.
    const scrollDistance = () => Math.max(window.innerHeight * 8.4, 6000);

    timeline = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: () => `+=${scrollDistance()}`,
        scrub: .65,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    scrollTriggerInstance = timeline.scrollTrigger;

    const tl = timeline;

    // Adds N tweens that all start together (a "phase" of the camera move)
    // and run for the same duration, so the next phase() call lands right
    // after this one ends — see the module doc comment for why this needs
    // matching durations per entry.
    function phase(label, duration, entries) {
      tl.addLabel(label);
      entries.forEach(([target, vars], i) => {
        if (!target) return;
        tl.to(target, { ...vars, duration }, i === 0 ? label : '<');
      });
    }

    // ---------------------------------------------------------------
    // 1) Intro holds, then recedes into depth WHILE the Mac silhouette
    //    emerges from far behind it — continuous, not sequential.
    // ---------------------------------------------------------------
    phase('macEmerge', 13, [
      [intro, { z: -240, scale: .84, opacity: 0, filter: 'blur(6px)' }],
      [macRig, { opacity: 1 }],
      [mac, { z: -90, scale: 1, opacity: 1, filter: 'blur(0px)', rotationX: 6, rotationY: -12, rotationZ: 1 }],
      [portal, { opacity: 1, rotationX: 6, rotationY: -12, rotationZ: 1, z: -90 }],
      [orbA, { color: '#333333' }],
      [orbB, { color: '#454545' }],
    ]);

    // ---------------------------------------------------------------
    // 2) The Mac becomes the hero object: rotates frontal, camera
    //    dollies in a touch, a light sweep crosses the aluminium edge.
    // ---------------------------------------------------------------
    phase('macFrontal', 7, [
      [mac, { rotationX: 0, rotationY: 0, rotationZ: 0, z: -40, scale: 1.04 }],
      [portal, { rotationX: 0, rotationY: 0, rotationZ: 0, z: -40 }],
      [macSweep, { opacity: .8, backgroundPosition: '140% 140%' }],
    ]);
    tl.to(macSweep, { opacity: 0, duration: 1 }, '<+=6');

    // ---------------------------------------------------------------
    // 3) Camera pushes into the screen: the portal grows past the
    //    device frame while the Mac's chrome leaves frame in the same
    //    motion (base sliding down/out, topbar lifting up/out).
    // ---------------------------------------------------------------
    // Clamped so this intermediate size never overshoots the eventual
    // fullscreen bounds — on a narrow (mobile) viewport, macT.width is
    // already near-viewport-width, so an un-clamped 1.8x/2.2x multiplier
    // would grow the portal WIDER than the screen itself before shrinking
    // back down, which reads as a glitch rather than a camera push-in.
    const expandW = Math.min(macT.width * 1.8, fullT.width * 0.96);
    const expandH = Math.min(macT.height * 2.2, fullT.height * 0.92);
    phase('portalExpand', 9, [
      [portal, {
        top: (fullT.height - expandH) / 2,
        left: (fullT.width - expandW) / 2,
        width: expandW,
        height: expandH,
        borderRadius: 3,
      }],
    ]);
    tl.to(macChrome[0] || null, { opacity: 0, y: -26, duration: 9 }, 'portalExpand');
    if (macChrome[1]) tl.to(macChrome[1], { opacity: 0, y: 40, duration: 9 }, 'portalExpand');
    // The site's own sticky nav sits above everything (z-index:100) and
    // would otherwise float on top of the fullscreen portal, breaking the
    // "you are now inside the screen" illusion — fade it out as we push in,
    // back in once we're looking at a physical device again.
    if (siteHeader) tl.to(siteHeader, { opacity: 0, pointerEvents: 'none', duration: 9 }, 'portalExpand');

    // ---------------------------------------------------------------
    // 4) Fullscreen reached — the display has become the whole room.
    // ---------------------------------------------------------------
    phase('portalFullscreen', 5, [
      [portal, { top: fullT.top, left: fullT.left, width: fullT.width, height: fullT.height, borderRadius: 0 }],
      [macRig, { opacity: 0 }],
      [orbA, { color: '#3d3d3d' }],
      [orbB, { color: '#525252' }],
      [orbC, { color: '#787878', opacity: .35 }],
    ]);

    // ---------------------------------------------------------------
    // 5) Landing: the screen resolves into a real WLD landing page —
    //    logo, headline, CTA. This is the "first screen state" from a
    //    readable distance, not the flat digital-world content yet.
    // ---------------------------------------------------------------
    phase('depthIn', 4, [
      [navDesktop, { z: 40 }],
      [landing, { opacity: 1, y: 0, z: 10 }],
    ]);
    tl.to(landing, { opacity: 1, duration: 2 });
    tl.to(landing, { opacity: 0, y: -10, duration: 1.2 });

    // ---------------------------------------------------------------
    // 6) Pillars: the flat UI's own components (Design/Development/
    //    Performance), each nudged onto its own depth plane — this is
    //    the flat website visibly starting to become spatial, not a
    //    hard cut into an abstract 3D room.
    // ---------------------------------------------------------------
    tl.to(pillars, { opacity: 1, y: 0, duration: 1.2 });
    if (pillarItems[0]) tl.to(pillarItems[0], { z: 60, duration: 1.4 }, '<');
    if (pillarItems[1]) tl.to(pillarItems[1], { z: -50, duration: 1.4 }, '<');
    if (pillarItems[2]) tl.to(pillarItems[2], { z: 90, duration: 1.4 }, '<');
    tl.to(pillars, { opacity: 1, duration: 1.6 });
    tl.to(pillars, { opacity: 0, y: -10, duration: 1.2 });
    if (pillarItems.length) tl.to(pillarItems, { z: 0, duration: 1.2 }, '<');

    // ---------------------------------------------------------------
    // 7) Showcase: real WLD work, one story — website -> web app ->
    //    mobile product. The room itself stays monochrome and keeps
    //    brightening on its own arc; only the project cards' own
    //    content (see .cinema__project's --pA/--pA2) carries real
    //    color, which is the whole point — color reads as valuable
    //    specifically because the room around it doesn't have any.
    // ---------------------------------------------------------------
    tl.addLabel('digitalWorld');
    tl.to(orbA, { color: '#474747', duration: 1.4 });
    if (orbB) tl.to(orbB, { color: '#5e5e5e', duration: 1.4 }, '<');
    // The last project's exit doubles as "the world flattening back into
    // a flat screen" (nav depth resets in the same motion) — no separate
    // static, empty hold; the portal is already shrinking again by the
    // time content is empty, so it never reads as a dead frame.
    projects.forEach((project, i) => {
      const isLast = i === projects.length - 1;
      tl.to(project, { opacity: 1, x: 0, duration: 1.1 });
      tl.to(project, { opacity: 1, duration: 1.8 });
      if (isLast) {
        tl.to(project, { opacity: 0, scale: .96, duration: 1.4 });
        if (navDesktop) tl.to(navDesktop, { z: 0, duration: 1.4 }, '<');
      } else {
        tl.to(project, { opacity: 0, scale: .96, duration: 1.0 });
      }
    });

    // ---------------------------------------------------------------
    // 7b) Exit screen: the interface has visibly evolved since we came
    //     in — this is what leads straight into the responsive morph.
    // ---------------------------------------------------------------
    tl.to(exitScreen, { opacity: 1, y: 0, duration: 1.2 });
    if (orbA) tl.to(orbA, { color: '#585858', duration: 1.2 }, '<');
    if (orbB) tl.to(orbB, { color: '#707070', duration: 1.2 }, '<');
    tl.to(exitScreen, { opacity: 1, duration: 1.6 });
    tl.to(exitScreen, { opacity: 0, y: -10, duration: 1.2 });

    // ---------------------------------------------------------------
    // 8) Portal contracts back toward the Mac screen rect — NOT a
    //    reverse-playback of the zoom-in: a slightly different angle.
    // ---------------------------------------------------------------
    phase('portalContract', 4, [
      [portal, {
        top: macT.top, left: macT.left, width: macT.width, height: macT.height,
        borderRadius: macT.borderRadius,
        rotationX: 4, rotationY: 8, rotationZ: -1, z: -60,
      }],
    ]);
    if (siteHeader) tl.to(siteHeader, { opacity: 1, pointerEvents: 'auto', duration: 4 }, 'portalContract');

    // ---------------------------------------------------------------
    // 9) The Mac bezel rematerializes around it.
    // ---------------------------------------------------------------
    phase('macRematerialize', 4, [
      [macRig, { opacity: 1 }],
      [mac, { rotationX: 4, rotationY: 8, rotationZ: -1, z: -60, opacity: 1 }],
    ]);
    if (macChrome[0]) tl.to(macChrome[0], { opacity: 1, y: 0, duration: 4 }, '<');
    if (macChrome[1]) tl.to(macChrome[1], { opacity: 1, y: 0, duration: 4 }, '<');

    // ---------------------------------------------------------------
    // 10) The Mac rotates once more, a second light sweep crosses it.
    // ---------------------------------------------------------------
    phase('macRotateSweep', 4, [
      [mac, { rotationY: -14, rotationX: 5, rotationZ: 0, z: -110, scale: .97 }],
      [portal, { rotationY: -14, rotationX: 5, rotationZ: 0, z: -110 }],
      [macSweep, { opacity: .7, backgroundPosition: '140% 140%' }],
      [orbB, { color: '#7a7a7a' }],
    ]);
    tl.to(macSweep, { opacity: 0, duration: 1 }, '<+=3');

    // ---------------------------------------------------------------
    // 11) The interface detaches from the Mac's screen (a small z-lift
    //     that reads as "the experience exists independently").
    // ---------------------------------------------------------------
    phase('interfaceDetach', 4, [
      [portal, { z: '+=70', boxShadow: '0 40px 90px rgba(0,0,0,.55)' }],
    ]);

    // ---------------------------------------------------------------
    // 12) The Mac slides away — physically, not opacity:0.
    // ---------------------------------------------------------------
    phase('macSlideAway', 4, [
      [mac, { x: -180, z: -420, rotationY: -26, scale: .82 }],
    ]);
    tl.to(macRig, { opacity: 0, duration: 4 }, '<');

    // ---------------------------------------------------------------
    // 13) Aspect morph: the freestanding interface reshapes from
    //     desktop (16:10) to mobile (9:19.5) proportions; the desktop
    //     nav crossfades to the mobile nav exactly as the width
    //     collapses, so it reads as caused by the resize, not a cut.
    // ---------------------------------------------------------------
    tl.addLabel('aspectMorph');
    const phoneScreenW = Math.min(420, phoneT.width * 2.6);
    const phoneScreenH = Math.min(window.innerHeight * .82, phoneT.height * 2.6);
    tl.to(portal, {
      top: (window.innerHeight - phoneScreenH) / 2,
      left: (window.innerWidth - phoneScreenW) / 2,
      width: phoneScreenW,
      height: phoneScreenH,
      borderRadius: 30,
      duration: 8,
    }, 'aspectMorph');
    if (navDesktop) tl.to(navDesktop, { opacity: 0, duration: 3 }, 'aspectMorph+=1.5');
    if (navMobile) tl.to(navMobile, { opacity: 1, duration: 3 }, 'aspectMorph+=4');

    // ---------------------------------------------------------------
    // 14) The iPhone constructs around the now-narrow interface.
    // ---------------------------------------------------------------
    phase('iphoneConstruct', 4, [
      [phoneRig, { opacity: 1 }],
      [phone, { opacity: 1, scale: 1, filter: 'blur(0px)', z: -70, rotationX: 0, rotationY: 0 }],
    ]);

    // ---------------------------------------------------------------
    // 15) The iPhone becomes a physical product: a light rotation, a
    //     sweep across the glass.
    // ---------------------------------------------------------------
    phase('iphoneProduct', 4, [
      [phone, { rotationY: 8, rotationX: -2, z: -30 }],
      [portal, { rotationY: 8, rotationX: -2, z: -30 }],
      [phoneSweep, { opacity: .75, backgroundPosition: '140% 140%' }],
      [orbC, { color: '#9a9a9a', opacity: .4 }],
    ]);
    tl.to(phoneSweep, { opacity: 0, duration: 1 }, '<+=3');

    // ---------------------------------------------------------------
    // 16) Camera pushes into the iPhone: frontal, then fullscreen.
    // ---------------------------------------------------------------
    phase('iphoneZoom', 7, [
      [phone, { rotationX: 0, rotationY: 0, z: -10, scale: 1.03 }],
      [portal, {
        top: fullT.top, left: fullT.left, width: fullT.width, height: fullT.height,
        borderRadius: 0, rotationX: 0, rotationY: 0, z: -10,
      }],
      [phoneRig, { opacity: 0 }],
      [orbA, { color: '#6a6a6a' }],
      [orbB, { color: '#8c8c8c' }],
    ]);
    if (siteHeader) tl.to(siteHeader, { opacity: 0, pointerEvents: 'none', duration: 7 }, 'iphoneZoom');

    // ---------------------------------------------------------------
    // 17) Mobile world: a real Relaxplore app composition takes over —
    //     genuinely re-composed for mobile, not the desktop UI shrunk
    //     down. Same portal, same brand, no crossfade against a
    //     duplicate. The room keeps brightening toward the finale;
    //     Relaxplore's own blue/orange stays inside the app's content.
    // ---------------------------------------------------------------
    phase('mobileWorld', 5, [
      [app, { opacity: 1, y: 0 }],
      [orbA, { color: '#7a7a7a' }],
      [orbB, { color: '#a8a8a8', opacity: .3 }],
    ]);
    tl.to({}, { duration: 3 }); // hold — fully readable, no motion, on purpose
    tl.to(app, { opacity: 0, y: -10, duration: 2 });

    // ---------------------------------------------------------------
    // 18) iPhone exit: portal contracts back into the phone shape, the
    //     phone rematerializes, then physically drifts back and down.
    // ---------------------------------------------------------------
    phase('iphoneContract', 4, [
      [portal, {
        top: (window.innerHeight - phoneScreenH) / 2,
        left: (window.innerWidth - phoneScreenW) / 2,
        width: phoneScreenW, height: phoneScreenH, borderRadius: 30,
      }],
    ]);
    if (siteHeader) tl.to(siteHeader, { opacity: 1, pointerEvents: 'auto', duration: 4 }, 'iphoneContract');
    phase('iphoneRematerialize', 3, [
      [phoneRig, { opacity: 1 }],
      [phone, { opacity: 1 }],
    ]);
    phase('iphoneDrift', 5, [
      [phone, { y: 60, z: -260, scale: .88, opacity: 0 }],
      [phoneRig, { opacity: 0 }],
      [portal, { opacity: 0 }],
    ]);

    // ---------------------------------------------------------------
    // 19) Finale — calmer, more open, the closing message + CTA.
    // ---------------------------------------------------------------
    phase('finale', 6, [
      [finale, { opacity: 1 }],
      [orbA, { color: '#8a8a8a' }],
      [orbB, { color: '#b0b0b0' }],
      [orbC, { color: '#e0e0e0', opacity: .3 }],
    ]);

    ScrollTrigger.refresh();
  }

  try {
    build();
  } catch (err) {
    console.error('cinema init failed, falling back to static layout', err);
    document.documentElement.classList.remove('cinema--active');
    teardown();
    return;
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const scrollY = window.scrollY;
      try {
        build();
        window.scrollTo(0, scrollY);
      } catch (err) {
        console.error('cinema rebuild on resize failed, falling back to static layout', err);
        document.documentElement.classList.remove('cinema--active');
        if (siteHeader) gsap.set(siteHeader, { clearProps: 'opacity,pointerEvents' });
        teardown();
      }
    }, 250);
  });
}

document.addEventListener('DOMContentLoaded', initCinema);
