import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { Colors } from '../../constants'

interface ConfirmAction {
  label: string
  onPress: () => void
  style?: 'default' | 'destructive' | 'cancel'
}

interface ConfirmModalProps {
  visible: boolean
  title: string
  message?: string
  actions: ConfirmAction[]
  onClose: () => void
}

export function ConfirmModal({
  visible,
  title,
  message,
  actions,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.container}>

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
          </View>

          <View style={styles.actions}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={action.label}
                style={[
                  styles.action,
                  index < actions.length - 1 && styles.actionBorder,
                  action.style === 'destructive' && styles.actionDestructive,
                  action.style === 'cancel' && styles.actionCancel,
                ]}
                onPress={() => {
                  onClose()
                  action.onPress()
                }}
              >
                <Text style={[
                  styles.actionText,
                  action.style === 'destructive' && styles.actionTextDestructive,
                  action.style === 'cancel' && styles.actionTextCancel,
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
  action: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  actionDestructive: {},
  actionCancel: {
    backgroundColor: '#F8FAFC',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionTextDestructive: {
    color: Colors.error,
  },
  actionTextCancel: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
})
