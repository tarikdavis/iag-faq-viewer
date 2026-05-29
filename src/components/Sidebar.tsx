import type { Filters } from '../useFilters';
import type { ContentfulCorpus, Locale } from '../types';

interface Props {
  corpus: ContentfulCorpus;
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}

function loc(value: Record<string, string> | undefined, lang: Locale, fallback = ''): string {
  if (!value) return fallback;
  return value[lang] ?? value['en-GB'] ?? Object.values(value)[0] ?? fallback;
}

export function Sidebar({ corpus, filters, onChange }: Props) {
  // Group topics by hub
  const topicsByHub = new Map<string, typeof corpus.topics>();
  for (const t of corpus.topics) {
    const list = topicsByHub.get(t.hubId) ?? [];
    list.push(t);
    topicsByHub.set(t.hubId, list);
  }

  // FAQ counts per hub + topic (post opco filter so the numbers match the main panel)
  const faqsAfterOpcoFilter = filters.opco
    ? corpus.faqs.filter((f) => f.applicableOpcos.includes(filters.opco!))
    : corpus.faqs;
  const hubCount = new Map<string, number>();
  const topicCount = new Map<string, number>();
  for (const f of faqsAfterOpcoFilter) {
    if (f.hub) hubCount.set(f.hub.id, (hubCount.get(f.hub.id) ?? 0) + 1);
    if (f.topic) topicCount.set(f.topic.id, (topicCount.get(f.topic.id) ?? 0) + 1);
  }

  const sortedHubs = [...corpus.hubs].sort((a, b) => loc(a.heading, 'en-GB').localeCompare(loc(b.heading, 'en-GB')));

  return (
    <aside className="w-64 shrink-0 border-r border-border-tertiary bg-bg-base overflow-y-auto">
      <div className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-fg-tertiary mb-2">
          Categories
        </div>

        <button
          onClick={() => onChange({ hubId: null, topicId: null })}
          className={[
            'w-full text-left px-3 py-2 rounded-md text-sm font-medium mb-1',
            filters.hubId === null
              ? 'bg-accent-subtle text-fg-accent-secondary'
              : 'text-fg-secondary hover:bg-bg-layer1',
          ].join(' ')}
        >
          All categories
          <span className="float-right text-fg-tertiary text-xs">
            {faqsAfterOpcoFilter.length}
          </span>
        </button>

        {sortedHubs.map((hub) => {
          const isActive = filters.hubId === hub.id;
          const topics = topicsByHub.get(hub.id) ?? [];
          const count = hubCount.get(hub.id) ?? 0;
          return (
            <div key={hub.id} className="mt-1">
              <button
                onClick={() => onChange({ hubId: hub.id, topicId: null })}
                className={[
                  'w-full text-left px-3 py-2 rounded-md text-sm font-semibold',
                  isActive
                    ? 'bg-accent-subtle text-fg-accent-secondary'
                    : 'text-fg-primary hover:bg-bg-layer1',
                ].join(' ')}
              >
                {loc(hub.heading, filters.lang)}
                <span className="float-right text-fg-tertiary text-xs font-normal">
                  {count}
                </span>
              </button>
              {isActive && topics.length > 0 && (
                <div className="ml-2 mt-1 border-l border-border-tertiary pl-2">
                  {topics.map((topic) => {
                    const tActive = filters.topicId === topic.id;
                    const tCount = topicCount.get(topic.id) ?? 0;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => onChange({ topicId: tActive ? null : topic.id })}
                        className={[
                          'w-full text-left px-3 py-1.5 rounded-md text-sm',
                          tActive
                            ? 'bg-fg-accent-primary text-fg-on-vibrant'
                            : 'text-fg-secondary hover:bg-bg-layer1',
                        ].join(' ')}
                      >
                        {loc(topic.name, filters.lang)}
                        <span className={[
                          'float-right text-xs',
                          tActive ? 'opacity-80' : 'text-fg-tertiary',
                        ].join(' ')}>
                          {tCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
