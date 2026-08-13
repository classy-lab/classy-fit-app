import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { AppColors } from '../../styles/colors'

const InputField = ({ value, data = [], placeholder = 'Select value' }) => {
  const [val, setValue] = useState(value ?? '')

  const options = data.length
    ? data
    : [{ key: '1', value: value === null || value === undefined ? placeholder : String(value) }]

  useEffect(() => {
    if (value === null || value === undefined) {
      setValue('')
      return
    }

    setValue(String(value))
  }, [value])

  return (
    <SelectList
      boxStyles={styles.inputField}
      dropdownStyles={styles.dropdown}
      setSelected={(selectedValue) => setValue(selectedValue)}
      data={options}
      save="value"
      defaultOption={{
        key: options.find((item) => item.value === val)?.key || options[0]?.key || '1',
        value: val || placeholder,
      }}
      search={false}
    />
  )
};

export default InputField

const styles = StyleSheet.create({
  inputField: {
    borderColor: AppColors.grey,
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F5F6FA',
  },
  dropdown: {
    borderColor: AppColors.grey2,
    borderWidth: 1,
    marginTop: 8,
  },
})
