import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const AppButton = ({
  title, onPress, loading = false, disabled = false,
  variant = 'primary', size = 'md', style, textStyle,
}) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8} style={style}>
        <LinearGradient
          colors={isDisabled ? [colors.bgElevated, colors.bgElevated] : [colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.btn, styles[size]]}
        >
          {loading
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={[styles.btnText, textStyle]}>{title}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress} disabled={isDisabled} activeOpacity={0.8}
      style={[styles.btn, styles[size], styles[variant], isDisabled && styles.disabled, style]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} size="small" />
        : <Text style={[styles.btnText, variant === 'outline' && styles.outlineText, textStyle]}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  btn: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  sm: { paddingVertical: 8, paddingHorizontal: 16 },
  md: { paddingVertical: 14, paddingHorizontal: 24 },
  lg: { paddingVertical: 18, paddingHorizontal: 32 },
  outline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.error },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  outlineText: { color: colors.primary },
});

export default AppButton;
