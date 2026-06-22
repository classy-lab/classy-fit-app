import React, { useContext } from "react";
import { StyleSheet } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { AppColors } from "../styles/colors";
import { UserContext } from "../context/UserContext";

const GymList = ({ onSelectValue, value }) => {
  // 1. Parent controls the selected value
  const gymData = [
    { key: "1", value: "Kinderhook Fitness, Valatie, NY" },
    { key: "2", value: "Vent Fitness, Clifton Park, NY" },
    { key: "3", value: "The Bodyshop Gym, Cobleskill, NY" },
    { key: "4", value: "Sarah's Gym, Cobleskill, NY" },
  ];
  const { user } = useContext(UserContext);

  // Safely find the gym from gymData
  const getDefaultOption = () => {
    if (value) {
      // If value is passed from parent (from form watch)
      const foundGym = gymData.find((gym) => gym.key === value);
      return foundGym || null;
    }
    
    if (user?.gym_id) {
      // If user has a gym_id, find it in gymData
      const foundGym = gymData.find((gym) => gym.key === user.gym_id.toString());
      return foundGym || null;
    }
    
    return null;
  };

  return (
    <SelectList
      setSelected={onSelectValue}
      data={gymData}
      save="key"
      placeholder="Select Category"
      defaultOption={getDefaultOption()}
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
