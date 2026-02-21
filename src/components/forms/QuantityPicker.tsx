import React, { useState } from 'react';
import { StyleSheet } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { AppColors } from '../../styles/colors'

const QuantityPicker = () => {
  const [selected, setSelected] = React.useState("")
  const data = [
    { key: '1', value: '1', disabled: false },
    { key: '2', value: '2' },
    { key: '3', value: '3' },
    { key: '4', value: '4' },
    { key: '5', value: '5' },
    { key: '6', value: '6' },
    { key: '7', value: '7' },
    { key: '8', value: '8' },
    { key: '9', value: '9' },
    { key: '10', value: '10' }
  ]

  return (
    <SelectList
      setSelected={(val) => setSelected(val)}
      data={data}
      save="value"
      boxStyles={styles.listBox} // Style the main input box
      inputStyles={styles.inputText} // Style the text inside the input box
      dropdownStyles={styles.dropdown} // Style the dropdown list container
      dropdownItemStyles={styles.dropdownItem} // Style each individual item container
      dropdownTextStyles={styles.dropdownText} // Style the text of each item
    // placeholder="Select an option"
    />
  )
};

export default QuantityPicker

const styles = StyleSheet.create({
  listBox: {
    borderColor: AppColors.grey,
    borderWidth: 1,
    paddingHorizontal: 8,
    backgroundColor: '#F5F6FA'
  },
  inputText: {
    color: 'black',
    fontSize: 16,
  },
  dropdown: {
    borderColor: AppColors.grey2,
    borderWidth: 1,
    marginTop: 8,
  },
  dropdownItem: {},
  dropdownText: {},
})
