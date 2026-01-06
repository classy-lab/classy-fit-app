import { Checkbox } from 'expo-checkbox';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { s, vs } from 'react-native-size-matters'

export default function CheckboxComponent() {
  const [isChecked, setChecked] = useState(false);

  return (
    <View style={styles.section}>
      <Checkbox
        style={styles.checkbox}
        value={isChecked}
        onValueChange={setChecked}
        color={isChecked ? '#4630EB' : undefined}
      />
      <Text style={styles.paragraph}>Custom colored checkbox</Text>
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
  },
  paragraph: {
  },
});
