import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg';

import { useThemeColors } from '@/shared/theme/ThemeProvider';

export interface FitnessChartProps {
  /** Weekly fitness values, oldest first. */
  values: number[];
}

const CHART_WIDTH = 350;
const CHART_VIEWBOX_HEIGHT = 130;
const PLOT_HEIGHT = 110;
const PAD = 4;

/**
 * Normalizes `values` into an SVG point string within a
 * `CHART_WIDTH` x `PLOT_HEIGHT` box, min/max-scaled with `PAD` breathing
 * room on every edge — ported from the design source's own `pointsFor()`
 * helper (`pointsFor(pd.fitness, 350, 110, 4)`).
 */
function computeLinePoints(values: number[]): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (CHART_WIDTH - 2 * PAD) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = PAD + i * stepX;
      const y = PLOT_HEIGHT - PAD - ((v - min) / range) * (PLOT_HEIGHT - 2 * PAD);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/**
 * 12-week fitness trend — a line-plus-gradient-fill area chart, ported
 * from the design source's Progress tab. Deliberately drawn inside the
 * top 110px of a 130px-tall viewBox (matching the source's own
 * `pointsFor(pd.fitness, 350, 110, 4)` call against a 130-tall SVG),
 * leaving a fixed 20px of breathing room below the line rather than
 * stretching it to fill the full chart height.
 *
 * The gradient's `id` is per-instance (`useId()`), not a hardcoded
 * string like the source's `fitFill` — react-native-svg resolves
 * `fill="url(#id)"` per-renderer, and a hardcoded id would collide if
 * this component were ever rendered more than once on screen at a time.
 */
export function FitnessChart({ values }: FitnessChartProps) {
  const colors = useThemeColors();
  const gradientId = `fitness-fill-${useId()}`;
  const linePoints = computeLinePoints(values);
  const areaPoints = `${linePoints} ${(CHART_WIDTH - PAD).toFixed(1)},${(PLOT_HEIGHT - PAD).toFixed(1)} ${PAD.toFixed(1)},${(PLOT_HEIGHT - PAD).toFixed(1)}`;

  return (
    <View>
      <Svg
        width="100%"
        height={CHART_VIEWBOX_HEIGHT}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.16} />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <Polyline
          points={linePoints}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
