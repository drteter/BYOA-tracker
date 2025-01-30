import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';

interface HabitDashboardProps {
  name: string;
  createdAt: Date;
  thisWeek: number;
  timesPerWeek: number;
  progress: number; // 0 to 100
}

export default function HabitDashboard({ 
  name, 
  createdAt, 
  thisWeek,
  timesPerWeek,
  progress 
}: HabitDashboardProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>
        Created {createdAt.toLocaleDateString()}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{thisWeek}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>

        <View style={styles.progressCircle}>
          <View style={styles.progressCircleContainer}>
            <Svg width={100} height={100}>
              {/* Background circle */}
              <Circle
                cx={50}
                cy={50}
                r={radius}
                stroke="#E5E5EA"
                strokeWidth={8}
                fill="none"
              />
              {/* Progress circle */}
              <Circle
                cx={50}
                cy={50}
                r={radius}
                stroke="#007AFF"
                strokeWidth={8}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </Svg>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>
                {Math.round(progress)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{timesPerWeek}</Text>
          <Text style={styles.statLabel}>Times/Week</Text>
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
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  progressCircle: {
    alignItems: 'center',
  },
  progressCircleContainer: {
    position: 'relative',
    width: 100,
    height: 100,
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
  progressText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
}); 