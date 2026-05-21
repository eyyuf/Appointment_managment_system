import React from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const AppInput = ({
  label, value, onChangeText, placeholder, error,
  secureTextEntry, keyboardType, multiline, numberOfLines,
  rightIcon, onRightIconPress, editable = true, style,
}) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, error && styles.inputError, !editable && styles.disabled]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          style={[styles.input, multiline && styles.multiline]}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.icon}>
            <Text style={styles.iconText}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 },
  inputWrap: {
    backgroundColor: colors.bgInput, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, flexDirection: 'row', alignItems: 'center',
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingHorizontal: 14, paddingVertical: 13 },
  multiline: { height: 100, textAlignVertical: 'top' },
  inputError: { borderColor: colors.error },
  disabled: { opacity: 0.6 },
  icon: { paddingRight: 12 },
  iconText: { fontSize: 18 },
  error: { fontSize: 12, color: colors.error, marginTop: 4 },
});

export default AppInput;
