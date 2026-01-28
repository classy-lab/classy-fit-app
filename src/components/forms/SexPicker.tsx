import React, { useState } from 'react'
import { StyleSheet, Dimensions } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'

const windowWidth = Dimensions.get('window').width

const SexPicker = () => {
  const [selected, setSelected] = React.useState("")

  const data = [
    { key: '1', value: 'Male', disabled: false },
    { key: '2', value: 'Female' },
    { key: '3', value: 'Other' },
  ]

  return (
    <SelectList
      setSelected={(val) => setSelected(val)}
      data={data}
      save="value"
    />
  );
};

const styles = StyleSheet.create({});

export default SexPicker
