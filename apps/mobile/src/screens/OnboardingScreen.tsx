import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
  ListRenderItem,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../components/ui'
import { Colors } from '../constants'

const { width } = Dimensions.get('window')

interface OnboardingSlide {
  id: string
  illustration: string
  title: string
  subtitle: string
  accent: string
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    illustration: '🛡️',
    title: 'Browse & Compare',
    subtitle: 'Explore Motor, Health, Marine and more — all AfriGlobal products in one place. See exactly what\'s covered before you commit.',
    accent: Colors.primary,
  },
  {
    id: '2',
    illustration: '📋',
    title: 'Apply in Minutes',
    subtitle: 'Complete your KYC, upload documents, and get verified — entirely from your phone. No office visits, no queues.',
    accent: Colors.accent,
  },
  {
    id: '3',
    illustration: '⚡',
    title: 'Covered Instantly',
    subtitle: 'Pay securely and receive your e-policy certificate the moment payment clears. Track claims in real time.',
    accent: Colors.success,
  },
]

interface OnboardingScreenProps {
  onFinish: () => void
}

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const scrollX = useRef(new Animated.Value(0)).current

  function goNext() {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 })
    } else {
      onFinish()
    }
  }

  const renderSlide: ListRenderItem<OnboardingSlide> = ({ item }) => (
    <View style={styles.slide}>
      <View style={[styles.illustrationContainer, { backgroundColor: item.accent + '15' }]}>
        <View style={[styles.illustrationCircle, { backgroundColor: item.accent + '20' }]}>
          <Text style={styles.illustrationEmoji}>{item.illustration}</Text>
        </View>
        <View style={[styles.decorDot1, { backgroundColor: item.accent + '30' }]} />
        <View style={[styles.decorDot2, { backgroundColor: item.accent + '20' }]} />
        <View style={[styles.decorDot3, { backgroundColor: item.accent + '15' }]} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.slideTitle, { color: item.accent }]}>
          {item.title}
        </Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={onFinish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ]
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            })
            const dotColor = scrollX.interpolate({
              inputRange,
              outputRange: [Colors.border, Colors.primary, Colors.border],
              extrapolate: 'clamp',
            })
            return (
              <Animated.View
                key={index}
                style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
              />
            )
          })}
        </View>

        <Button
          title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={goNext}
          variant="primary"
        />

        {activeIndex === SLIDES.length - 1 && (
          <TouchableOpacity style={styles.loginLink} onPress={onFinish}>
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkAccent}>Log In</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 24,
    marginTop: 80,
    borderRadius: 32,
    overflow: 'hidden',
  },
  illustrationCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationEmoji: {
    fontSize: 80,
  },
  decorDot1: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  decorDot2: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  decorDot3: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 16,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontWeight: '400',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLinkAccent: {
    color: Colors.primary,
    fontWeight: '600',
  },
})
