import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, Text } from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { AppColors } from '../../styles/colors'

const GymLocationPicker = () => {
  const [selected, setSelected] = React.useState("")
  const [gyms, setGyms] = useState([])

  useEffect(() => {
    const fetchGyms = async() => {
      try{
        const response = await fetch('http://localhost:8080/udemy/create-api/api/gymList.php');
        const json = await response.json();
        setGyms(json);
      } catch(error){
        console.error(error);
      }
    }

    fetchGyms()
  }, []); // <--- Empty array ensures it runs once on mount 

  // console.log(gyms);
  // console.log(selected);

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
      data={gyms}
      save="value"
    />

    // <FlatList
    //   data={gyms}
    //   keyExtractor={(item) => item.id.toString()}
    //   renderItem={({ item }) => <Text>{item.gym_name}, {item.city}</Text>}
    // />
  )
};

const styles = StyleSheet.create({});

export default GymLocationPicker
