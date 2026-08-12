import React, { useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '../../components/ui'
import { Colors } from '../../constants'
import { getCategoryIcon, getCategoryColor } from '../../constants/categoryIcons'
import api from '../../services/api'
import type { Product } from '../../types'
import { expandSearchTerms } from '../../utils/searchUtils'

const CATEGORIES = ['All', 'Motor', 'Property', 'Life', 'Health', 'Marine', 'Engineering', 'Financial', 'Liability', 'Agriculture', 'Travel']

const PRICING_TYPE_CONFIG: Record<
  Product['pricingType'],
  { label: string; color: string }
> = {
  fixed: { label: 'Fixed Price', color: Colors.primary },
  calculable: { label: 'Rate Based', color: Colors.success },
  quote_based: { label: 'Get a Quote', color: Colors.accent },
}

function getPriceDisplay(product: Product): string {
  if (product.pricingType === 'fixed' && product.premiumAmount) {
    return `₦${parseFloat(product.premiumAmount).toLocaleString('en-NG')}/yr`
  }
  if (product.pricingType === 'calculable' && product.rate) {
    return `${parseFloat(product.rate) * 100}% of value`
  }
  return 'Request a Quote'
}

export function ProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    api.get('/products')
      .then((res) => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => products.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    if (!search.trim()) return matchesCategory

    const expandedTerms = expandSearchTerms(search)
    const matchesSearch = expandedTerms.some((term) =>
      p.name.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      (Array.isArray(p.keywords) && p.keywords.some((k: string) => k.includes(term)))
    )
    return matchesCategory && matchesSearch
  }), [products, activeCategory, search])

  useEffect(() => {
    if (search.trim().length >= 2) {
      const timer = setTimeout(() => {
        api.post('/search/log', {
          query: search.trim(),
          resultsCount: filtered.length,
          platform: 'mobile',
        }).catch(() => {})
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [search, filtered.length])

  function renderProduct({ item }: { item: Product }) {
    const config = PRICING_TYPE_CONFIG[item.pricingType]
    const iconName = getCategoryIcon(item.category)
    const iconColor = getCategoryColor(item.category)

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        activeOpacity={0.85}
      >
        <Card style={styles.productCard} padding={16}>
          <View style={styles.productHeader}>
            <View style={[styles.iconCircle, { backgroundColor: iconColor.bg }]}>
              <Ionicons name={iconName} size={20} color={iconColor.icon} />
            </View>
            <View style={[styles.pricingBadge, { backgroundColor: config.color + '15' }]}>
              <Text style={[styles.pricingText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>
          <Text style={styles.categoryLabel}>{item.category}</Text>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>{getPriceDisplay(item)}</Text>
            <View style={[
              styles.ctaButton,
              item.pricingType === 'quote_based' ? styles.ctaButtonQuote : styles.ctaButtonFixed,
            ]}>
              <Text style={[
                styles.ctaText,
                item.pricingType === 'quote_based' ? styles.ctaTextQuote : styles.ctaTextFixed,
              ]}>
                {item.pricingType === 'quote_based' ? 'Get Quote' : 'Get Covered'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* --- Header --- */}
      <View style={styles.header}>
        <Text style={styles.title}>Insurance Products</Text>
        <Text style={styles.subtitle}>Find the right cover for you</Text>
      </View>

      {/* --- Search --- */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search e.g. holiday cover, car insurance..."
          placeholderTextColor={Colors.textSecondary + '80'}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* --- Category filters --- */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryPill,
                activeCategory === item && styles.categoryPillActive,
              ]}
              onPress={() => setActiveCategory(item)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  activeCategory === item && styles.categoryPillTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* --- Products list --- */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  categoriesContainer: {
    height: 52,
    justifyContent: 'center',
  },
  categoriesRow: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  categoryPillTextActive: { color: Colors.white, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  productCard: { marginBottom: 0 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pricingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pricingText: { fontSize: 11, fontWeight: '600' },
  productName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  productDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 14 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  ctaButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ctaButtonFixed: {
    backgroundColor: Colors.accent,
  },
  ctaButtonQuote: {
    backgroundColor: Colors.primary,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ctaTextFixed: {
    color: Colors.textDark,
  },
  ctaTextQuote: {
    color: Colors.white,
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 48 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 12 },
})
