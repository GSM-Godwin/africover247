import React, { useState } from 'react'
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native'
import { Colors } from '../../constants'

interface NumberInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  value: string
  onChangeText: (raw: string) => void
  label?: string
  prefix?: string
  error?: string
}

function formatWithCommas(raw: string): string {
  const num = raw.replace(/[^0-9]/g, '')
  if (!num) return ''
  return parseInt(num, 10).toLocaleString('en-NG')
}

export function NumberInput({
  value,
  onChangeText,
  label,
  prefix,
  error,
  placeholder,
  ...props
}: NumberInputProps) {
  const [display, setDisplay] = useState(value ? formatWithCommas(value) : '')

  function handleChange(text: string) {
    const raw = text.replace(/[^0-9]/g, '')
    const formatted = raw ? parseInt(raw, 10).toLocaleString('en-NG') : ''
    setDisplay(formatted)
    onChangeText(raw)
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={styles.input}
          value={display}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary + '80'}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: Colors.white,
  },
  inputError: { borderColor: Colors.error },
  prefix: { fontSize: 15, color: Colors.textSecondary, marginRight: 4 },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  error: { fontSize: 12, color: Colors.error, marginTop: 4 },
})
