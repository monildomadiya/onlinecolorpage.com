import { ImageResponse } from 'next/og';
import { getSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const alt = 'Free printable and online coloring pages for kids';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Site-wide social preview card, rendered on demand.
 *
 * Individual coloring pages override this in their own metadata with the real
 * artwork thumbnail, which previews far better than a generated card.
 */
export default async function OgImage() {
  const { site } = await getSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #8b4ff5 0%, #c0a6ff 55%, #ffc83d 100%)',
          fontFamily: 'sans-serif',
          padding: 64,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#fff8ef',
            borderRadius: 48,
            padding: '56px 72px',
            boxShadow: '0 24px 0 rgba(43,33,64,0.18)',
          }}
        >
          <div style={{ fontSize: 104, lineHeight: 1 }}>🖍️ 🎨 ✏️</div>

          <div
            style={{
              marginTop: 28,
              fontSize: 72,
              fontWeight: 800,
              color: '#2b2140',
              letterSpacing: -2,
              textAlign: 'center',
            }}
          >
            {site.name}
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 34,
              fontWeight: 600,
              color: '#5b5173',
              textAlign: 'center',
              maxWidth: 820,
            }}
          >
            {site.tagline}
          </div>

          <div
            style={{
              marginTop: 32,
              display: 'flex',
              gap: 16,
            }}
          >
            {['Colour online', 'Download PNG', 'Print PDF'].map((label) => (
              <div
                key={label}
                style={{
                  background: '#8b4ff5',
                  color: '#ffffff',
                  fontSize: 26,
                  fontWeight: 700,
                  padding: '14px 28px',
                  borderRadius: 999,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
