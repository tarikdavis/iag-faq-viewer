import type { Filters, ViewMode } from '../useFilters';
import type { Locale, OpcoId } from '../types';
import { OPCO_DISPLAY } from '../types';

interface Props {
  filters: Filters;
  totalCount: number;
  invalidCount: number;
  onChange: (patch: Partial<Filters>) => void;
}

const OPCO_OPTIONS: { id: OpcoId | null; label: string }[] = [
  { id: null, label: 'All OpCos' },
  { id: 'british-airways', label: OPCO_DISPLAY['british-airways'] },
  { id: 'aer-lingus', label: OPCO_DISPLAY['aer-lingus'] },
  { id: 'iberia', label: OPCO_DISPLAY['iberia'] },
];

const LANG_OPTIONS: { id: Locale; label: string }[] = [
  { id: 'en-GB', label: 'EN' },
  { id: 'es-ES', label: 'ES' },
];

const VIEW_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: 'all', label: 'All FAQs' },
  { id: 'debug', label: 'Debug' },
];

export function TopNav({ filters, totalCount, invalidCount, onChange }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-bg-base/95 backdrop-blur border-b border-border-tertiary">
      <div className="max-w-container mx-auto px-6 py-3 flex items-center gap-6 flex-wrap">
        {/* Brand */}
        <div className="flex items-center gap-2 mr-auto">
          <div className="h-8 w-8 rounded-pill bg-fg-accent-primary text-fg-on-vibrant flex items-center justify-center font-display font-bold text-sm">
            a
          </div>
          <div>
            <div className="font-display font-semibold text-fg-primary leading-tight">
              FAQ Sandbox
            </div>
            <div className="text-[11px] text-fg-tertiary leading-tight">
              {totalCount} entries
              {invalidCount > 0 && (
                <button
                  className="ml-2 text-opco-iberia underline underline-offset-2"
                  onClick={() => onChange({ view: 'debug', opco: null, hubId: null, topicId: null })}
                >
                  {invalidCount} invalid opcos
                </button>
              )}
            </div>
          </div>
        </div>

        {/* OpCo pills — the headline filter */}
        <nav className="flex items-center gap-1 p-1 bg-bg-layer3 rounded-pill" aria-label="OpCo filter">
          {OPCO_OPTIONS.map((opt) => {
            const active = filters.opco === opt.id;
            return (
              <button
                key={opt.id ?? 'all'}
                onClick={() => onChange({ opco: opt.id })}
                className={[
                  'px-4 py-1.5 text-sm rounded-pill font-medium transition-colors',
                  active
                    ? 'bg-fg-accent-primary text-fg-on-vibrant shadow-elevation1'
                    : 'text-fg-secondary hover:text-fg-primary',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </nav>

        {/* Language toggle */}
        <div className="flex items-center gap-1 p-1 bg-bg-layer3 rounded-pill" aria-label="Language">
          {LANG_OPTIONS.map((opt) => {
            const active = filters.lang === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ lang: opt.id })}
                className={[
                  'px-3 py-1 text-xs rounded-pill font-semibold transition-colors',
                  active ? 'bg-bg-base text-fg-primary shadow-elevation1' : 'text-fg-tertiary',
                ].join(' ')}
                title={opt.id}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-bg-layer3 rounded-pill" aria-label="View mode">
          {VIEW_OPTIONS.map((opt) => {
            const active = filters.view === opt.id;
            const isDebug = opt.id === 'debug';
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ view: opt.id })}
                className={[
                  'px-3 py-1 text-xs rounded-pill font-semibold transition-colors',
                  active
                    ? isDebug
                      ? 'bg-opco-iberia text-white'
                      : 'bg-bg-base text-fg-primary shadow-elevation1'
                    : 'text-fg-tertiary',
                ].join(' ')}
              >
                {opt.label}
                {isDebug && invalidCount > 0 && (
                  <span className="ml-1 text-[10px]">({invalidCount})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
