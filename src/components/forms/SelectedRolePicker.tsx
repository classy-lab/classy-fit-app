import React, { useState } from 'react';
import { StyleSheet } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { AppColors } from '../../styles/colors';

const SelectedRolePicker = () => {
  const [role, setRole] = React.useState("");

  const data = [
    { key: '1', value: 'Gym Owner', disabled: true },
    { key: '2', value: 'Member' },
    { key: '3', value: 'Trainer' },
    { key: '4', value: 'Contractor' }
  ]

  return (
    <SelectList
      boxStyles={{
        borderColor: AppColors.grey,
        borderWidth: 1,
        paddingHorizontal: 8,
        backgroundColor: '#F5F6FA'
      }}
      dropdownStyles={{
        borderColor: AppColors.grey2,
        borderWidth: 1,
        marginTop: 8,
      }}
      setSelected={(val) => setRole(val)}
      data={data}
      save="value"
    />
  )
};

const styles = StyleSheet.create({});

export default SelectedRolePicker
