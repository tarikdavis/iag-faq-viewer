// Contentful CDA fetch + normalisation. One request per content type with
// generous pagination — for ~164 entries this is well within the 1000-item
// limit so we don't paginate. If the corpus grows past ~800 we'll need to.

import type {
  ContentfulCorpus,
  Faq,
  FaqWithContext,
  Hub,
  OpcoId,
  Topic,
} from './types';

const SPACE = import.meta.env.VITE_CONTENTFUL_SPACE_ID as string | undefined;
const TOKEN = import.meta.env.VITE_CONTENTFUL_DELIVERY_TOKEN as string | undefined;
const ENV = (import.meta.env.VITE_CONTENTFUL_ENVIRONMENT as string) || 'master';

const VALID_OPCOS: ReadonlySet<OpcoId> = new Set([
  'british-airways',
  'aer-lingus',
  'iberia',
]);

interface CDAEntry {
  sys: { id: string; contentType: { sys: { id: string } } };
  fields: Record<string, unknown>;
}
interface CDAResponse {
  items: CDAEntry[];
  total: number;
}

function assertConfigured(): { space: string; token: string } {
  if (!SPACE || !TOKEN) {
    throw new Error(
      'Contentful env vars missing. Set VITE_CONTENTFUL_SPACE_ID and ' +
        'VITE_CONTENTFUL_DELIVERY_TOKEN in .env.local (dev) or Netlify env (prod).'
    );
  }
  return { space: SPACE, token: TOKEN };
}

async function fetchAll(contentType: string): Promise<CDAEntry[]> {
  const { space, token } = assertConfigured();
  // CDN host (read-only delivery API)
  const url = new URL(
    `https://cdn.contentful.com/spaces/${space}/environments/${ENV}/entries`
  );
  url.searchParams.set('content_type', contentType);
  url.searchParams.set('limit', '1000');
  url.searchParams.set('locale', '*'); // ask for ALL locales (so we get en-GB + es-ES)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`CDA ${contentType} fetch failed: ${res.status} ${body}`);
  }
  const data = (await res.json()) as CDAResponse;
  return data.items;
}

// --- Field readers ---------------------------------------------------------

function readString(v: unknown, locale = 'en-GB'): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v && locale in (v as object)) {
    return ((v as Record<string, unknown>)[locale] as string) ?? null;
  }
  return null;
}

function readLocalised<T>(v: unknown): Record<string, T> {
  if (v && typeof v === 'object') return v as Record<string, T>;
  return {};
}

function readOpcos(v: unknown): OpcoId[] {
  // applicableOpcos is non-localised but Contentful still wraps it as { 'en-GB': [...] }
  // when we pass locale=*. Reach inside.
  let arr: unknown = v;
  if (arr && typeof arr === 'object' && 'en-GB' in (arr as object)) {
    arr = (arr as Record<string, unknown>)['en-GB'];
  }
  if (!Array.isArray(arr)) return [];
  return arr.filter((x): x is OpcoId => typeof x === 'string' && VALID_OPCOS.has(x as OpcoId));
}

function readLink(v: unknown): string | null {
  // Link fields look like { 'en-GB': { sys: { id: '...' } } } when locale=*
  let inner: unknown = v;
  if (inner && typeof inner === 'object' && 'en-GB' in (inner as object)) {
    inner = (inner as Record<string, unknown>)['en-GB'];
  }
  if (inner && typeof inner === 'object' && 'sys' in (inner as object)) {
    const sys = (inner as { sys?: { id?: string } }).sys;
    return sys?.id ?? null;
  }
  return null;
}

function readLinks(v: unknown): string[] {
  // Array-of-links fields: { 'en-GB': [{sys: {id: '...'}}, ...] }
  let inner: unknown = v;
  if (inner && typeof inner === 'object' && 'en-GB' in (inner as object)) {
    inner = (inner as Record<string, unknown>)['en-GB'];
  }
  if (!Array.isArray(inner)) return [];
  const out: string[] = [];
  for (const item of inner) {
    if (item && typeof item === 'object' && 'sys' in (item as object)) {
      const sys = (item as { sys?: { id?: string } }).sys;
      if (sys?.id) out.push(sys.id);
    }
  }
  return out;
}

function readBoolean(v: unknown): boolean {
  let inner: unknown = v;
  if (inner && typeof inner === 'object' && 'en-GB' in (inner as object)) {
    inner = (inner as Record<string, unknown>)['en-GB'];
  }
  return Boolean(inner);
}

function readNumber(v: unknown): number {
  let inner: unknown = v;
  if (inner && typeof inner === 'object' && 'en-GB' in (inner as object)) {
    inner = (inner as Record<string, unknown>)['en-GB'];
  }
  return typeof inner === 'number' ? inner : 0;
}

// --- Normalisers -----------------------------------------------------------

function normaliseHub(e: CDAEntry): Hub {
  const f = e.fields;
  return {
    id: e.sys.id,
    internalName: readString(f.internalName) ?? '',
    heading: readLocalised<string>(f.heading),
    slug: readString(f.slug) ?? '',
    hubType: readString(f.hubType) ?? 'faq',
    applicableOpcos: readOpcos(f.applicableOpcos),
  };
}

function normaliseTopic(e: CDAEntry): Topic {
  const f = e.fields;
  return {
    id: e.sys.id,
    internalName: readString(f.internalName) ?? '',
    name: readLocalised<string>(f.name),
    slug: readString(f.slug) ?? '',
    hubId: readLink(f.hub) ?? '',
    applicableOpcos: readOpcos(f.applicableOpcos),
    order: readNumber(f.order),
  };
}

function normaliseFaq(e: CDAEntry): Faq {
  const f = e.fields;
  return {
    id: e.sys.id,
    internalName: readString(f.internalName) ?? '',
    question: readLocalised<string>(f.question),
    questionVariants: readLocalised<string[]>(f.questionVariants),
    shortAnswer: readLocalised<string>(f.shortAnswer),
    answer: readLocalised<string>(f.answer),
    searchSummary: readLocalised<string>(f.searchSummary),
    slug: readString(f.slug) ?? '',
    topicId: readLink(f.topic),
    additionalTopicIds: readLinks(f.additionalTopics),
    applicableOpcos: readOpcos(f.applicableOpcos),
    faqAriaLabel: readLocalised<string>(f.faqAriaLabel),
    lastReviewedAt: readString(f.lastReviewedAt),
    ragInclude: readBoolean(f.ragInclude),
  };
}

// --- Main entry point ------------------------------------------------------

export async function fetchCorpus(): Promise<ContentfulCorpus> {
  // Parallel fetches — three small queries, well under rate limits
  const [hubEntries, topicEntries, faqEntries] = await Promise.all([
    fetchAll('servicingHub'),
    fetchAll('faqTopic'),
    fetchAll('faq'),
  ]);

  const hubs = hubEntries.map(normaliseHub);
  const topics = topicEntries.map(normaliseTopic);
  const rawFaqs = faqEntries.map(normaliseFaq);

  const topicById = new Map(topics.map((t) => [t.id, t]));
  const hubById = new Map(hubs.map((h) => [h.id, h]));

  const faqs: FaqWithContext[] = rawFaqs.map((faq) => {
    const topic = faq.topicId ? topicById.get(faq.topicId) ?? null : null;
    const hub = topic ? hubById.get(topic.hubId) ?? null : null;
    const additionalTopics = faq.additionalTopicIds
      .map((id) => topicById.get(id))
      .filter((t): t is NonNullable<typeof t> => t != null);
    const opcoInvalid =
      faq.applicableOpcos.length === 0 ||
      faq.applicableOpcos.some((o) => !VALID_OPCOS.has(o));
    return { ...faq, topic, hub, additionalTopics, opcoInvalid };
  });

  // Sort topics by hub then order
  topics.sort((a, b) => {
    const hubA = hubById.get(a.hubId)?.slug ?? '';
    const hubB = hubById.get(b.hubId)?.slug ?? '';
    if (hubA !== hubB) return hubA.localeCompare(hubB);
    return a.order - b.order;
  });

  return { hubs, topics, faqs };
}

// Build the deep-link to edit an entry in Contentful
export function contentfulEditUrl(entryId: string): string | null {
  if (!SPACE) return null;
  return `https://app.contentful.com/spaces/${SPACE}/environments/${ENV}/entries/${entryId}`;
}
