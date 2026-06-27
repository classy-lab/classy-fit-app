// @ts-nocheck
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';

const HoneypotField = ({ value, onChangeText }) => {
  return (
    <View style={styles.hiddenContainer} aria-hidden={true}>
      <Text style={styles.formLabel}>Website</Text>
      <TextInput
        style={styles.hiddenInput}
        placeholder="Website"
        value={value}
        onChangeText={onChangeText}
        tabIndex={-1} // Prevent keyboard navigation
        importantForAccessibility="no"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Hide off-screen instead of using display: none 
  hiddenContainer: {
    position: 'absolute',
    left: -1000,
    top: -1000,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
  hiddenInput: {
    width: 0,
    height: 0,
  },
});

export default HoneypotField;
