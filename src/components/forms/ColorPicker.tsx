import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native'
import { AppColors } from '../../styles/colors'

const ColorPicker = ({ color }) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (color === null || color === undefined) {
      setValue('')
      return
    }

    setValue(String(color))
  }, [color])

  return (
    <TextInput
      style={styles.inputField}
      value={value}
      onChangeText={setValue}
      placeholder="Color"
      placeholderTextColor={AppColors.grey2}
    />
  )
};

export default ColorPicker

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
