/**
 * components/common/CustomButton.js
 * 
 * Tactile Action Button with Responsive Feedback & Role Variants
 * Engineered for 60fps responsiveness on Android APK builds.
 * Strictly adheres to the No-Emoji Policy.
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

const VARIANTS = {
  primary: {
    bg: '#16A34A',
    text: '#FFFFFF',
    border: 'transparent',
    shadowColor: '#16A34A',
  },
  doctor: {
    bg: '#2563EB',
    text: '#FFFFFF',
    border: 'transparent',
    shadowColor: '#2563EB',
  },
  caretaker: {
    bg: '#7C3AED',
    text: '#FFFFFF',
    border: 'transparent',
    shadowColor: '#7C3AED',
  },
  secondary: {
    bg: '#FFFFFF',
    text: '#0F172A',
    border: '#CBD5E1',
    shadowColor: '#0F172A',
  },
  danger: {
    bg: '#DC2626',
    text: '#FFFFFF',
    border: 'transparent',
    shadowColor: '#DC2626',
  },
};

export default function CustomButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'doctor' | 'caretaker' | 'secondary' | 'danger'
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left', // 'left' | 'right'
  size = 'md', // 'sm' | 'md' | 'lg'
  style,
  textStyle,
  activeOpacity = 0.82,
  ...restProps
}) {
  const currentVariant = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;

  const getBackgroundColor = () => {
    if (isDisabled && variant !== 'secondary') return '#94A3B8';
    if (isDisabled && variant === 'secondary') return '#F8FAFC';
    return currentVariant.bg;
  };

  const getTextColor = () => {
    if (isDisabled && variant === 'secondary') return '#94A3B8';
    return currentVariant.text;
  };

  const getBorderColor = () => {
    if (variant === 'secondary') {
      return isDisabled ? '#E2E8F0' : currentVariant.border;
    }
    return 'transparent';
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const renderIcon = () => {
    if (!icon) return null;
    return (
      <View style={iconPosition === 'right' ? styles.iconRight : styles.iconLeft}>
        {React.isValidElement(icon)
          ? icon
          : typeof icon === 'function'
          ? React.createElement(icon, {
              size: isSmall ? 15 : isLarge ? 20 : 18,
              color: getTextColor(),
            })
          : null}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          paddingVertical: isSmall ? 10 : isLarge ? 16 : 14,
          paddingHorizontal: isSmall ? 16 : isLarge ? 24 : 20,
          borderRadius: isSmall ? 12 : isLarge ? 16 : 14,
          shadowColor: currentVariant.shadowColor,
          elevation: isDisabled ? 0 : variant === 'secondary' ? 1 : 3,
        },
        isDisabled && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={activeOpacity}
      {...restProps}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {iconPosition === 'left' && renderIcon()}
          {title ? (
            <Text
              style={[
                styles.btnText,
                {
                  color: getTextColor(),
                  fontSize: isSmall ? 13 : isLarge ? 16 : 15,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : null}
          {iconPosition === 'right' && renderIcon()}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  btnDisabled: {
    opacity: 0.72,
    shadowOpacity: 0,
    elevation: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRight: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
