import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'

const windowWidth = Dimensions.get('window').width

const SelectedRolePicker = () => {
  const [selected, setSelected] = React.useState("");

  const data = [
    { key: '1', value: 'Gym Owner', disabled: false },
    { key: '2', value: 'Member' },
    { key: '3', value: 'Trainer' },
    { key: '4', value: 'Contractor' }
  ]

  return (
    <SelectList
      setSelected={(val) => setSelected(val)}
      data={data}
      save="value"
    />
  )
};

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   paddingTop: 40,
  //   alignItems: 'center',
  // },
  // pickerStyles: {
  //   borderWidth: 1,
  //   borderColor: AppColors.textInputBorderColor,
  //   height: s(48),
  //   borderRadius: s(8),
  //   width: windowWidth - 64,
  //   backgroundColor: AppColors.grey,
  //   marginTop: s(-24) // check
  // }
});

export default SelectedRolePicker
