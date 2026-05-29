import { useState } from 'react';
import { marked } from 'marked';
import type { FaqWithContext, Locale, OpcoId } from '../types';
import { OPCO_SHORT } from '../types';
import { contentfulEditUrl } from '../contentful';

interface Props {
  faq: FaqWithContext;
  lang: Locale;
}

function loc(value: Record<string, string> | undefined, lang: Locale, fallback = ''): string {
  if (!value) return fallback;
  return value[lang] ?? value['en-GB'] ?? Object.values(value)[0] ?? fallback;
}
function locArr(value: Record<string, string[]> | undefined, lang: Locale): string[] {
  if (!value) return [];
  return value[lang] ?? value['en-GB'] ?? [];
}

function opcoBadge(opco: OpcoId): string {
  switch (opco) {
    case 'british-airways': return 'bg-opco-ba/10 text-opco-ba ring-1 ring-opco-ba/20';
    case 'aer-lingus':     return 'bg-opco-aer/10 text-opco-aer ring-1 ring-opco-aer/20';
    case 'iberia':         return 'bg-opco-iberia/10 text-opco-iberia ring-1 ring-opco-iberia/20';
  }
}

export function FaqCard({ faq, lang }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const question = loc(faq.question, lang, '(no question)');
  const shortAnswer = loc(faq.shortAnswer, lang);
  const answerMd = loc(faq.answer, lang);
  const variants = locArr(faq.questionVariants, lang);
  const searchSummary = loc(faq.searchSummary, lang);
  const editUrl = contentfulEditUrl(faq.id);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(faq.internalName);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — silent */
    }
  };

  return (
    <article
      className={[
        'bg-bg-layer2 rounded-card border border-border-tertiary shadow-elevation1 overflow-hidden transition-shadow',
        open ? 'shadow-elevation3' : '',
      ].join(' ')}
    >
      {/* Header — question + opcos + chevron */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-bg-layer1 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="text-fg-primary font-display font-semibold text-[17px] leading-snug">
            {question}
          </div>
          {/* FAQ ID — small, copyable, gray */}
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <button
              onClick={(e) => { e.stopPropagation(); copyId(); }}
              className="text-[11px] font-mono text-fg-tertiary hover:text-fg-secondary inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-bg-layer1 hover:bg-bg-layer3 transition-colors"
              title="Copy internalName"
            >
              <span className="opacity-60">id:</span>{faq.internalName}
              {copied && <span className="ml-1 text-fg-accent-primary">✓ copied</span>}
            </button>
            {faq.hub && (
              <span className="text-[11px] text-fg-tertiary">
                {loc(faq.hub.heading, lang)}
                {faq.topic && <span className="opacity-60"> › {loc(faq.topic.name, lang)}</span>}
              </span>
            )}
          </div>
        </div>

        {/* OpCos — the headline check signal */}
        <div className="flex items-center gap-1 shrink-0">
          {faq.applicableOpcos.length === 0 ? (
            <span className="text-[11px] font-semibold text-opco-iberia bg-opco-iberia/10 ring-1 ring-opco-iberia/20 px-2 py-0.5 rounded-sm">
              NO OPCOS
            </span>
          ) : (
            faq.applicableOpcos.map((o) => (
              <span
                key={o}
                className={['text-[11px] font-bold px-2 py-0.5 rounded-sm', opcoBadge(o)].join(' ')}
                title={o}
              >
                {OPCO_SHORT[o]}
              </span>
            ))
          )}
        </div>

        <span className={[
          'text-fg-tertiary transition-transform shrink-0 mt-1',
          open ? 'rotate-180' : '',
        ].join(' ')} aria-hidden>▾</span>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-5 pb-5 border-t border-border-tertiary bg-bg-layer1/30">
          {shortAnswer && (
            <div className="mt-4 text-[15px] text-fg-secondary italic">
              {shortAnswer}
            </div>
          )}

          {variants.length > 0 && (
            <div className="mt-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-fg-tertiary mb-1">
                Variants
              </div>
              <ul className="text-[13px] text-fg-secondary space-y-0.5">
                {variants.map((v, i) => <li key={i}>· {v}</li>)}
              </ul>
            </div>
          )}

          {searchSummary && (
            <div className="mt-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-fg-tertiary mb-1">
                Search summary
              </div>
              <div className="text-[13px] text-fg-secondary">{searchSummary}</div>
            </div>
          )}

          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-fg-tertiary mb-2">
              Answer
            </div>
            <div
              className="prose-faq"
              dangerouslySetInnerHTML={{ __html: marked.parse(answerMd || '_(no answer)_', { async: false }) as string }}
            />
          </div>

          <div className="mt-5 flex items-center gap-3 text-[12px] text-fg-tertiary">
            {editUrl && (
              <a
                href={editUrl}
                target="_blank"
                rel="noreferrer"
                className="text-fg-accent-primary hover:opacity-80 inline-flex items-center gap-1"
              >
                Edit in Contentful ↗
              </a>
            )}
            <span>· slug <code className="text-fg-secondary">{faq.slug}</code></span>
            {faq.lastReviewedAt && <span>· last reviewed {faq.lastReviewedAt}</span>}
            <span className={faq.ragInclude ? 'text-fg-accent-primary' : 'text-opco-iberia'}>
              · {faq.ragInclude ? 'RAG included' : 'RAG excluded'}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
