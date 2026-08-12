import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native'
import { AppColors } from '../../styles/colors'

const ProductSizepicker = ({ size }) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (size === null || size === undefined) {
      setValue('')
      return
    }

    const rawSize = String(size).toLowerCase().trim()
    const sizeAliases = {
      s: 'Small',
      m: 'Medium',
      l: 'Large',
    }

    setValue(sizeAliases[rawSize] || String(size))
  }, [size])

  return (
    <TextInput
      style={styles.inputField}
      value={value}
      onChangeText={setValue}
      placeholder="Size"
      placeholderTextColor={AppColors.grey2}
    />
  )
};

export default ProductSizepicker

const styles = StyleSheet.create({
  inputField: {
    borderColor: AppColors.grey,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F5F6FA',
    color: 'black',
    fontSize: 16,
  },
})
