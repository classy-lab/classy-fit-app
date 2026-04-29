import React, { useState } from 'react';
import { StyleSheet } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { AppColors } from '../../styles/colors'

const GymLocationPicker = () => {
  const [selected, setSelected] = React.useState("")
  const data = [
    { key: '1', value: 'Classy Fitness, Clifton park', disabled: false },
    { key: '2', value: 'Vent Fitness, Clifton Park' },
    { key: '3', value: 'The Body Shop Gym, Cobleskill' },
    { key: '4', value: 'The Clark Sports Center, Cooperstown' },
    { key: '5', value: 'New Slate Fitness Club, Schoharie' },
    { key: '6', value: 'ABC Sports & Fitness, Latham' },
    { key: '7', value: 'Mule Fitness, Amsterdam' },
    { key: '8', value: '724 Fitness, Stamford' },
    { key: '9', value: 'Middle Village Gym, Schoharie' },
    { key: '10', value: 'Kinderhook Fitness, Valatie' },
  ]

  return (
    <SelectList
      boxStyles={{
        borderColor: AppColors.grey,
        borderWidth: 1,
        paddingHorizontal: 8,
      }}
      dropdownStyles={{
        borderColor: AppColors.grey2,
        borderWidth: 1,
        marginTop: 8,
        backgroundColor: 'white',
      }}
      setSelected={(val) => setSelected(val)}
      data={data}
      save="value"
    />
  )
};

const styles = StyleSheet.create({});

export default GymLocationPicker
