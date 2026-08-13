import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { AppColors } from '../../styles/colors'

const ProductSizePicker = ({ size }) => {
  const [value, setValue] = useState('')

  const data = [
    { key: '1', value: 'Small' },
    { key: '2', value: 'Medium' },
    { key: '3', value: 'Large' },
  ]

  useEffect(() => {
    if (size === null || size === undefined) {
      setValue('')
      return
    }

    const rawSize = String(size).toLowerCase().trim()
    const sizeAliases = {
      s: 'Small',
      small: 'Small',
      m: 'Medium',
      medium: 'Medium',
      l: 'Large',
      large: 'Large',
    }

    setValue(sizeAliases[rawSize] || String(size))
  }, [size])

  return (
    <SelectList
      boxStyles={styles.inputField}
      dropdownStyles={styles.dropdown}
      setSelected={(selectedValue) => setValue(selectedValue)}
      data={data}
      save="value"
      defaultOption={{ key: value ? data.find(item => item.value === value)?.key || '1' : '1', value: value || 'Small' }}
      search={false}
    />
  )
};

export default ProductSizePicker

const styles = StyleSheet.create({
  inputField: {
    borderColor: AppColors.grey,
    borderWidth: 1,
    paddingHorizontal: 8,
    backgroundColor: '#F5F6FA',
    borderRadius: 6,
  },
  dropdown: {
    borderColor: AppColors.grey2,
    borderWidth: 1,
    marginTop: 8,
  },
})
