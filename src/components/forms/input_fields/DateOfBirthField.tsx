import React, { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { styles } from "../../../styles/registerFormStyles";

type DateOfBirthFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

const EMPTY_LABEL = "Select date of birth";
const MINIMUM_DATE = new Date(1900, 0, 1);

const pad = (value: number) => String(value).padStart(2, "0");

const formatDateValue = (date: Date) => {
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-");
};

const parseDateValue = (value?: string) => {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
};

const formatDisplayValue = (value?: string) => {
  const parsedDate = parseDateValue(value);
  if (!parsedDate) return EMPTY_LABEL;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsedDate);
};

const getDefaultPickerDate = (value?: string) => {
  const parsedDate = parseDateValue(value);
  if (parsedDate) return parsedDate;

  const fallbackDate = new Date();
  fallbackDate.setFullYear(fallbackDate.getFullYear() - 18);
  return fallbackDate;
};

const DateOfBirthField = ({ value, onChange, onBlur }: DateOfBirthFieldProps) => {
  const [open, setOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => getDefaultPickerDate(value));

  const displayValue = useMemo(() => formatDisplayValue(value), [value]);
  const isEmpty = !parseDateValue(value);

  const openPicker = () => {
    setPickerDate(getDefaultPickerDate(value));
    setOpen(true);
  };

  const closePicker = () => {
    setOpen(false);
    onBlur?.();
  };

  return (
    <View>
      <TouchableOpacity style={styles.inputButton} onPress={openPicker} activeOpacity={0.8}>
        <Text style={isEmpty ? styles.inputButtonPlaceholder : styles.inputButtonText}>{displayValue}</Text>
      </TouchableOpacity>
      <DatePicker
        modal
        mode="date"
        open={open}
        date={pickerDate}
        maximumDate={new Date()}
        minimumDate={MINIMUM_DATE}
        title="Select date of birth"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={(selectedDate) => {
          onChange(formatDateValue(selectedDate));
          setPickerDate(selectedDate);
          closePicker();
        }}
        onCancel={closePicker}
      />
    </View>
  );
};

export default DateOfBirthField;