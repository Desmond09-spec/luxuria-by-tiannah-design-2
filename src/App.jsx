import { useEffect, useRef, useState } from 'react';

/* Local, self-contained media. The craft clip was transcoded from the shelf's
   HEVC source to H.264 so it plays in Chrome/Safari as well as Firefox. */
const MEDIA = {
  hero: '/hero.mp4',
  craft: '/craft.mp4',
  study1: '/study-1.webp',
  study2: '/study-2.webp',
};

const MAILTO = 'mailto:viewings@luxuriabytiannah.com?subject=Private%20viewing';

const COLLECTIONS = [
  {
    num: '01',
    title: 'Timepieces',
    desc: 'Mechanical watches cased in precious metal, finished where they can be seen and where they can’t.',
  },
  {
    num: '02',
    title: 'Fine Jewellery',
    desc: 'Gold, stones and light. Designed around the person who wears them, not the other way round.',
  },
  {
    num: '03',
    title: 'Bespoke',
    desc: 'One idea, one drawing, one maker. Commissions begin with a conversation.',
  },
];

const FACTS = [
  ['MATERIAL', '18k gold & precious stones'],
  ['METHOD', 'Hand-finished and serviced'],
  ['PROMISE', 'Made to be passed on'],
];

const NAV_LINKS = [
  ['#collections', 'Collections'],
  ['#craft', 'Craft'],
  ['#maison', 'The Maison'],
];

function Arrow({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.6 12.4 12.4 3.6M5.6 3.6h6.8v6.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Eyebrow({ children, className = '', style }) {
  return (
    <p className={`eyebrow ${className}`} style={style}>
      <span className="hair" aria-hidden="true" />
      {children}
    </p>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** A looping background video that pauses off-screen and honours reduced motion. */
function BackgroundVideo({ src, className, reduced }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const markReady = () => video.classList.add('is-ready');
    video.addEventListener('loadeddata', markReady);
    if (video.readyState >= 2) markReady();

    let observer;
    if (reduced) {
      video.pause();
      try { video.currentTime = 0; } catch { /* metadata not loaded yet */ }
    } else {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            const attempt2 = video.play();
            if (attempt2 && typeof attempt2.catch === 'function') attempt2.catch(() => {});
          } else {
            video.pause();
          }
        },
        { threshold: 0.01 },
      );
      observer.observe(video);
    }

    return () => {
      video.removeEventListener('loadeddata', markReady);
      if (observer) observer.disconnect();
    };
  }, [src, reduced]);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      autoPlay={!reduced}
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}

/** Scroll reveals, added only once React has mounted so a JS failure never hides content. */
function useReveals() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('reveals-ready');

    document.querySelectorAll('[data-stagger]').forEach((group) => {
      const step = Number(group.dataset.stagger) || 0;
      const base = Number(group.dataset.staggerBase || 0);
      group.querySelectorAll('[data-reveal]').forEach((el, i) => {
        el.style.setProperty('--d', `${base + i * step}ms`);
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      root.classList.remove('reveals-ready');
    };
  }, []);
}

function useNavTheme(heroRef) {
  const [ink, setInk] = useState(false);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const hero = heroRef.current;
      if (!hero) return;
      const next = window.scrollY > hero.offsetHeight - 120;
      setInk((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [heroRef]);
  return ink;
}

function useMenu() {
  const [open, setOpen] = useState(false);
  const firstLink = useRef(null);

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && firstLink.current) firstLink.current.focus();

    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onResize = () => { if (window.innerWidth > 900) setOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);

    return () => {
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  return { open, setOpen, firstLink };
}

function Nav({ ink, menu }) {
  return (
    <>
      <header className={`nav liquid-glass in-down${ink ? ' nav--ink' : ''}`}>
        <a className="wordmark" href="#top" aria-label="Luxuria by Tiannah, home">
          Luxuria<span>BY TIANNAH</span>
        </a>

        <nav className="nav__links" aria-label="Primary">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>

        <a className="nav__cta" href={MAILTO}>
          Enquire <Arrow size={13} />
        </a>

        <button
          className="nav__burger liquid-glass"
          type="button"
          aria-label={menu.open ? 'Close menu' : 'Open menu'}
          aria-expanded={menu.open}
          aria-controls="mobile-menu"
          onClick={() => menu.setOpen(!menu.open)}
        >
          <span /><span />
        </button>
      </header>

      <div id="mobile-menu" className={`menu${menu.open ? ' menu--open' : ''}`} aria-hidden={!menu.open}>
        <nav aria-label="Mobile">
          {NAV_LINKS.map(([href, label], i) => (
            <a
              key={href}
              ref={i === 0 ? menu.firstLink : undefined}
              href={href}
              tabIndex={menu.open ? 0 : -1}
              onClick={() => menu.setOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>
        <p className="label">Fine watches &amp; jewellery · By appointment</p>
      </div>
    </>
  );
}

function Hero({ heroRef, reduced }) {
  return (
    <section className="hero" id="top" ref={heroRef} aria-labelledby="hero-title">
      <BackgroundVideo className="hero__video" src={MEDIA.hero} reduced={reduced} />
      <div className="hero__scrim hero__scrim--x" aria-hidden="true" />
      <div className="hero__scrim hero__scrim--y" aria-hidden="true" />

      <div className="hero__inner">
        <div className="hero__spacer" />

        <div className="hero__copy">
          <Eyebrow className="in-blur" style={{ '--d': '250ms' }}>01 — Fine watches &amp; jewellery</Eyebrow>

          <h1 id="hero-title">
            <span className="in-blur" style={{ '--d': '400ms' }}>Time,</span>
            <span className="in-blur" style={{ '--d': '550ms' }}>
              made <em className="in-em">precious.</em>
            </span>
          </h1>

          <p className="hero__sub in-fade" style={{ '--d': '800ms' }}>
            Considered timepieces and fine jewellery, finished by hand in small ateliers —
            made to be worn every day, and passed on.
          </p>

          <div className="cta-row">
            <a className="btn btn--solid in-fade" style={{ '--d': '1000ms' }} href="#collections">
              Explore the collection <Arrow />
            </a>
            <a className="btn btn--glass liquid-glass in-fade" style={{ '--d': '1100ms' }} href={MAILTO}>
              Book a private viewing <Arrow />
            </a>
          </div>
        </div>

        <div className="hero__strip in-fade" style={{ '--d': '1300ms' }}>
          <span>01 / 03 — The Maison</span>
          <span className="scroll-cue">
            Scroll to discover <i aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  );
}

function Collections() {
  return (
    <section className="sheet sheet--paper collections" id="collections" aria-labelledby="collections-title">
      <div data-stagger="120" data-stagger-base="150">
        <div data-reveal=""><Eyebrow>02 / The Collections</Eyebrow></div>

        <h2 className="section-title" id="collections-title" data-reveal="">
          <span>A small number</span>
          <span>of <em>very good</em> things.</span>
        </h2>

        <p className="sheet-sub" data-reveal="">
          We keep the collection deliberately short. Every piece earns its place,
          and every place is made by hand.
        </p>
      </div>

      <div className="collections__grid">
        <div className="index-rows" data-stagger="120" data-stagger-base="150">
            {COLLECTIONS.map((item) => (
              <a className="index-row" href={MAILTO} key={item.num} data-reveal="">
                <span className="index-row__num">{item.num}</span>
                <span>
                  <span className="index-row__title">{item.title}</span>
                  <span className="index-row__desc">{item.desc}</span>
                </span>
                <span className="index-row__arrow"><Arrow size={16} /></span>
              </a>
            ))}
          </div>

          <div className="diptych" data-stagger="140" data-stagger-base="0">
            <figure className="frame" data-reveal="" style={{ '--y': '60px', '--dur': '.9s' }}>
              <div className="frame__media">
                <img src={MEDIA.study1} alt="Dark stone threaded with veins of molten gold" loading="eager" decoding="async" />
              </div>
              <figcaption>I — In the rough</figcaption>
            </figure>
            <figure className="frame" data-reveal="" style={{ '--y': '60px', '--dur': '.9s' }}>
              <div className="frame__media">
                <img src={MEDIA.study2} alt="The same stone, moss and light running through its gold veins" loading="eager" decoding="async" />
              </div>
              <figcaption>II — Brought to light</figcaption>
            </figure>
        </div>
      </div>
    </section>
  );
}

function Craft({ reduced }) {
  return (
    <section className="sheet sheet--dark craft" id="craft" aria-labelledby="craft-title">
      <BackgroundVideo className="craft__video" src={MEDIA.craft} reduced={reduced} />
      <div className="craft__scrim" aria-hidden="true" />

      <div className="craft__inner" data-stagger="120" data-stagger-base="150">
        <div data-reveal=""><Eyebrow>03 / The Craft</Eyebrow></div>

        <h2 className="section-title section-title--centre" id="craft-title" data-reveal="">
          <span>Made slowly,</span>
          <span><em>on purpose.</em></span>
        </h2>

        <p className="sheet-sub sheet-sub--centre" data-reveal="">
          Nothing here is rushed. A watch or a ring leaves the atelier only when
          the person who made it is willing to put their name to it.
        </p>

        <div className="facts" data-reveal="">
          {FACTS.map(([label, value]) => (
            <div key={label}>
              <p className="label">{label}</p>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Maison() {
  return (
    <section className="sheet sheet--paper maison" id="maison" aria-labelledby="maison-title">
      <div data-stagger="120" data-stagger-base="150">
        <div data-reveal=""><Eyebrow>04 / Private Viewings</Eyebrow></div>

        <h2 className="section-title" id="maison-title" data-reveal="">
          <span>Begin with</span>
          <span><em>a conversation.</em></span>
        </h2>

        <p className="sheet-sub" data-reveal="">
          Visit the maison in person or by video. Bring an idea, an heirloom to
          remake, or nothing at all.
        </p>

        <div className="cta-row cta-row--dark" data-reveal="">
          <a className="btn btn--ink" href={MAILTO}>
            Book a private viewing <Arrow />
          </a>
          <a className="text-link" href="mailto:maison@luxuriabytiannah.com">
            Write to the maison <Arrow size={13} />
          </a>
        </div>
      </div>

      <footer className="footer">
        <a className="wordmark wordmark--footer" href="#top">
          Luxuria<span>BY TIANNAH</span>
        </a>
        <nav className="footer__links" aria-label="Footer">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>
        <div className="footer__end">
          <p className="footer__legal">© 2026 Luxuria by Tiannah · Fine watches &amp; jewellery</p>
          <a className="footer__top" href="#top">Back to top ↑</a>
        </div>
      </footer>
    </section>
  );
}

export default function App() {
  const reduced = usePrefersReducedMotion();
  const heroRef = useRef(null);
  const ink = useNavTheme(heroRef);
  const menu = useMenu();
  useReveals();

  return (
    <>
      <Nav ink={ink} menu={menu} />
      <main>
        <Hero heroRef={heroRef} reduced={reduced} />
        <Collections />
        <Craft reduced={reduced} />
        <Maison />
      </main>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
