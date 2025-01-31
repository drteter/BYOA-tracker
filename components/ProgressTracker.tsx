import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { Svg, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface ProgressTrackerProps {
  totalCount: number;
  yearlyGoal: number;
  startDate: Date;
  counts: Record<string, number>;
}

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showStars?: boolean;
  children: React.ReactNode;
}

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
    const distance = 8 + Math.random() * 7; // Much closer to circle (8-15px instead of 20-30px)
    const scale = 0.8 + Math.random() * 0.4; // Slightly larger scale range

    // Convert polar coordinates to top/right/bottom/left
    if (angle <= Math.PI / 2) { // Top-right quadrant
      positions.push({
        top: -Math.sin(angle) * distance,
        right: -Math.cos(angle) * distance,
        scale,
      });
    } else if (angle <= Math.PI) { // Top-left quadrant
      positions.push({
        top: -Math.sin(angle) * distance,
        left: Math.cos(angle) * distance,
        scale,
      });
    } else if (angle <= Math.PI * 3/2) { // Bottom-left quadrant
      positions.push({
        bottom: Math.sin(angle) * distance,
        left: Math.cos(angle) * distance,
        scale,
      });
    } else { // Bottom-right quadrant
      positions.push({
        bottom: Math.sin(angle) * distance,
        right: -Math.cos(angle) * distance,
        scale,
      });
    }
  }
  return positions;
}

function ProgressCircle({ 
  progress, 
  size = 100, 
  strokeWidth = 8, 
  color = '#007AFF',
  showStars = false,
  children 
}: ProgressCircleProps) {
  const sparkleAnims = React.useMemo(() => 
    Array.from({ length: 8 }, () => new Animated.Value(0)), // Increased to 8 sparkles
    []
  );
  const [sparklePositions] = React.useState(() => generateSparklePositions(8));
  const [rotation, setRotation] = React.useState(0);

  useEffect(() => {
    if (showStars) {
      // Sparkle animations with random delays and durations
      const animateSparkle = (anim: Animated.Value, index: number) => {
        const delay = Math.random() * 2000; // Random delay up to 2s
        const duration = 500 + Math.random() * 500; // Faster pop animation (0.5-1s)
        const holdDuration = 200 + Math.random() * 300; // How long to stay visible

        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.delay(holdDuration),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start(() => {
          // Recursively animate with new random timings
          animateSparkle(anim, index);
        });
      };

      // Start animation for each sparkle
      sparkleAnims.forEach((anim, index) => {
        animateSparkle(anim, index);
      });

      // Existing shimmer animation
      let startTime = Date.now();
      const animate = () => {
        const elapsedTime = Date.now() - startTime;
        const newRotation = (elapsedTime / 20) % 360;
        setRotation(newRotation);
        requestAnimationFrame(animate);
      };
      const animationFrame = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }
  }, [showStars, sparkleAnims]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <View style={styles.progressCircleWrapper}>
      <View style={styles.progressCircleContainer}>
        {showStars && sparkleAnims.map((anim, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.star,
              {
                opacity: anim,
                transform: [
                  { scale: sparklePositions[index].scale },
                  { 
                    scale: anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 1.4, 1], // Pop effect
                    })
                  }
                ],
                ...sparklePositions[index],
              },
            ]}
          >
            ✨
          </Animated.Text>
        ))}
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#B8860B" />
              <Stop offset="25%" stopColor="#FFD700" />
              <Stop offset="50%" stopColor="#DAA520" />
              <Stop offset="75%" stopColor="#FFD700" />
              <Stop offset="100%" stopColor="#B8860B" />
            </LinearGradient>
            {progress > 100 && (
              <LinearGradient 
                id="shimmerGradient" 
                x1="0" 
                y1="0" 
                x2="1" 
                y2="0"
                gradientTransform={`rotate(${rotation}, 0.5, 0.5)`}
              >
                <Stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                <Stop offset="25%" stopColor="rgba(255, 255, 255, 0.1)" />
                <Stop offset="45%" stopColor="rgba(255, 255, 255, 0.7)" />
                <Stop offset="55%" stopColor="rgba(255, 255, 255, 0.7)" />
                <Stop offset="75%" stopColor="rgba(255, 255, 255, 0.1)" />
                <Stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </LinearGradient>
            )}
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E5EA"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {progress > 100 ? (
            <>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#goldGradient)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#shimmerGradient)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                opacity={0.6}
              />
            </>
          ) : (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </Svg>
        <View style={styles.progressTextContainer}>
          {children}
        </View>
      </View>
    </View>
  );
}

export default function ProgressTracker({ totalCount, yearlyGoal, startDate, counts }: ProgressTrackerProps) {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const dayOfYear = Math.ceil((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const daysInYear = 365; // Using fixed 365 for consistent projections
  
  // Calculate projected year-end total based on current pace
  const projectedTotal = Math.round((totalCount / dayOfYear) * daysInYear);
  const projectedProgress = (projectedTotal / yearlyGoal) * 100;

  // Calculate monthly target and progress
  const monthlyTarget = Math.round(yearlyGoal / 12);
  const currentMonth = today.getMonth();
  const monthStart = new Date(today.getFullYear(), currentMonth, 1);
  
  const monthlyTotal = Object.entries(counts).reduce((total, [dateStr, count]) => {
    const date = new Date(dateStr);
    if (date.getMonth() === currentMonth && date.getFullYear() === today.getFullYear()) {
      return total + count;
    }
    return total;
  }, 0);
  const monthlyProgress = (monthlyTotal / monthlyTarget) * 100;

  // Calculate weekly target and progress
  const weeklyTarget = Math.round(yearlyGoal / 52);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weeklyTotal = Object.entries(counts).reduce((total, [dateStr, count]) => {
    const date = new Date(dateStr);
    if (date >= weekStart && date <= today) {
      return total + count;
    }
    return total;
  }, 0);
  const weeklyProgress = (weeklyTotal / weeklyTarget) * 100;

  // Format numbers with commas for thousands and one decimal place
  const formatNumber = (num: number) => {
    const roundedNum = Math.round(num * 10) / 10;
    const [whole, decimal] = roundedNum.toString().split('.');
    const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimal ? `${formattedWhole}.${decimal}` : formattedWhole;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>

      <View style={styles.gridContainer}>
        <View style={styles.gridItem}>
          <Text style={styles.gridTitle}>Annual Progress</Text>
          <ProgressCircle progress={(totalCount / yearlyGoal) * 100}>
            <Text style={styles.progressPercent}>
              {Math.round((totalCount / yearlyGoal) * 100)}%
            </Text>
          </ProgressCircle>
          <View style={styles.belowCircleContainer}>
            <Text style={styles.progressCount}>{formatNumber(totalCount)}</Text>
            <Text style={styles.progressLabel}>of {formatNumber(yearlyGoal)}</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridTitle}>Projected Year-End</Text>
          <ProgressCircle 
            progress={projectedProgress} 
            color={projectedProgress > 100 ? '#FFB800' : '#007AFF'}
            showStars={projectedProgress > 100}
          >
            <Text style={[styles.progressPercent, { color: projectedProgress > 100 ? '#FFB800' : '#007AFF' }]}>
              {Math.round(projectedProgress)}%
            </Text>
          </ProgressCircle>
          <View style={styles.belowCircleContainer}>
            <Text style={styles.progressCount}>{formatNumber(projectedTotal)}</Text>
            <Text style={styles.progressLabel}>at current pace</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridTitle}>Monthly Pace</Text>
          <ProgressCircle 
            progress={monthlyProgress}
            color={monthlyProgress > 100 ? '#FFB800' : '#007AFF'}
            showStars={monthlyProgress > 100}
          >
            <Text style={[styles.progressPercent, { color: monthlyProgress > 100 ? '#FFB800' : '#007AFF' }]}>
              {Math.round(monthlyProgress)}%
            </Text>
          </ProgressCircle>
          <View style={styles.belowCircleContainer}>
            <Text style={styles.progressCount}>{formatNumber(monthlyTotal)}</Text>
            <Text style={styles.progressLabel}>target: {formatNumber(monthlyTarget)}/month</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.gridTitle}>Weekly Pace</Text>
          <ProgressCircle 
            progress={weeklyProgress}
            color={weeklyProgress > 100 ? '#FFB800' : '#007AFF'}
            showStars={weeklyProgress > 100}
          >
            <Text style={[styles.progressPercent, { color: weeklyProgress > 100 ? '#FFB800' : '#007AFF' }]}>
              {Math.round(weeklyProgress)}%
            </Text>
          </ProgressCircle>
          <View style={styles.belowCircleContainer}>
            <Text style={styles.progressCount}>{formatNumber(weeklyTotal)}</Text>
            <Text style={styles.progressLabel}>target: {formatNumber(weeklyTarget)}/week</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10,
  },
  gridItem: {
    width: '50%',
    padding: 10,
  },
  gridTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  progressCircleWrapper: {
    alignItems: 'center',
  },
  progressCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  progressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  belowCircleContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  star: {
    position: 'absolute',
    fontSize: 18, // Slightly larger
  },
}); 