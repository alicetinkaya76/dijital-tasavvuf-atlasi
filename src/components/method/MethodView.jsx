import { useUI } from '../../ui-context.jsx';
import { Gloss } from '../shared/ui.jsx';
import { COLORS } from '../../config/colors.js';

function Section({ n, title, children }) {
  return (
    <section className="method-section">
      <div className="method-sec-head">
        <span className="method-sec-num">{n}</span>
        <h2 className="method-sec-title">{title}</h2>
      </div>
      <div className="method-sec-body">{children}</div>
    </section>
  );
}

export default function MethodView() {
  const { t, lang, rtl } = useUI();
  return (
    <div className="method-page">
      <header className="method-hero framed">
        <div className="method-ornament" aria-hidden="true"><Rosette /></div>
        <p className="section-eyebrow">{t('method.title')}</p>
        <p className="method-lead">{t('method.lead')}</p>
      </header>

      <article className="method-body">
        <Section n="I" title={t('method.corpusH')}>
          <p>{t('method.corpusP')}</p>
        </Section>

        <Section n="II" title={t('method.countH')}>
          <p>{t('method.countP1')}</p>
          <p>{t('method.countP2')}</p>
        </Section>

        <Section n="III" title={t('method.distinctH')}>
          <p>{t('method.distinctP')}</p>
        </Section>

        <Section n="IV" title={t('method.netsH')}>
          <ul className="method-nets">
            <li className="net-computed"><span className="net-tag">{t('method.netsCooccur')}</span></li>
            <li className="net-curated"><span className="net-tag">{t('method.netsSilsile')}</span></li>
            <li className="net-computed"><span className="net-tag">{t('method.netsIntertext')}</span></li>
            <li className="net-computed"><span className="net-tag">{t('method.netsCluster')}</span></li>
          </ul>
        </Section>

        <Section n="V" title={t('method.limitsH')}>
          <p>{t('method.limHomograph')}</p>
          <p>{t('method.limWordcount')}</p>
          <p>{t('method.limSample')}</p>
          <div className="method-batin">
            <Gloss eyebrow={t('pano.methodTitle')} lang={lang}>{t('method.limBatin')}</Gloss>
          </div>
        </Section>

        <Section n="VI" title={t('method.reproH')}>
          <p>{t('method.reproP')}</p>
        </Section>
      </article>

      <p className="method-closing">
        <span className="method-closing-rule" aria-hidden="true" />
        {t('method.closing')}
      </p>
    </div>
  );
}

function Rosette() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
      <g fill="none" stroke={COLORS.gold} opacity="0.55">
        <circle cx="60" cy="60" r="54" strokeWidth="0.8" />
        <circle cx="60" cy="60" r="42" strokeWidth="0.7" />
      </g>
      <g stroke={COLORS.lapis} fill="none" strokeWidth="0.7" opacity="0.4">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          return <line key={i} x1="60" y1="60" x2={60 + 42 * Math.cos(a)} y2={60 + 42 * Math.sin(a)} />;
        })}
      </g>
      <circle cx="60" cy="60" r="13" fill={COLORS.gold} opacity="0.16" />
      <circle cx="60" cy="60" r="5" fill={COLORS.gold} opacity="0.7" />
    </svg>
  );
}
