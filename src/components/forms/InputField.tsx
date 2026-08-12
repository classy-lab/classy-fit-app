import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native'
import { AppColors } from '../../styles/colors'

const InputField = ({ value }) => {
  const [val, setValue] = useState(value ?? '')

  useEffect(() => {
    if (value === null || value === undefined) {
      setValue('')
      return
    }

    setValue(String(value))
  }, [value])

  return (
    <TextInput
      style={styles.inputField}
      value={val}
      onChangeText={setValue}
      placeholder="Enter value"
      placeholderTextColor={AppColors.grey2}
    />
  )
};

export default InputField

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
