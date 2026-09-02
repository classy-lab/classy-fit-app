import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { styles } from "../../../styles/registerFormStyles";

type DateOfBirthFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  title?: string;
  maximumDate?: Date | null;
  minimumDate?: Date;
};

const EMPTY_LABEL = "Select date of birth";
const MINIMUM_DATE = new Date(1900, 0, 1);
const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

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

const getFallbackDate = () => {
  const fallbackDate = new Date();
  fallbackDate.setFullYear(fallbackDate.getFullYear() - 18);
  return fallbackDate;
};

const DateOfBirthField = ({
  value,
  onChange,
  onBlur,
  placeholder = EMPTY_LABEL,
  title = "Select date of birth",
  maximumDate = new Date(),
  minimumDate = MINIMUM_DATE,
}: DateOfBirthFieldProps) => {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(value);
  const pickerDate = selectedDate ?? getFallbackDate();
  const displayValue = selectedDate
    ? DISPLAY_DATE_FORMATTER.format(selectedDate)
    : placeholder;

  const closePicker = () => {
    setOpen(false);
    onBlur?.();
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.inputButton}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={selectedDate ? styles.inputButtonText : styles.inputButtonPlaceholder}>
          {displayValue}
        </Text>
      </TouchableOpacity>
      <DatePicker
        modal
        mode="date"
        open={open}
        date={pickerDate}
        maximumDate={maximumDate === null ? undefined : maximumDate}
        minimumDate={minimumDate}
        title={title}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={(selectedDate) => {
          onChange(formatDateValue(selectedDate));
          closePicker();
        }}
        onCancel={closePicker}
      />
    </View>
  );
};

export default DateOfBirthField;