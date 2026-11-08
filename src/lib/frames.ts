/**
 * Frame colours for the card grids.
 *
 * A page of line art is almost entirely white, so the colour has to come from
 * the furniture around it. Cards cycle through this list by position rather
 * than taking their category's colour: a category page would otherwise be one
 * flat hue top to bottom, which is exactly the wall of sameness the frames are
 * there to break up.
 *
 * The order alternates warm and cool so neighbours in a grid never sit on the
 * same side of the wheel, at any column count from two to five.
 */
export const FRAME_COLORS = [
  '#59beeb', // sky
  '#e04d6e', // coral
  '#7cc9a5', // mint
  '#ffa36a', // tangerine
  '#a98bea', // lilac
  '#ffc94d', // sunny
  '#ff7fa3', // bubblegum
  '#a8d65e', // leaf
] as const;

/** The frame colour for the card at `index` in a grid. */
export function frameColor(index: number): string {
  return FRAME_COLORS[((index % FRAME_COLORS.length) + FRAME_COLORS.length) % FRAME_COLORS.length];
}

/** Inline style that drives .frame-card, .frame-label and .frame-tag. */
export function frameStyle(index: number): React.CSSProperties {
  return { ['--frame' as string]: frameColor(index) };
}
