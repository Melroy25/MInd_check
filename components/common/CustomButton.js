/**
 * components/common/CustomButton.js
 * 
 * Keerthana's Tactile Action Button
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function CustomButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const getBackgroundColor = () => {
    if (disabled) return '#94A3B8';
    if (variant === 'secondary') return '#F1F5F9';
    if (variant === 'danger') return '#DC2626';
    return '#16A34A';
  };

  const getTextColor = () => {
    if (variant === 'secondary') return '#0F172A';
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.btnText, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
