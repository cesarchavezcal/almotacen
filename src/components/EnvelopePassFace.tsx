import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';

export interface EnvelopePassFaceProps {
  name: string;
  group?: string;
  assigned: number;
  activity: number;
  available: number;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function EnvelopePassFace({
  name,
  group,
  assigned,
  activity,
  available,
  accentColor = colors.systemBlue,
  style,
}: EnvelopePassFaceProps) {
  const isOverspent = available < 0;
  const isDepleted = available === 0;
  const spentPercent = assigned > 0 ? Math.min(100, Math.round((Math.abs(activity) / assigned) * 100)) : 0;

  const statusColor = isOverspent ? colors.error : isDepleted ? colors.textTertiary : colors.success;
  const statusLabel = isOverspent ? 'OVERSPENT' : isDepleted ? 'DEPLETED' : 'FUNDED';

  return (
    <View style={[styles.shadow, style]}>
      <View style={styles.frame}>
        {/* Top Section */}
        <View style={styles.topSection}>
          <View style={styles.headerLeft}>
            {group ? <Text style={styles.groupLabel}>{group.toUpperCase()}</Text> : null}
            <Text style={[typography.headline, { color: '#FFFFFF' }]} numberOfLines={1}>
              {name}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: isOverspent ? 'rgba(255,69,58,0.15)' : 'rgba(48,209,88,0.15)' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Perforated Divider with Cutout Notches */}
        <View style={styles.notchContainer}>
          <View style={styles.leftNotch} />
          <View style={styles.dashedDivider} />
          <View style={styles.rightNotch} />
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.availableLabel}>Available Balance</Text>
              <Text
                style={[
                  typography.title,
                  styles.availableAmount,
                  { color: isOverspent ? colors.error : '#FFFFFF' },
                ]}
              >
                ${available < 0 ? `(${Math.abs(available).toFixed(2)})` : available.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statsCol}>
              <Text style={styles.statDetail}>
                Assigned: <Text style={styles.statBold}>${assigned.toFixed(0)}</Text>
              </Text>
              <Text style={styles.statDetail}>
                Activity: <Text style={[styles.statBold, { color: colors.outflow }]}>-${Math.abs(activity).toFixed(0)}</Text>
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${spentPercent}%`,
                  backgroundColor: isOverspent ? colors.error : isDepleted ? colors.textTertiary : accentColor,
                },
              ]}
            />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>{spentPercent}% spent</Text>
            <Text style={styles.progressText}>Zero-Based Envelope</Text>
          </View>
        </View>

        <View style={styles.innerHighlight} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    marginHorizontal: 16,
  },
  frame: {
    height: 220,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surface1,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  topSection: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notchContainer: {
    height: 20,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftNotch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.canvas,
    marginLeft: -10,
  },
  rightNotch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.canvas,
    marginRight: -10,
  },
  dashedDivider: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
    marginHorizontal: 4,
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  availableLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  availableAmount: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statsCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  statDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statBold: {
    fontWeight: '600',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
