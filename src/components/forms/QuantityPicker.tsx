import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native'
import { AppColors } from '../../styles/colors'

const QuantityPicker = ({ quantity }) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (quantity === null || quantity === undefined) {
      setValue('')
      return
    }

    setValue(String(quantity))
  }, [quantity])

  return (
    <TextInput
      style={styles.inputField}
      value={value}
      onChangeText={setValue}
      keyboardType="number-pad"
      placeholder="Quantity"
      placeholderTextColor={AppColors.grey2}
    />
  )
};

export default QuantityPicker

const styles = StyleSheet.create({
  inputField: {
    borderColor: AppColors.grey,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F5F6FA',
    color: AppColors.blue,
    fontSize: 16,
  },
})
