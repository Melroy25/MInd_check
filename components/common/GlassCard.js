/**
 * components/common/GlassCard.js
 * 
 * Keerthana's Mobile-Optimized Glassmorphism Card
 * Uses clean semi-transparency and smooth border highlights without heavy
 * GPU shaders that slow down Android APK performance.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function GlassCard({ children, style, roleTint = null }) {
  return (
    <View
      style={[
        styles.glassCard,
        roleTint && { borderColor: roleTint },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});
