import React, { useState } from 'react';
import { StyleSheet } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'

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
    // margin: 10,
    borderColor: 'gray',
    borderWidth: 0,
    borderRadius: 16,
    backgroundColor: '#F5F6FA',
  },
  inputText: {
    color: 'black',
    fontSize: 16,
  },
  dropdown: {
    // position: 'absolute', // Ensures the dropdown overlays other elements
    // top: 50, // Adjust position relative to the input box
    // width: '100%',
    // zIndex: 999, // Ensures the dropdown is on top
    // backgroundColor: 'white',
    // borderColor: 'gray',
    // borderWidth: 1,
    // borderRadius: 8,
  },
  dropdownItem: {
    // padding: 10,
    // borderBottomWidth: 1,
    // borderBottomColor: '#ccc',
  },
  dropdownText: {
    // color: 'blue', // Custom color for the items
    // fontSize: 14,
  },
});
