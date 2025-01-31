import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import { HabitType, TimeFrame } from '../types/habit';
import { habitService } from '../services/habitService';
import NumberStepper from './NumberStepper';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: HabitType;
    goal?: number;
    timeFrame?: TimeFrame;
    weeklyFrequency?: number;
  }) => void;
  initialValues?: {
    name?: string;
    type?: HabitType;
    goal?: number;
    timeFrame?: TimeFrame;
    weeklyFrequency?: number;
  };
  isEditing?: boolean;
  onHabitAdded?: () => void;
}

export default function AddHabitModal({ visible, onClose, onSubmit, initialValues, isEditing, onHabitAdded }: AddHabitModalProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [type, setType] = useState<HabitType>(initialValues?.type || 'yesno');
  const [goal, setGoal] = useState(initialValues?.goal?.toString() || '');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(initialValues?.timeFrame || 'day');
  const [weeklyFrequency, setWeeklyFrequency] = useState(
    initialValues?.weeklyFrequency?.toString() || '5'
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name || '');
      setType(initialValues?.type || 'yesno');
      setGoal(initialValues?.goal?.toString() || '');
      setTimeFrame(initialValues?.timeFrame || 'day');
      setWeeklyFrequency(initialValues?.weeklyFrequency?.toString() || '5');
    }
  }, [visible, initialValues]);

  useEffect(() => {
    if (initialValues) {
      setWeeklyFrequency(initialValues.weeklyFrequency?.toString() || '5');
    }
  }, [initialValues]);

  const handleSubmit = async () => {
    if (!name || !type) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit({
        name,
        type,
        goal: goal ? parseInt(goal, 10) : undefined,
        timeFrame,
        weeklyFrequency: parseInt(weeklyFrequency, 10),
      });
      onClose();
      if (onHabitAdded) onHabitAdded();
    } catch (error) {
      console.error('Error submitting habit:', error);
      Alert.alert('Error', 'Failed to submit habit');
    } finally {
      setIsLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>{isEditing ? 'Edit Habit' : 'Add New Habit'}</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter habit name"
              placeholderTextColor="#999"
              autoCapitalize="sentences"
              returnKeyType="done"
              blurOnSubmit={true}
              enablesReturnKeyAutomatically={true}
              onSubmitEditing={() => {
                Keyboard.dismiss();
              }}
            />

            <Text style={styles.label}>Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'yesno' && styles.selectedType]}
                onPress={() => setType('yesno')}
              >
                <Text style={[styles.typeText, type === 'yesno' && styles.selectedTypeText]}>
                  Yes/No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'count' && styles.selectedType]}
                onPress={() => setType('count')}
              >
                <Text style={[styles.typeText, type === 'count' && styles.selectedTypeText]}>
                  Count
                </Text>
              </TouchableOpacity>
            </View>

            {type === 'yesno' && (
              <>
                <Text style={styles.label}>Weekly Goal</Text>
                <NumberStepper
                  value={weeklyFrequency}
                  onChange={setWeeklyFrequency}
                  min={1}
                  max={7}
                />
              </>
            )}

            {type === 'count' && (
              <>
                <Text style={styles.label}>Goal</Text>
                <View style={styles.goalContainer}>
                  <TextInput
                    style={[styles.input, styles.goalInput]}
                    value={goal}
                    onChangeText={setGoal}
                    placeholder="Enter goal"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                    returnKeyType="done"
                    onSubmitEditing={dismissKeyboard}
                  />
                  
                  <View style={styles.timeFrameContainer}>
                    {(['day', 'week', 'month', 'year'] as TimeFrame[]).map((tf) => (
                      <TouchableOpacity
                        key={tf}
                        style={[styles.timeFrameButton, timeFrame === tf && styles.selectedTimeFrame]}
                        onPress={() => setTimeFrame(tf)}
                      >
                        <Text style={[styles.timeFrameText, timeFrame === tf && styles.selectedTimeFrameText]}>
                          {tf.charAt(0).toUpperCase() + tf.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  selectedType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTypeText: {
    color: 'white',
  },
  goalContainer: {
    marginBottom: 16,
  },
  goalInput: {
    marginBottom: 8,
  },
  timeFrameContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeFrameButton: {
    flex: 1,
    minWidth: '22%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  selectedTimeFrame: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeFrameText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeFrameText: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saveButtonText: {
    color: 'white',
  },
}); 