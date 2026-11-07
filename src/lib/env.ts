/**
 * Central place for every environment variable the app reads.
 *
 * Public values are inlined by Next at build time, so they are referenced
 * literally (`process.env.NEXT_PUBLIC_*`) rather than through a dynamic lookup.
 * Server-only values are read lazily so that a missing R2 key does not stop the
 * whole site from rendering - the feature that needs it fails instead.
 */

function optional(value: string | undefined): string {
  return (value ?? '').trim();
}

/**
 * The shapes .env.example ships with. A half-filled file is worth catching
 * here: handed to Supabase, `sb_secret_...` comes back as "Invalid API key"
 * from somewhere far away from the variable that caused it.
 */
const PLACEHOLDER = /\.\.\.$|xxxxxxxx/i;

/** Required at run time; throws with a readable message when absent. */
function required(name: string, value: string | undefined): string {
  const v = optional(value);
  if (!v || PLACEHOLDER.test(v)) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local (or add it to the Azure app settings) and fill it in.`,
    );
  }
  return v;
}

export const publicEnv = {
  siteUrl: optional(process.env.NEXT_PUBLIC_SITE_URL) || 'http://localhost:3000',
  siteName: optional(process.env.NEXT_PUBLIC_SITE_NAME) || 'Online Color Page',
  supabaseUrl: optional(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: optional(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  adsenseClient: optional(process.env.NEXT_PUBLIC_ADSENSE_CLIENT),
  gaId: optional(process.env.NEXT_PUBLIC_GA_ID),
  // Search Console's HTML-tag method. Public by design: the whole point is
  // that Google reads it off the page.
  googleSiteVerification: optional(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION),
} as const;

/** True when Supabase is wired up. Lets pages render a setup hint instead of crashing. */
export const isSupabaseConfigured = Boolean(
  publicEnv.supabaseUrl && publicEnv.supabaseAnonKey,
);

export const serverEnv = {
  get supabaseUrl() {
    return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
  get supabaseServiceKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get r2AccountId() {
    return required('R2_ACCOUNT_ID', process.env.R2_ACCOUNT_ID);
  },
  get r2AccessKeyId() {
    return required('R2_ACCESS_KEY_ID', process.env.R2_ACCESS_KEY_ID);
  },
  get r2SecretAccessKey() {
    return required('R2_SECRET_ACCESS_KEY', process.env.R2_SECRET_ACCESS_KEY);
  },
  get r2Bucket() {
    return required('R2_BUCKET', process.env.R2_BUCKET);
  },
  /** Optional CDN / custom-domain base for the bucket. Empty => stream via /api/file. */
  get r2PublicBase() {
    return optional(process.env.R2_PUBLIC_BASE_URL).replace(/\/+$/, '');
  },
  get adminBootstrapEmail() {
    return optional(process.env.ADMIN_BOOTSTRAP_EMAIL).toLowerCase();
  },
} as const;

/**
 * The admin area reads and writes through the service-role key, so a missing
 * one takes the whole dashboard down rather than a single feature. Checked
 * here so the panel can say so instead of throwing on the first query.
 */
export const isSupabaseAdminConfigured = Boolean(
  isSupabaseConfigured &&
    optional(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    !PLACEHOLDER.test(optional(process.env.SUPABASE_SERVICE_ROLE_KEY)),
);

export const isR2Configured = Boolean(
  optional(process.env.R2_ACCOUNT_ID) &&
    optional(process.env.R2_ACCESS_KEY_ID) &&
    optional(process.env.R2_SECRET_ACCESS_KEY) &&
    optional(process.env.R2_BUCKET),
);
