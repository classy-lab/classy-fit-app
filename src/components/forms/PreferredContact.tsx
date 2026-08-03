import React from "react";
import { StyleSheet } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { AppColors } from "../../styles/colors";

type PreferredContactProps = {
  onSelectValue?: (value: any) => void;
  value?: any;
};

const PreferredContact = ({ onSelectValue, value }: PreferredContactProps) => {
  const contactTypes = [
    { key: "1", value: "Phone" },
    { key: "2", value: "WhatsApp" },
    { key: "3", value: "Email" },
  ];

  const selectedOption = contactTypes.find((item) => item.value === value);

  return (
    <SelectList
      setSelected={onSelectValue} // Updates the parent state directly
      data={contactTypes}
      save="value"
      placeholder="Select Category"
      defaultOption={
        selectedOption
          ? { key: selectedOption.key, value: selectedOption.value }
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

const styles = StyleSheet.create({});

export default PreferredContact;
