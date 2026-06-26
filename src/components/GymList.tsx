import React, { useContext } from "react";
import { StyleSheet } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { AppColors } from "../styles/colors";
import { UserContext } from "../context/UserContext";

const GymList = ({ onSelectValue }) => {
  // 1. Parent controls the selected value
  const gymData = [
    { key: "1", value: "Kinderhook Fitness, Valatie, NY" },
    { key: "2", value: "Vent Fitness, Clifton Park, NY" },
    { key: "3", value: "The Bodyshop Gym, Cobleskill, NY" },
    { key: "4", value: "Sarah's Gym, Cobleskill, NY" },
  ];
  const { user } = useContext(UserContext);
  const selectedGym = gymData.find((gym) => gym.key === String(user?.gym_id || ""));

  return (
    <SelectList
      setSelected={onSelectValue} // Updates the parent state directly
      data={gymData}
      save="key"
      placeholder="Select Category"
      defaultOption={
        selectedGym
          ? {
              key: selectedGym.key,
              value: selectedGym.value,
            }
          : undefined
      }
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
