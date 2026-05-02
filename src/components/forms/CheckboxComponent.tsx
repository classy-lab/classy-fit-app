import { Checkbox } from 'expo-checkbox';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { s, vs } from 'react-native-size-matters'
import { AppColors } from '../../styles/colors';

export default function CheckboxComponent() {
  const [acceptTerms, setAcceptTerms] = useState(false);
  // console.log(acceptTerms);

  return (
    <View style={styles.section}>
      <Checkbox
        style={styles.checkbox}
        value={acceptTerms}
        onValueChange={setAcceptTerms}
        color={acceptTerms ? AppColors.blue : undefined}
      />
      <Text>I agree to terms and conditions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: s(16),
  },
  checkbox: {
    margin: 8,
  }
});
