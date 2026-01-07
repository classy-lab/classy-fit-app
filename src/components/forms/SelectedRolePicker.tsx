import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AppColors } from '../../styles/colors';
import { s, vs } from 'react-native-size-matters'

const windowWidth = Dimensions.get('window').width

const SelectedRolePicker = () => {
  const [selectedRole, setSelectedRole] = useState('gymMember');

  return (
    <View style={styles.container}>
      <Picker
        name="role"
        style={styles.pickerStyles}
        selectedValue={selectedRole}
        onValueChange={(itemValue, itemIndex) => {
          setSelectedRole(itemValue)
          // console.log(selectedRole)
        }
        }>
        {/* <Picker.Item label="" value="" /> */}
        <Picker.Item label="Owner" value="owner" />
        <Picker.Item label="Gym Member" value="gymMember" />
        <Picker.Item label="Trainer" value="trainer" />
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

export default SelectedRolePicker
