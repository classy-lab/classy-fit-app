import React, { useState, useContext } from 'react'
import { UserContext } from '../../context/UserContext'
import { StyleSheet } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { AppColors } from '../../styles/colors'

const SexPicker = () => {
  const {user, setUser} = useContext(UserContext);
  const [sex, setSex] = React.useState("")

  const data = [
    { key: '1', value: 'Male', disabled: false },
    { key: '2', value: 'Female' },
    { key: '3', value: 'Other' },
  ]

  return (
    <SelectList
      boxStyles={{
        borderColor: AppColors.grey,
        borderWidth: 1,
        paddingHorizontal: 8,
        backgroundColor: '#F5F6FA'
      }}
      dropdownStyles={{
        borderColor: AppColors.grey2,
        borderWidth: 1,
        marginTop: 8,
      }}
      setSelected={(val) => setSex(val)}
      data={data}
      save="value"
      defaultOption={{ key: '1', value: user?.gender }} // Set the default option value here using the token payload user role value
    />
  );
};

const styles = StyleSheet.create({});

export default SexPicker
