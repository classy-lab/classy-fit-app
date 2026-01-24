import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AppColors } from '../../styles/colors';
import { s, vs } from 'react-native-size-matters'

const windowWidth = Dimensions.get('window').width

const SexPicker = () => {
  const [selectedSex, setSelectedSex] = useState('');

  return (
    <View style={styles.container}>
      <Picker
        name="role"
        style={styles.pickerStyles}
        selectedValue={selectedSex}
        onValueChange={(itemValue, itemIndex) => {
          setSelectedSex(itemValue)
          // console.log(selectedSex)
        }
        }>
        <Picker.Item label="Male" value="male" />
        <Picker.Item label="Female" value="female" />
        <Picker.Item label="Other" value="other" />
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
  },
  pickerStyles: {
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    height: s(48),
    borderRadius: s(8),
    width: windowWidth - 64,
    backgroundColor: AppColors.grey,
    marginTop: s(-24) // check
  }
});

export default SexPicker
