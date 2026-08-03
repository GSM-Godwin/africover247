import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native'
import Svg, { Circle, Ellipse } from 'react-native-svg'
import { Colors } from '../constants'

const { width, height } = Dimensions.get('window')

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.9)).current
  const lineWidth = useRef(new Animated.Value(0)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current
  const poweredOpacity = useRef(new Animated.Value(0)).current
  const progressWidth = useRef(new Animated.Value(0)).current
  const cloudOpacity = useRef(new Animated.Value(0)).current
  const gradientOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cloudOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(gradientOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(lineWidth, {
        toValue: width * 0.4,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(poweredOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressWidth, {
        toValue: width * 0.5,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.delay(300),
    ]).start(() => onFinish())
  }, [])

  return (
    <View style={styles.container}>

      <View style={styles.topStripe} />

      <Animated.View style={[styles.cloudTopLeft, { opacity: cloudOpacity }]}>
        <Svg width={180} height={120} viewBox="0 0 180 120">
          <Circle cx="90" cy="70" r="50" fill={Colors.primaryLight} />
          <Circle cx="50" cy="80" r="36" fill={Colors.primaryLight} />
          <Circle cx="130" cy="80" r="40" fill={Colors.primaryLight} />
          <Circle cx="90" cy="50" r="40" fill={Colors.primaryLight} />
          <Circle cx="60" cy="55" r="30" fill={Colors.primaryLight} />
          <Circle cx="120" cy="58" r="32" fill={Colors.primaryLight} />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.cloudTopRight, { opacity: cloudOpacity }]}>
        <Svg width={120} height={80} viewBox="0 0 120 80">
          <Circle cx="60" cy="50" r="32" fill={Colors.primaryLight} />
          <Circle cx="35" cy="55" r="24" fill={Colors.primaryLight} />
          <Circle cx="85" cy="55" r="26" fill={Colors.primaryLight} />
          <Circle cx="60" cy="36" r="26" fill={Colors.primaryLight} />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.gradientCorner, { opacity: gradientOpacity }]}>
        <Svg width={width * 0.75} height={width * 0.75} viewBox="0 0 300 300">
          <Ellipse
            cx="300"
            cy="300"
            rx="260"
            ry="220"
            fill={Colors.primary}
            fillOpacity={0.08}
          />
          <Ellipse
            cx="300"
            cy="300"
            rx="180"
            ry="160"
            fill={Colors.primary}
            fillOpacity={0.1}
          />
          <Ellipse
            cx="300"
            cy="300"
            rx="110"
            ry="100"
            fill={Colors.primary}
            fillOpacity={0.12}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.cloudBottomLeft, { opacity: cloudOpacity }]}>
        <Svg width={100} height={70} viewBox="0 0 100 70">
          <Circle cx="50" cy="45" r="28" fill={Colors.accentLight} />
          <Circle cx="28" cy="50" r="20" fill={Colors.accentLight} />
          <Circle cx="72" cy="50" r="22" fill={Colors.accentLight} />
          <Circle cx="50" cy="32" r="22" fill={Colors.accentLight} />
        </Svg>
      </Animated.View>

      <View style={styles.center}>
        <Animated.View style={[
          styles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.divider, { width: lineWidth }]} />

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Protection, without the paperwork.
        </Animated.Text>
      </View>

      <View style={styles.bottom}>
        <Animated.View style={[styles.poweredContainer, { opacity: poweredOpacity }]}>
          <Text style={styles.poweredBy}>Powered by</Text>
          <Text style={styles.companyName}>
            AfriGlobal Insurance Brokers Limited
          </Text>
          <Text style={styles.naicom}>NAICOM Licensed</Text>
        </Animated.View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topStripe: {
    width: '100%',
    height: 5,
    backgroundColor: Colors.primary,
    zIndex: 10,
  },

  cloudTopLeft: {
    position: 'absolute',
    top: -20,
    left: -30,
    zIndex: 1,
  },
  cloudTopRight: {
    position: 'absolute',
    top: 30,
    right: -20,
    zIndex: 1,
  },
  cloudBottomLeft: {
    position: 'absolute',
    bottom: height * 0.18,
    left: -10,
    zIndex: 1,
  },
  gradientCorner: {
    position: 'absolute',
    bottom: -width * 0.25,
    right: -width * 0.25,
    zIndex: 1,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 5,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: width * 0.82,
    height: 120,
    resizeMode: 'contain',
  },
  divider: {
    height: 2.5,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.4,
  },

  bottom: {
    alignItems: 'center',
    paddingBottom: 48,
    paddingHorizontal: 32,
    width: '100%',
    zIndex: 5,
  },
  poweredContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  poweredBy: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 3,
  },
  naicom: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  progressTrack: {
    width: width * 0.5,
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
})
