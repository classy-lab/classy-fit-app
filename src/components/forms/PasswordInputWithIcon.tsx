import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
// Use Feather or MaterialCommunityIcons as an example
import Icon from 'react-native-vector-icons/Feather';
// For Expo projects, use: 
// import { Feather as Icon } from '@expo/vector-icons'; 

const PasswordInputWithIcon = ({ placeholder, value, onChangeText }) => {
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [rightIcon, setRightIcon] = useState('eye');

  const handlePasswordVisibility = () => {
    if (rightIcon === 'eye') {
      setRightIcon('eye-off');
      setSecureTextEntry(false);
    } else {
      setRightIcon('eye');
      setSecureTextEntry(true);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCorrect={false}
        textContentType="password" // Helps with autofill
      />
      <TouchableOpacity onPress={handlePasswordVisibility} style={styles.iconButton}>
        <Icon name={rightIcon} size={20} color="#888" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingRight: 10, // Make space for the icon
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 0, // No extra left padding needed
  },
  iconButton: {
    padding: 5,
  },
});

export default PasswordInputWithIcon;
