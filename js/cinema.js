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

function initCinema() {
  const section = document.getElementById('cinema');
  if (!section) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

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
  const contentIntro = q('[data-cinema="contentIntro"]');
  const beats = qa('[data-cinema-beat]');
  const mobileList = q('[data-cinema="mobileList"]');
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
    if (contentIntro) gsap.set(contentIntro, { opacity: 0, y: 14 });
    if (beats.length) gsap.set(beats, { opacity: 0, x: 60, display: 'block' });
    if (mobileList) gsap.set(mobileList, { opacity: 0, y: 14 });
    if (orbA) gsap.set(orbA, { color: '#4c1d95' });
    if (orbB) gsap.set(orbB, { color: '#2563eb' });
    if (orbC) gsap.set(orbC, { color: '#d946ef', opacity: .32 });
    if (siteHeader) gsap.set(siteHeader, { opacity: 1, pointerEvents: 'auto' });

    const scrollDistance = () => Math.max(window.innerHeight * 7.2, 5200);

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
      [orbA, { color: '#1d4ed8' }],
      [orbB, { color: '#06b6d4' }],
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
      [orbA, { color: '#2563eb' }],
      [orbB, { color: '#7c3aed' }],
      [orbC, { color: '#06b6d4', opacity: .4 }],
    ]);

    // ---------------------------------------------------------------
    // 5) Interface content gains depth as we settle inside it.
    // ---------------------------------------------------------------
    phase('depthIn', 4, [
      [navDesktop, { z: 40 }],
      [contentIntro, { opacity: 1, y: 0, z: 10 }],
    ]);

    // ---------------------------------------------------------------
    // 6) Digital world: the camera passes DESIGN -> DEVELOPMENT ->
    //    PERFORMANCE -> RESPONSIVE, one capability at a time.
    // ---------------------------------------------------------------
    tl.addLabel('digitalWorld');
    tl.to(contentIntro, { opacity: 0, y: -10, duration: 1 }, 'digitalWorld');
    // The last beat's exit doubles as "the world flattening back into a
    // flat screen" (nav depth resets in the same motion) — no separate
    // static, empty hold in between; the portal is already shrinking again
    // by the time content is empty, so it never reads as a dead frame.
    beats.forEach((beat, i) => {
      const isLast = i === beats.length - 1;
      tl.to(beat, { opacity: 1, x: 0, duration: 1.1 })
        .to(beat, { opacity: 1, duration: 1.8 });
      if (isLast) {
        tl.to(beat, { opacity: 0, x: -60, duration: 1.4 });
        if (navDesktop) tl.to(navDesktop, { z: 0, duration: 1.4 }, '<');
      } else {
        tl.to(beat, { opacity: 0, x: -60, duration: 1.0 });
      }
    });

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
      [orbB, { color: '#d946ef' }],
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
      [orbC, { color: '#f472b6', opacity: .5 }],
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
      [orbA, { color: '#0891b2' }],
      [orbB, { color: '#2563eb' }],
    ]);
    if (siteHeader) tl.to(siteHeader, { opacity: 0, pointerEvents: 'none', duration: 7 }, 'iphoneZoom');

    // ---------------------------------------------------------------
    // 17) Mobile world: the curated project list takes over — a
    //     different content composition for a different screen, same
    //     brand, same portal, no crossfade against a duplicate.
    // ---------------------------------------------------------------
    phase('mobileWorld', 5, [
      [mobileList, { opacity: 1, y: 0 }],
    ]);
    tl.to({}, { duration: 3 }); // hold — fully readable, no motion, on purpose
    tl.to(mobileList, { opacity: 0, y: -10, duration: 2 });

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
      [orbA, { color: '#2563eb' }],
      [orbB, { color: '#7c3aed' }],
      [orbC, { color: '#f59e0b', opacity: .4 }],
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
