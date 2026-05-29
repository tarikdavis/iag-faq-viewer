// Filter state synced with URL query params so views are deep-linkable.
// Example URL: /?opco=british-airways&hub=hub-shopping-online&topic=topic-collecting-avios-shopping-online&q=missing&lang=en-GB&view=all

import { useCallback, useEffect, useState } from 'react';
import type { Locale, OpcoId } from './types';

export type ViewMode = 'all' | 'debug';

export interface Filters {
  opco: OpcoId | null;     // null = all opcos
  hubId: string | null;    // null = all hubs
  topicId: string | null;  // null = all topics in the hub
  search: string;          // free-text — matches question or FAQ ID
  lang: Locale;
  view: ViewMode;
}

const DEFAULTS: Filters = {
  opco: null,
  hubId: null,
  topicId: null,
  search: '',
  lang: 'en-GB',
  view: 'all',
};

function parseUrl(): Filters {
  if (typeof window === 'undefined') return DEFAULTS;
  const p = new URLSearchParams(window.location.search);
  const opcoRaw = p.get('opco');
  const validOpcos = new Set<OpcoId>(['british-airways', 'aer-lingus', 'iberia']);
  return {
    opco: opcoRaw && validOpcos.has(opcoRaw as OpcoId) ? (opcoRaw as OpcoId) : null,
    hubId: p.get('hub'),
    topicId: p.get('topic'),
    search: p.get('q') ?? '',
    lang: p.get('lang') === 'es-ES' ? 'es-ES' : 'en-GB',
    view: p.get('view') === 'debug' ? 'debug' : 'all',
  };
}

function writeUrl(filters: Filters) {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams();
  if (filters.opco) p.set('opco', filters.opco);
  if (filters.hubId) p.set('hub', filters.hubId);
  if (filters.topicId) p.set('topic', filters.topicId);
  if (filters.search) p.set('q', filters.search);
  if (filters.lang !== 'en-GB') p.set('lang', filters.lang);
  if (filters.view !== 'all') p.set('view', filters.view);
  const search = p.toString();
  const next = search ? `?${search}` : window.location.pathname;
  if (next !== window.location.search && next !== window.location.pathname + window.location.search) {
    window.history.replaceState({}, '', next);
  }
}

export function useFilters() {
  const [filters, setFilters] = useState<Filters>(parseUrl);

  useEffect(() => {
    writeUrl(filters);
  }, [filters]);

  // Back/forward browser nav
  useEffect(() => {
    const onPop = () => setFilters(parseUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const update = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      // If hub changes, clear topic (the previous topic may not belong to the new hub)
      if (patch.hubId !== undefined && patch.hubId !== prev.hubId) {
        next.topicId = null;
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => setFilters(DEFAULTS), []);

  return { filters, update, reset };
}
