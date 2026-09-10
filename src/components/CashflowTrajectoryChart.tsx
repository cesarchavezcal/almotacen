import React from 'react';
import { StyleSheet, View, Text, LayoutChangeEvent } from 'react-native';
import Svg, {
  Path,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { spacing } from '@/src/theme/spacing';
import { CashflowMetrics, DailyTrajectoryPoint } from '../domain/cashflow/cashflowCalculations';
import { formatCentsToCurrency } from '../domain/ledger/currency';

export interface CashflowTrajectoryChartProps {
  metrics: CashflowMetrics;
  currentDay: number;
  totalDaysInMonth: number;
}

export function CashflowTrajectoryChart({
  metrics,
  currentDay,
  totalDaysInMonth,
}: CashflowTrajectoryChartProps): React.JSX.Element {
  const [chartWidth, setChartWidth] = React.useState<number>(330);
  const chartHeight = 170;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - chartWidth) > 5) {
      setChartWidth(w);
    }
  };

  const paddingLeft = 14;
  const paddingRight = 14;
  const paddingTop = 26;
  const paddingBottom = 22;

  const innerWidth = Math.max(10, chartWidth - paddingLeft - paddingRight);
  const innerHeight = Math.max(10, chartHeight - paddingTop - paddingBottom);

  // Maximum spend ceiling for Y-axis scaling (at least 15% head room above the highest ceiling)
  const maxCents = Math.max(
    metrics.totalBudgetPlannedCents,
    metrics.incomeCeilingCents,
    metrics.projectedEomSpendCents,
    metrics.totalOutflowCents,
    10000
  );
  const yDomainMax = Math.round(maxCents * 1.15);

  const getX = (day: number): number => {
    if (totalDaysInMonth <= 1) return paddingLeft;
    return paddingLeft + ((day - 1) / (totalDaysInMonth - 1)) * innerWidth;
  };

  const getY = (cents: number): number => {
    if (yDomainMax <= 0) return paddingTop + innerHeight;
    const clampedCents = Math.max(0, cents);
    const fraction = clampedCents / yDomainMax;
    return paddingTop + innerHeight - fraction * innerHeight;
  };

  // 1. Build Actual Spend Path (Day 1..currentDay)
  const actualPoints: DailyTrajectoryPoint[] = metrics.dailyPoints.filter(
    (p) => p.actualOutflowCents !== null
  );

  let actualPath = '';
  let actualAreaPath = '';

  if (actualPoints.length > 0) {
    actualPoints.forEach((p, index) => {
      const x = getX(p.day);
      const y = getY(p.actualOutflowCents!);
      if (index === 0) {
        actualPath = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        actualPath += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    });

    const firstX = getX(actualPoints[0].day);
    const lastX = getX(actualPoints[actualPoints.length - 1].day);
    const baselineY = paddingTop + innerHeight;

    actualAreaPath = `${actualPath} L ${lastX.toFixed(1)} ${baselineY.toFixed(1)} L ${firstX.toFixed(1)} ${baselineY.toFixed(1)} Z`;
  }

  // 2. Build Projected Forecast Path (currentDay..Day M)
  const projectedPoints: DailyTrajectoryPoint[] = metrics.dailyPoints.filter(
    (p) => p.projectedOutflowCents !== null
  );

  let projectedPath = '';
  if (actualPoints.length > 0 && projectedPoints.length > 0) {
    const lastActual = actualPoints[actualPoints.length - 1];
    const startX = getX(lastActual.day);
    const startY = getY(lastActual.actualOutflowCents!);
    projectedPath = `M ${startX.toFixed(1)} ${startY.toFixed(1)}`;

    projectedPoints.forEach((p) => {
      const x = getX(p.day);
      const y = getY(p.projectedOutflowCents!);
      projectedPath += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });
  }

  // 3. Coordinates for guidelines
  const yCeiling = getY(metrics.incomeCeilingCents);
  const linearPaceStartX = getX(1);
  const linearPaceStartY = getY(0);
  const linearPaceEndX = getX(totalDaysInMonth);
  const linearPaceEndY = getY(metrics.totalBudgetPlannedCents);

  // Status badge styling
  const statusColor =
    metrics.burnStatus === 'EXCEEDS_INCOME'
      ? colors.error
      : metrics.burnStatus === 'PACING_HIGH'
        ? colors.warning
        : colors.success;

  const statusLabel =
    metrics.burnStatus === 'EXCEEDS_INCOME'
      ? 'EXCEEDS INCOME'
      : metrics.burnStatus === 'PACING_HIGH'
        ? 'PACING HIGH'
        : 'ON TRACK';

  const lastActualPoint =
    actualPoints.length > 0 ? actualPoints[actualPoints.length - 1] : null;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={typography.sectionHdr}>MONTH TRAJECTORY</Text>
          <Text style={styles.headerSubtitle}>
            Day {currentDay} of {totalDaysInMonth} • Projected EOM:{' '}
            <Text style={styles.boldWhite}>
              {formatCentsToCurrency(metrics.projectedEomSpendCents)}
            </Text>
          </Text>
        </View>

        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* SVG Trajectory Chart */}
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.systemBlue} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={colors.systemBlue} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Income Ceiling Horizontal Line (SCEN-019) */}
          <Line
            x1={paddingLeft}
            y1={yCeiling}
            x2={chartWidth - paddingRight}
            y2={yCeiling}
            stroke={metrics.isIncomeCeilingBreached ? colors.error : colors.warning}
            strokeDasharray="4, 4"
            strokeWidth={1.5}
          />
          <SvgText
            x={paddingLeft + 4}
            y={Math.max(12, yCeiling - 6)}
            fill={metrics.isIncomeCeilingBreached ? colors.error : colors.warning}
            fontSize="10"
            fontWeight="600"
          >
            {`Income Ceiling: ${formatCentsToCurrency(metrics.incomeCeilingCents)}`}
          </SvgText>

          {/* Linear Planned Budget Pace Line (SCEN-017) */}
          <Line
            x1={linearPaceStartX}
            y1={linearPaceStartY}
            x2={linearPaceEndX}
            y2={linearPaceEndY}
            stroke={colors.textTertiary}
            strokeDasharray="3, 3"
            strokeWidth={1}
          />

          {/* Actual Spend Area Fill */}
          {actualAreaPath ? (
            <Path d={actualAreaPath} fill="url(#actualGradient)" />
          ) : null}

          {/* Actual Spend Solid Curve (SCEN-017) */}
          {actualPath ? (
            <Path
              d={actualPath}
              stroke={colors.systemBlue}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Dashed Projected EOM Forecast Curve (SCEN-018) */}
          {projectedPath ? (
            <Path
              d={projectedPath}
              stroke={statusColor}
              strokeWidth={2}
              strokeDasharray="5, 4"
              fill="none"
              strokeLinecap="round"
            />
          ) : null}

          {/* Current Day Pointer Dot */}
          {lastActualPoint ? (
            <Circle
              cx={getX(lastActualPoint.day)}
              cy={getY(lastActualPoint.actualOutflowCents!)}
              r={4.5}
              fill={colors.textPrimary}
              stroke={colors.systemBlue}
              strokeWidth={2.5}
            />
          ) : null}
        </Svg>
      </View>

      {/* Chart Legend Footer */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: colors.systemBlue }]} />
          <Text style={styles.legendText}>Actual Spend</Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendIndicator,
              { backgroundColor: statusColor, borderStyle: 'dashed' },
            ]}
          />
          <Text style={styles.legendText}>EOM Forecast</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: colors.textTertiary }]} />
          <Text style={styles.legendText}>Budget Pace</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
  boldWhite: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 10,
    height: 3,
    borderRadius: 1.5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
