import React, { useState } from 'react';
import { StyleSheet } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'

const GymLocationPicker = () => {
  const [selected, setSelected] = React.useState("")
  const data = [
    { key: '1', value: 'Classy Fitness Studio', disabled: false },
    { key: '2', value: 'Other' },
  ]

  return (
    <SelectList
      setSelected={(val) => setSelected(val)}
      data={data}
      save="value"
    />
  )
};

const styles = StyleSheet.create({});

export default GymLocationPicker
