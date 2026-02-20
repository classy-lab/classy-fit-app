import React, { useState } from 'react';
import { StyleSheet } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { AppColors } from '../../styles/colors'

const PreferredContact = () => {
  const [selected, setSelected] = React.useState("");
  const data = [
    { key: '1', value: 'Phone', disabled: false },
    { key: '2', value: 'WhatsApp' },
    { key: '3', value: 'Email' },
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
  )
};

const styles = StyleSheet.create({});

export default PreferredContact
