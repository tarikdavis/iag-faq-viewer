/// <reference types="vite/client" />

// Strongly-typed env vars — Vite injects these at build time.
interface ImportMetaEnv {
  readonly VITE_CONTENTFUL_SPACE_ID: string;
  readonly VITE_CONTENTFUL_DELIVERY_TOKEN: string;
  readonly VITE_CONTENTFUL_ENVIRONMENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
