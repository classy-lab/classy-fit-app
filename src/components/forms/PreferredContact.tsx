import React, { useContext } from "react";
import { StyleSheet } from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { AppColors } from "../../styles/colors";
import { UserContext } from "../../context/UserContext";

const PreferredContact = ({ onSelectValue }) => {
  const contactTypes = [
    { key: "1", value: "Phone" },
    { key: "2", value: "WhatsApp" },
    { key: "3", value: "Email" },
  ];
  const { user } = useContext(UserContext);
  let key = 0;

  switch (user.preferred_contact) {
    case "Phone":
      key = 1;
      break;
    case "WhatsApp":
      key = 2;
      break;
    case "Email":
      key = 3;
      break;
    default:
      break;
  }

  return (
    <SelectList
      setSelected={onSelectValue} // Updates the parent state directly
      data={contactTypes}
      save="key"
      placeholder="Select Category"
      defaultOption={{
        key: key,
        value: user.preferred_contact,
      }}
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
