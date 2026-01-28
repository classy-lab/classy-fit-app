import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'

const PreferredContact = () => {
  const [selected, setSelected] = React.useState("");
  const data = [
    { key: '1', value: 'Phone', disabled: false },
    { key: '2', value: 'WhatsApp' },
    { key: '3', value: 'Email' },
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

export default PreferredContact
