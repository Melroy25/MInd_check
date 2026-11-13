/**
 * components/common/QuickActionTile.js
 * 
 * Standardized "At your Fingertip" Grid Tile Component
 * Engineered for 2x2 and 3x2 action grids across Patient, Doctor, and Caretaker portals.
 * 
 * Features:
 * - Large touch target with responsive tactile feedback (activeOpacity: 0.82)
 * - Clean centering and modern visual hierarchy
 * - Icon container with 16px border radius
 * - Notification badge at top-right
 * - Strict No-Emoji Policy: Only clean SVG line icons
 */
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';

const ROLE_COLORS = {
  patient:   { tint: '#16A34A', bg: '#F0FDF4' },
  doctor:    { tint: '#2563EB', bg: '#EFF6FF' },
  caretaker: { tint: '#7C3AED', bg: '#F5F3FF' },
};

const KNOWN_TINTS = {
  '#16A34A': '#F0FDF4',
  '#16a34a': '#F0FDF4',
  '#2563EB': '#EFF6FF',
  '#2563eb': '#EFF6FF',
  '#7C3AED': '#F5F3FF',
  '#7c3aed': '#F5F3FF',
  '#DC2626': '#FEF2F2',
  '#dc2626': '#FEF2F2',
  '#D97706': '#FFFBEB',
  '#d97706': '#FFFBEB',
  '#EA580C': '#FFF7ED',
  '#ea580c': '#FFF7ED',
};

export default function QuickActionTile({
  icon,
  title,
  subtitle,
  badgeCount,
  onPress,
  tintColor = '#16A34A',
  iconBg = null,
  disabled = false,
  style,
  titleStyle,
  subtitleStyle,
  activeOpacity = 0.82,
  ...restProps
}) {
  // Resolve role name if provided (e.g. 'patient' | 'doctor' | 'caretaker')
  const roleConfig = typeof tintColor === 'string' ? ROLE_COLORS[tintColor.toLowerCase()] : null;
  const resolvedTint = roleConfig ? roleConfig.tint : tintColor;
  const resolvedBg = iconBg || (roleConfig ? roleConfig.bg : (KNOWN_TINTS[resolvedTint] || '#F1F5F9'));

  const hasBadge = badgeCount !== undefined && badgeCount !== null && badgeCount !== 0 && badgeCount !== false && badgeCount !== '';
  const isDotBadge = badgeCount === true;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function') {
      return React.createElement(icon, { size: 26, color: resolvedTint });
    }
    return null;
  };

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        disabled && styles.tileDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      {...restProps}
    >
      {/* 16px Radius Icon Box with Notification Badge */}
      <View style={[styles.iconBox, { backgroundColor: resolvedBg }]}>
        {renderIcon()}

        {/* Top-Right Notification Badge */}
        {hasBadge && (
          <View
            style={[
              isDotBadge ? styles.badgeDot : styles.badgePill,
              { backgroundColor: resolvedTint },
            ]}
          >
            {!isDotBadge && (
              <Text style={styles.badgeText}>
                {typeof badgeCount === 'number' && badgeCount > 99 ? '99+' : badgeCount}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, titleStyle]} numberOfLines={1}>
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle ? (
        <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 112,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tileDisabled: {
    opacity: 0.6,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  badgePill: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    lineHeight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 3,
    textAlign: 'center',
  },
});
