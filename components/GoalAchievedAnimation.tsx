import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Svg, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SparklePosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  scale: number;
}

function generateSparklePositions(count: number): SparklePosition[] {
  const positions: SparklePosition[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const distance = 8 + Math.random() * 7;
    const scale = 0.8 + Math.random() * 0.4;

    if (angle <= Math.PI / 2) {
      positions.push({
        top: -Math.sin(angle) * distance,
        right: -Math.cos(angle) * distance,
        scale,
      });
    } else if (angle <= Math.PI) {
      positions.push({
        top: -Math.sin(angle) * distance,
        left: Math.cos(angle) * distance,
        scale,
      });
    } else if (angle <= Math.PI * 3/2) {
      positions.push({
        bottom: Math.sin(angle) * distance,
        left: Math.cos(angle) * distance,
        scale,
      });
    } else {
      positions.push({
        bottom: Math.sin(angle) * distance,
        right: -Math.cos(angle) * distance,
        scale,
      });
    }
  }
  return positions;
}

export default function GoalAchievedAnimation({ size = 60 }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 3000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();
  }, []);

  const sparklePositions = generateSparklePositions(8);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.checkContainer,
          {
            transform: [
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <FontAwesome name="check-circle" size={size} color="#FFD700" />
        {sparklePositions.map((position, index) => (
          <Animated.View
            key={index}
            style={[
              styles.sparkle,
              {
                ...position,
                opacity: sparkleOpacity,
                transform: [
                  { scale: position.scale },
                  {
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <FontAwesome name="star" size={10} color="#FFD700" />
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  checkContainer: {
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
  },
}); 