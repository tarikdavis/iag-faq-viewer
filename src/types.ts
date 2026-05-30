// Domain types for the FAQ viewer. Mirror the v4.1.1 spec at
// /v4-1-spec/FAQ schema.md — keep these in sync if the Contentful model
// changes.

export type OpcoId = 'british-airways' | 'aer-lingus' | 'iberia';

export const OPCO_DISPLAY: Record<OpcoId, string> = {
  'british-airways': 'British Airways Club',
  'aer-lingus': 'AerClub',
  iberia: 'Iberia Club',
};

export const OPCO_SHORT: Record<OpcoId, string> = {
  'british-airways': 'BA',
  'aer-lingus': 'Aer',
  iberia: 'IB',
};

export type Locale = 'en-GB' | 'es-ES';

// Localised value wrapper — Contentful returns `{ 'en-GB': value, 'es-ES': value }`
export type Localised<T> = Partial<Record<Locale, T>>;

export interface Hub {
  id: string;
  internalName: string;
  heading: Localised<string>;
  slug: string;
  hubType: string;
  applicableOpcos: OpcoId[];
}

export interface Topic {
  id: string;
  internalName: string;
  name: Localised<string>;
  slug: string;
  hubId: string;
  applicableOpcos: OpcoId[];
  order: number;
}

export interface Faq {
  id: string;
  internalName: string;
  question: Localised<string>;
  questionVariants: Localised<string[]>;
  shortAnswer: Localised<string>;
  answer: Localised<string>;
  searchSummary: Localised<string>;
  slug: string;
  topicId: string | null;            // canonical / primary topic
  additionalTopicIds: string[];      // extra topic blocks the FAQ surfaces in
  applicableOpcos: OpcoId[];
  faqAriaLabel: Localised<string>;
  lastReviewedAt: string | null;
  ragInclude: boolean;
}

// The joined model the UI works with
export interface FaqWithContext extends Faq {
  topic: Topic | null;
  hub: Hub | null;
  additionalTopics: Topic[];  // resolved entries for additionalTopicIds
  /** True when applicableOpcos is missing or empty — surfaces in debug view */
  opcoInvalid: boolean;
}

export interface ContentfulCorpus {
  hubs: Hub[];
  topics: Topic[];
  faqs: FaqWithContext[];
}
