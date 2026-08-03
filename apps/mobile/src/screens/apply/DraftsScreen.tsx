import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '../../components/ui'
import { Colors } from '../../constants'
import api from '../../services/api'

interface Draft {
  id: string
  status: string
  stepCompleted: number
  createdAt: string
  product: { id: string; name: string; category: string }
}

export function DraftsScreen({ navigation }: any) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await api.get('/applications/drafts')
      setDrafts(res.data.filter((d: Draft) => d.status === 'draft'))
    } catch {}
  }, [])

  useEffect(() => {
    fetchDrafts().finally(() => setLoading(false))
  }, [fetchDrafts])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchDrafts()
    setRefreshing(false)
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert(
      'Delete Draft',
      `Are you sure you want to delete your draft application for "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(id)
            try {
              await api.delete(`/applications/${id}`)
              setDrafts((prev) => prev.filter((d) => d.id !== id))
            } catch {
              Alert.alert('Error', 'Could not delete draft. Please try again.')
            } finally {
              setDeleting(null)
            }
          },
        },
      ]
    )
  }

  function renderDraft({ item }: { item: Draft }) {
    const progress = (item.stepCompleted / 4) * 100
    const isDeleting = deleting === item.id

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ApplicationWizard', {
          applicationId: item.id,
          product: item.product,
        })}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        <Card style={styles.draftCard} padding={16}>
          <View style={styles.draftHeader}>
            <View style={[styles.draftIcon, { backgroundColor: '#FEF3E8' }]}>
              <Ionicons name="document-text-outline" size={20} color={Colors.accent} />
            </View>
            <View style={styles.draftInfo}>
              <Text style={styles.draftName} numberOfLines={1}>
                {item.product.name}
              </Text>
              <Text style={styles.draftCategory}>{item.product.category}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.product.name)}
              style={styles.deleteButton}
              disabled={isDeleting}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.draftMeta}>
            <Text style={styles.draftStep}>
              Step {item.stepCompleted} of 4 completed
            </Text>
            <Text style={styles.draftDate}>
              {new Date(item.createdAt).toLocaleDateString('en-NG')}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progress}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>{Math.round(progress)}% complete</Text>
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Applications</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={drafts}
          renderItem={renderDraft}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No saved applications</Text>
              <Text style={styles.emptySubtitle}>
                Applications you start but don't complete will appear here.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Products')}
              >
                <Text style={styles.emptyButtonText}>Browse Products</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, gap: 12 },
  draftCard: { marginBottom: 0 },
  draftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  draftIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftInfo: { flex: 1 },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  draftCategory: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  draftMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  draftStep: { fontSize: 12, color: Colors.textSecondary },
  draftDate: { fontSize: 12, color: Colors.textSecondary },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: { fontSize: 14, fontWeight: '700', color: Colors.white },
})
