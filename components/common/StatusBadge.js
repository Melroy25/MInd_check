/**
 * components/common/StatusBadge.js
 * 
 * Keerthana's Reusable Status Badge Component
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const THEMES = {
  active: { bg: '#F0FDF4', text: '#16A34A', border: '#DCFCE7' },
  high: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  normal: { bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE' },
  pending: { bg: '#FFFBEB', text: '#D97706', border: '#FEF3C7' },
  caretaker: { bg: '#F5F3FF', text: '#7C3AED', border: '#EDE9FE' },
};

export default function StatusBadge({ status = 'active', label = null }) {
  const theme = THEMES[status.toLowerCase()] || THEMES.active;
  const displayText = label || status.toUpperCase();

  return (
    <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <Text style={[styles.badgeText, { color: theme.text }]}>{displayText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
