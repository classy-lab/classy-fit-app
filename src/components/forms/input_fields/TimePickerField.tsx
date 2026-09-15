import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { styles } from "../../../styles/registerFormStyles";

type TimePickerFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  title?: string;
};

const EMPTY_LABEL = "Select time";
const DISPLAY_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const pad = (value: number) => String(value).padStart(2, "0");

const parseTimeValue = (value?: string) => {
  if (!value) return null;

  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  const parsedDate = new Date();
  parsedDate.setHours(hours, minutes, 0, 0);
  return parsedDate;
};

const getFallbackDate = () => {
  const fallbackDate = new Date();
  fallbackDate.setSeconds(0, 0);
  return fallbackDate;
};

const formatTimeValue = (date: Date) => {
  return [pad(date.getHours()), pad(date.getMinutes())].join(":");
};

const TimePickerField = ({
  value,
  onChange,
  onBlur,
  placeholder = EMPTY_LABEL,
  title = "Select time",
}: TimePickerFieldProps) => {
  const [open, setOpen] = useState(false);
  const selectedDate = parseTimeValue(value);
  const pickerDate = selectedDate ?? getFallbackDate();
  const displayValue = selectedDate
    ? DISPLAY_TIME_FORMATTER.format(selectedDate)
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
        mode="time"
        open={open}
        date={pickerDate}
        title={title}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={(selectedTime) => {
          onChange(formatTimeValue(selectedTime));
          closePicker();
        }}
        onCancel={closePicker}
      />
    </View>
  );
};

export default TimePickerField;
