import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type NumberStepperProps = {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
};

export default function NumberStepper({ value, onChange, min = 1, max = 7, step = 1 }: NumberStepperProps) {
  const handleIncrement = () => {
    const newValue = Math.min(max, parseInt(value || '0') + step);
    onChange(newValue.toString());
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, parseInt(value || '0') - step);
    onChange(newValue.toString());
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleDecrement}
      >
        <FontAwesome name="minus" size={16} color="#007AFF" />
      </TouchableOpacity>
      
      <Text style={styles.value}>{value}</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleIncrement}
      >
        <FontAwesome name="plus" size={16} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#f8f8f8',
  },
  button: {
    padding: 8,
  },
  value: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
}); 