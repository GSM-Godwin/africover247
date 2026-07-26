import React, { useRef } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { Colors } from '../../constants'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  error?: boolean
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  error,
}: OtpInputProps) {
  const inputs = useRef<(TextInput | null)[]>([])
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  function handleChange(index: number, text: string) {
    const char = text.replace(/\D/g, '').slice(-1)
    const next = digits.map((d, i) => (i === index ? char : d))
    onChange(next.join(''))
    if (char && index < length - 1) {
      inputs.current[index + 1]?.focus()
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  return (
    <View style={styles.container}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(el) => { inputs.current[index] = el }}
          style={[
            styles.box,
            digit ? styles.boxFilled : null,
            error ? styles.boxError : null,
          ]}
          value={digit}
          onChangeText={(text) => handleChange(index, text)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  boxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  boxError: { borderColor: Colors.error },
})
