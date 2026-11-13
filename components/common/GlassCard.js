/**
 * components/common/GlassCard.js
 * 
 * Mobile-First Glassmorphic Container Card
 * Engineered specifically for 60fps performance on Android APK builds
 * without heavy GPU blur shaders or frame-dropping backdrop filters.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';

const ROLE_TINTS = {
  patient: '#16A34A',
  doctor: '#2563EB',
  caretaker: '#7C3AED',
};

export default function GlassCard({
  children,
  style,
  roleTint = null,
  ...restProps
}) {
  // Resolve roleTint if a role keyword is passed ('patient' | 'doctor' | 'caretaker')
  const resolvedTint = roleTint
    ? (typeof roleTint === 'string' && ROLE_TINTS[roleTint.toLowerCase()]) || roleTint
    : null;

  return (
    <View
      style={[
        styles.glassCard,
        resolvedTint && { borderColor: resolvedTint },
        style,
      ]}
      {...restProps}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});
