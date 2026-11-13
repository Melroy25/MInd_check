/**
 * components/common/StatusBadge.js
 * 
 * Versatile, Pill-Shaped Mobile Status Badge
 * Engineered for clean visual hierarchy with zero frame drops on Android.
 * Strictly adheres to the No-Emoji Policy.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const THEMES = {
  active:   { bg: '#F0FDF4', text: '#16A34A', border: '#DCFCE7', dot: '#16A34A' },
  applied:  { bg: '#F0FDF4', text: '#16A34A', border: '#DCFCE7', dot: '#16A34A' },
  verified: { bg: '#F0FDF4', text: '#16A34A', border: '#DCFCE7', dot: '#16A34A' },
  high:     { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', dot: '#DC2626' },
  critical: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', dot: '#DC2626' },
  normal:   { bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE', dot: '#2563EB' },
  pending:  { bg: '#FFFBEB', text: '#D97706', border: '#FEF3C7', dot: '#D97706' },
  reverted: { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1', dot: '#64748B' },
  caretaker:{ bg: '#F5F3FF', text: '#7C3AED', border: '#EDE9FE', dot: '#7C3AED' },
};

export default function StatusBadge({
  status = 'active',
  label = null,
  icon = null,
  pulse = false,
  size = 'md',
  style,
  textStyle,
  ...restProps
}) {
  const normalizedKey = status ? String(status).toLowerCase().trim() : 'active';
  const theme = THEMES[normalizedKey] || THEMES.active;
  const isSmall = size === 'sm';

  // Format default label if none provided
  const displayText = label !== null && label !== undefined
    ? label
    : normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
          paddingHorizontal: isSmall ? 8 : 10,
          paddingVertical: isSmall ? 2.5 : 4,
        },
        style,
      ]}
      {...restProps}
    >
      {/* Optional Pulse Indicator Dot */}
      {pulse && (
        <View
          style={[
            styles.dot,
            { backgroundColor: theme.dot },
            isSmall && styles.dotSmall,
          ]}
        />
      )}

      {/* Optional SVG Icon */}
      {icon && (
        <View style={styles.iconWrap}>
          {React.isValidElement(icon)
            ? icon
            : typeof icon === 'function'
            ? React.createElement(icon, { size: isSmall ? 11 : 13, color: theme.text })
            : null}
        </View>
      )}

      <Text
        style={[
          styles.badgeText,
          {
            color: theme.text,
            fontSize: isSmall ? 10.5 : 11.5,
          },
          textStyle,
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999, // True pill shape
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  iconWrap: {
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
