import React, { useState } from 'react';
import { StyleSheet } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'

const ProductSizepicker = () => {
  const [selected, setSelected] = React.useState("")
  const data = [
    { key: '1', value: 'Small', disabled: false },
    { key: '2', value: 'Medium' },
    { key: '3', value: 'Large' },
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

export default ProductSizepicker

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
