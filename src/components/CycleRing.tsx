import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { useTheme, withOpacity } from '../theme';

interface CycleRingProps {
  cycleDay: number;
  cycleLength: number;
  periodDuration: number;
  phase: string;
}

const SIZE = 260;
const C = SIZE / 2; // center = 130
const R = 95;       // ring radius
const SW = 20;      // stroke width

function polarToXY(angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: C + R * Math.cos(rad), y: C + R * Math.sin(rad) };
}

function arcPath(startDeg: number, endDeg: number): string {
  if (endDeg - startDeg <= 0) return '';
  if (endDeg - startDeg >= 360) endDeg = startDeg + 359.9;
  const s = polarToXY(startDeg);
  const e = polarToXY(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function dayToDeg(day: number, cycleLength: number): number {
  return ((day - 1) / cycleLength) * 360;
}

export function CycleRing({ cycleDay, cycleLength, periodDuration, phase }: CycleRingProps) {
  const { colors } = useTheme();
  const ovDay = cycleLength - 14;

  const periodStart = dayToDeg(1, cycleLength);
  const periodEnd = dayToDeg(periodDuration + 1, cycleLength);
  const fertileStart = dayToDeg(Math.max(ovDay - 2, periodDuration + 1), cycleLength);
  const fertileEnd = dayToDeg(ovDay + 3, cycleLength);
  const ovStart = dayToDeg(ovDay, cycleLength);
  const ovEnd = dayToDeg(ovDay + 1, cycleLength);

  const progressDeg = Math.min((cycleDay / cycleLength) * 360, 359.9);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background track */}
        <Circle
          cx={C}
          cy={C}
          r={R}
          stroke={withOpacity(colors.border, 0.8)}
          strokeWidth={SW}
          fill="none"
        />

        {/* Period zone */}
        {periodEnd > periodStart && (
          <Path
            d={arcPath(periodStart, periodEnd)}
            stroke={colors.period}
            strokeWidth={SW}
            strokeOpacity={0.3}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Fertile zone */}
        {fertileEnd > fertileStart && (
          <Path
            d={arcPath(fertileStart, fertileEnd)}
            stroke={colors.fertile}
            strokeWidth={SW}
            strokeOpacity={0.35}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Ovulation marker */}
        <Path
          d={arcPath(ovStart, ovEnd)}
          stroke={colors.ovulation}
          strokeWidth={SW}
          strokeOpacity={0.7}
          fill="none"
          strokeLinecap="round"
        />

        {/* Progress arc */}
        {progressDeg > 0 && (
          <Path
            d={arcPath(0, progressDeg)}
            stroke={colors.brand}
            strokeWidth={SW}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* DAY label */}
        <SvgText
          x={C}
          y={C - 12}
          textAnchor="middle"
          fill={colors.textSecondary}
          fontSize="11"
          fontWeight="600"
        >
          DAY
        </SvgText>

        {/* Cycle day number */}
        <SvgText
          x={C}
          y={C + 16}
          textAnchor="middle"
          fill={colors.textPrimary}
          fontSize="52"
          fontWeight="800"
        >
          {cycleDay}
        </SvgText>

        {/* Phase label */}
        <SvgText
          x={C}
          y={C + 38}
          textAnchor="middle"
          fill={colors.textSecondary}
          fontSize="12"
          fontWeight="500"
        >
          {phase.toUpperCase()}
        </SvgText>
      </Svg>
    </View>
  );
}
