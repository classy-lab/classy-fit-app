import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AppColors } from '../../styles/colors';
import { s, vs } from 'react-native-size-matters'

const windowWidth = Dimensions.get('window').width

const GymLocationPicker = () => {
  const [gymLocation, setGymLocation] = useState('Classy Fitness Studio');

  return (
    <View style={styles.container}>
      <Picker
        name="role"
        style={styles.pickerStyles}
        selectedValue={gymLocation}
        onValueChange={(itemValue, itemIndex) => {
          setGymLocation(itemValue)
          // console.log(gymLocation)
        }
        }>
        <Picker.Item label="" value="" />
        <Picker.Item label="Classy Fitness Studio" value="Classy Fitness Studio" />
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

export default GymLocationPicker
