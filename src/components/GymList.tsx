import React from "react";
import { StyleSheet } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { AppColors } from "../styles/colors";

const GymList = ({ onSelectValue }) => {
  // 1. Parent controls the selected value
  const gymData = [
    { key: "1", value: "Kinderhook Fitness, Valatie, NY" },
    { key: "2", value: "Vent Fitness, Clifton Park, NY" },
    { key: "3", value: "The Bodyshop Gym, Cobleskill, NY" },
    { key: "4", value: "Sarah's Gym, Cobleskill, NY" },
  ];

  // useEffect(() => {
  //   const fetchGyms = async() => {
  //     try{
  //       const response = await fetch('http://localhost:8080/classy-api/api/Gyms.php');
  //       const json = await response.json();
  //       setGyms(json);
  //     } catch(error){
  //       console.error(error);
  //     }
  //   }

  //   fetchGyms()
  // }, []); // <--- Empty array ensures it runs once on mount

  // console.log(gyms);
  // console.log(selectedGym);

  return (
    <SelectList
      setSelected={onSelectValue} // Updates the parent state directly
      data={gymData}
      save="key"
      placeholder="Select Category"
      boxStyles={{
        borderColor: AppColors.grey,
        borderWidth: 1,
        paddingHorizontal: 8,
      }}
      dropdownStyles={{
        borderColor: AppColors.grey2,
        borderWidth: 1,
        marginTop: 8,
        backgroundColor: "white",
      }}
      // If you need to force the value from the parent (e.g., reset)
      // defaultOption={data.find(item => item.value === value)}
    />
  );
};

export default GymList;

const styles = StyleSheet.create({
  formLabel: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  field: {},
});
