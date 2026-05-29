import { useEffect, useMemo, useState } from 'react';
import { fetchCorpus } from './contentful';
import type { ContentfulCorpus, FaqWithContext, Locale } from './types';
import { useFilters } from './useFilters';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { FaqCard } from './components/FaqCard';

function loc(value: Record<string, string> | undefined, lang: Locale, fallback = ''): string {
  if (!value) return fallback;
  return value[lang] ?? value['en-GB'] ?? Object.values(value)[0] ?? fallback;
}

export function App() {
  const [corpus, setCorpus] = useState<ContentfulCorpus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { filters, update, reset } = useFilters();

  useEffect(() => {
    fetchCorpus()
      .then(setCorpus)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  // Derived: filtered FAQ list
  const filtered: FaqWithContext[] = useMemo(() => {
    if (!corpus) return [];
    const q = filters.search.trim().toLowerCase();
    return corpus.faqs.filter((f) => {
      // Debug view: only show invalid-opco entries; ignore hub/topic/opco filters
      if (filters.view === 'debug') return f.opcoInvalid;

      if (filters.opco && !f.applicableOpcos.includes(filters.opco)) return false;
      if (filters.hubId && f.hub?.id !== filters.hubId) return false;
      if (filters.topicId && f.topic?.id !== filters.topicId) return false;
      if (q) {
        const hay = [
          loc(f.question, filters.lang),
          loc(f.question, 'en-GB'),
          f.internalName,
          f.slug,
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [corpus, filters]);

  const invalidCount = useMemo(
    () => corpus?.faqs.filter((f) => f.opcoInvalid).length ?? 0,
    [corpus]
  );

  // Current hub/topic for the heading
  const activeHub = corpus?.hubs.find((h) => h.id === filters.hubId) ?? null;
  const activeTopic = corpus?.topics.find((t) => t.id === filters.topicId) ?? null;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md bg-bg-layer2 border border-opco-iberia/30 rounded-card p-6 shadow-elevation1">
          <h1 className="font-display font-semibold text-lg text-fg-primary mb-2">
            Couldn't load the corpus
          </h1>
          <p className="text-sm text-fg-secondary mb-3 whitespace-pre-wrap font-mono">{error}</p>
          <p className="text-xs text-fg-tertiary">
            Check VITE_CONTENTFUL_SPACE_ID and VITE_CONTENTFUL_DELIVERY_TOKEN in your env.
          </p>
        </div>
      </div>
    );
  }

  if (!corpus) {
    return (
      <div className="min-h-screen flex items-center justify-center text-fg-tertiary text-sm">
        Loading FAQs…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav
        filters={filters}
        totalCount={corpus.faqs.length}
        invalidCount={invalidCount}
        onChange={update}
      />
      <div className="flex flex-1 max-w-container w-full mx-auto">
        <Sidebar corpus={corpus} filters={filters} onChange={update} />

        <main className="flex-1 p-6 overflow-y-auto">
          {/* Heading + search */}
          <div className="mb-6 flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="text-[12px] uppercase tracking-wide text-fg-tertiary mb-1">
                {filters.view === 'debug' ? 'Debug' : filters.opco ? 'OpCo' : 'Everything'}
                {filters.view !== 'debug' && filters.opco && (
                  <span className="ml-1 normal-case font-semibold text-fg-secondary">
                    {filters.opco}
                  </span>
                )}
              </div>
              <h1 className="font-display font-bold text-3xl text-fg-primary leading-tight">
                {filters.view === 'debug'
                  ? 'FAQs with missing or invalid applicableOpcos'
                  : activeTopic
                    ? loc(activeTopic.name, filters.lang)
                    : activeHub
                      ? loc(activeHub.heading, filters.lang)
                      : 'All FAQs'}
              </h1>
              {activeTopic && activeHub && (
                <div className="text-sm text-fg-tertiary mt-1">
                  under {loc(activeHub.heading, filters.lang)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="search"
                  value={filters.search}
                  onChange={(e) => update({ search: e.target.value })}
                  placeholder="Search question or faq-id…"
                  className="w-72 pl-9 pr-3 py-2 text-sm rounded-pill border border-border-tertiary bg-bg-layer2 focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent-subtle"
                />
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary text-sm"
                  aria-hidden
                >
                  ⌕
                </span>
              </div>
              {(filters.opco || filters.hubId || filters.topicId || filters.search || filters.view !== 'all') && (
                <button
                  onClick={reset}
                  className="text-xs text-fg-accent-primary hover:opacity-80 px-2"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Result count */}
          <div className="text-sm text-fg-tertiary mb-3">
            Showing {filtered.length} of {corpus.faqs.length}
            {filters.opco && <> · OpCo: <strong className="text-fg-secondary">{filters.opco}</strong></>}
          </div>

          {/* Cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-fg-tertiary text-sm bg-bg-layer2 rounded-card border border-border-tertiary border-dashed">
              No FAQs match the current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((f) => (
                <FaqCard key={f.id} faq={f} lang={filters.lang} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
