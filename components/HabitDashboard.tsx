import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

interface HabitDashboardProps {
  name: string;
  createdAt: Date;
  thisWeek: number;
  timesPerWeek: number;
  progress: number; // 0 to 100
  isGoalAchieved: boolean;
}

const formatCreatedDate = (date: any) => {
  if (typeof date === 'object' && date.toDate) {
    return date.toDate().toLocaleDateString();
  }
  return new Date(date).toLocaleDateString();
};

export default function HabitDashboard({ 
  name, 
  createdAt, 
  thisWeek,
  timesPerWeek,
  progress,
  isGoalAchieved = false
}: HabitDashboardProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.outerContainer}>
      {isGoalAchieved && (
        <View style={styles.celebrationBanner}>
          <Text style={styles.celebrationText}>
            YOU FUCKING DID IT GOOD FOR YOU
          </Text>
        </View>
      )}
      <LinearGradient
        colors={isGoalAchieved 
          ? ['#DAA520', '#B8860B', '#8B6914'] 
          : ['#ffffff', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.titleRow}>
          <Text style={[
            styles.title, 
            isGoalAchieved && { color: '#FFFFFF' }
          ]}>
            {name}
          </Text>
          {isGoalAchieved && (
            <FontAwesome 
              name="check-circle" 
              size={24} 
              color="#FFFFFF" 
              style={styles.checkmark}
            />
          )}
        </View>
        <Text style={[
          styles.subtitle,
          isGoalAchieved && { color: '#FFFFFF' }
        ]}>
          Created {formatCreatedDate(createdAt)}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              isGoalAchieved && { color: '#FFFFFF' }
            ]}>{thisWeek}</Text>
            <Text style={[
              styles.statLabel,
              isGoalAchieved && { color: '#FFFFFF' }
            ]}>This Week</Text>
          </View>

          <View style={styles.progressCircle}>
            <View style={styles.progressCircleContainer}>
              <Svg width={100} height={100}>
                <Circle
                  cx={50}
                  cy={50}
                  r={radius}
                  stroke={isGoalAchieved ? '#FFFFFF40' : '#E5E5EA'}
                  strokeWidth={8}
                  fill="none"
                />
                <Circle
                  cx={50}
                  cy={50}
                  r={radius}
                  stroke={isGoalAchieved ? '#FFFFFF' : '#007AFF'}
                  strokeWidth={8}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </Svg>
              <View style={styles.progressTextContainer}>
                <Text style={[
                  styles.progressText,
                  isGoalAchieved && { color: '#FFFFFF' }
                ]}>
                  {Math.round(progress)}%
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              isGoalAchieved && { color: '#FFFFFF' }
            ]}>{timesPerWeek}</Text>
            <Text style={[
              styles.statLabel,
              isGoalAchieved && { color: '#FFFFFF' }
            ]}>Times/Week</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  container: {
    padding: 20,
    borderRadius: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  checkmark: {
    marginLeft: 8,
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
  celebrationBanner: {
    backgroundColor: '#8B6914',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  celebrationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
}); 