import CatIcon from '../components/CatIcon';
import Motion from '../components/Motion';
import { APP_URL, CELL_COUNT, SAMPLE, STATUSES } from '../lib/site';

const WORDMARK = 'PANELPAW'.split('');
const MARQUEE = STATUSES.map((s) => s.label);
const pad = (n) => String(n).padStart(3, '0');

function Preloader() {
  return (
    <div className="pre" id="pre" aria-hidden="true">
      <div className="pre-strips">{[0, 1, 2, 3, 4].map((i) => <i key={i} />)}</div>
      <div className="pre-inner">
        <CatIcon />
        <div className="pre-count">000</div>
        <div className="label">Loading chapter</div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="top" id="top">
      <div className="wrap">
        <a className="brand" href="#top" data-cursor="Top"><CatIcon />PanelPaw</a>
        <nav className="nav" aria-label="Sections">
          <a className="hide-sm" href="#track">Track</a>
          <a className="btn sm solid" href={APP_URL} data-magnetic data-cursor="Open">Open app</a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="wrap">
        <div className="grid" id="hero-grid">
          <div className="panel p1">
            <div className="art t-speed" data-depth="0.5" />
            <span className="cap label">CH. 047</span>
            <span className="sfx" aria-hidden="true" data-depth="1.1">ドン</span>
          </div>
          <div className="panel p2">
            <div className="art t-dots t-fade" data-depth="0.7" />
            <div className="mascot" data-depth="0.9"><CatIcon title="PanelPaw cat" /></div>
            <span className="cap label">Reading · 47 / 120</span>
          </div>
          <div className="panel p3">
            <div className="art t-hatch faint" data-depth="0.4" />
          </div>
          <div className="panel p4">
            <div className="art t-dots-lg faint" data-depth="0.6" />
            <span className="cap label">Search the Kitsu catalog</span>
          </div>
          <div className="panel p5">
            <div className="art" data-depth="0.5" />
            <span className="sfx" aria-hidden="true">ペラッ</span>
            <span className="tl label">SFX: pera (page turn)</span>
          </div>
          <div className="wm" role="img" aria-label="PanelPaw">
            {WORDMARK.map((ch, i) => <span className="ch" key={i}><span>{ch}</span></span>)}
          </div>
        </div>

        <div className="hero-copy">
          <h1 id="hero-title">Every chapter, accounted for.</h1>
          <div className="side">
            <p>PanelPaw keeps your place in every manga and manhwa you read. Search the Kitsu catalog, log chapters as you go, and sort titles into your own lists.</p>
            <div className="actions">
              <a className="btn solid" href={APP_URL} data-magnetic data-cursor="Open">Open the app <span className="arr" aria-hidden="true">→</span></a>
              <a className="btn" href="#track" data-cursor="Scroll">See how tracking works</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const run = (key) => MARQUEE.map((label) => (
    <span className="mq-item" key={`${key}-${label}`}><span>{label}</span><b>・</b></span>
  ));
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{run('a')}{run('b')}</div>
    </div>
  );
}

function Track() {
  const rest = SAMPLE.restProgress;
  const full = Math.floor(rest / (SAMPLE.total / CELL_COUNT));
  return (
    <section className="track pinnable" id="track" aria-labelledby="track-title" data-total={SAMPLE.total} data-rest={rest}>
      <div className="wrap">
        <div>
          <span className="label">Track</span>
          <h2 id="track-title">Log a chapter. PanelPaw keeps the count.</h2>
          <div className="count">
            <span className="n" id="ch-n">{pad(rest)}</span>
            <span className="of label">/ {SAMPLE.total} chapters</span>
          </div>
          <div className="bar" aria-hidden="true"><i id="bar" style={{ transform: `scaleX(${rest / SAMPLE.total})` }} /></div>
          <ul className="rail label" id="rail" aria-label="Reading status">
            {STATUSES.map((s) => (
              <li
                key={s.value}
                data-status={s.auto ? s.value : undefined}
                className={s.auto ? (s.value === 'reading' ? 'is-on' : undefined) : 'manual'}
                title={s.auto ? undefined : 'You set this one'}
              >{s.label}</li>
            ))}
          </ul>
          <p className="note">Add a chapter to a title you want to read and it moves to Reading. Reach the last chapter and it is marked Completed. On hold and Dropped stay in your hands.</p>
        </div>
        <div className="cover-col">
          <div className="cover" role="img" aria-label={`Sample title cover: ${SAMPLE.title}`}>
            <div className="t-speed" />
            <div className="t-dots-lg" />
            <div className="vt" lang="ja">{SAMPLE.titleJa}</div>
            <span className="vol label cap">{SAMPLE.title} · Vol. {SAMPLE.volume}</span>
            <div className="stamp" id="stamp" aria-hidden="true">完</div>
          </div>
          <div className="cells" id="cells" aria-hidden="true">
            {Array.from({ length: CELL_COUNT }, (_, i) => <i key={i} className={i < full ? 'cell is-full' : 'cell'} />)}
          </div>
          <span className="label muted">Sample data · one panel = 5 chapters</span>
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="wrap">
        <span className="label">Next chapter</span>
        <h2 id="cta-title">Your shelf is waiting.</h2>
        <p>Open PanelPaw in your browser, find a series, and log where you stopped. It takes about ten seconds.</p>
        <a className="btn solid" href={APP_URL} data-magnetic data-cursor="Open">Open PanelPaw <span className="arr" aria-hidden="true">→</span></a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <span className="foot-word" aria-hidden="true">PANELPAW</span>
        <div className="foot-meta label">
          <span>Catalog data from Kitsu</span>
          <span>CC 316 · ADET project</span>
          <span>Sample titles are fictional</span>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Preloader />
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Track />
        <Cta />
      </main>
      <Footer />
      <div className="cursor" id="cursor" hidden><div className="cursor-dot"><span id="cursor-label" /></div></div>
      <Motion />
    </>
  );
}
