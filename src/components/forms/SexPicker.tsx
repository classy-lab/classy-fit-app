import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { AppColors } from '../../styles/colors'

const SexPicker = () => {
  const [selected, setSelected] = React.useState("")

  const data = [
    { key: '1', value: 'Male', disabled: false },
    { key: '2', value: 'Female' },
    { key: '3', value: 'Other' },
  ]

  return (
    <SelectList
      boxStyles={{
        borderColor: AppColors.grey,
        borderWidth: 1,
        paddingHorizontal: 8,
      }}
      dropdownStyles={{
        borderColor: AppColors.grey2,
        borderWidth: 1,
        marginTop: 8,
      }}
      setSelected={(val) => setSelected(val)}
      data={data}
      save="value"
    />
  );
};

const styles = StyleSheet.create({});

export default SexPicker
