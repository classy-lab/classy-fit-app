import React, { useState, useEffect, useRef } from "react";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Button,
  Image,
  Platform,
} from "react-native";
import { AppColors } from "../../styles/colors";
import { useNavigation } from "@react-navigation/native";
import { SelectList } from "react-native-dropdown-select-list";
// import UploadPhoto from "../../screens/app/UploadPhoto";
import { launchImageLibrary } from "react-native-image-picker";
import HoneypotField from "./input_fields/HoneypotField";
import GymList from "../GymList";
import FlashMessage, {
  showMessage,
  hideMessage,
} from "react-native-flash-message";

const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

const MIN_SUBMISSION_TIME_MS = 1000; // 15 seconds threshold before reg form can be submitted

const RegisterForm = () => {
  const navigation = useNavigation();
  const [photo, setPhoto] = useState();
  const [website, setWebsite] = useState("");

  // Use a ref to store the load time without triggering re-renders
  const formLoadTime = useRef(Date.now());

  // Reset the timer if the user navigates back to this screen
  useEffect(() => {
    formLoadTime.current = Date.now();
  }, []);

  const [sex, setSelected] = useState(""); // sex state lives here
  const sexData = [
    { key: "1", value: "Male", disabled: false },
    { key: "2", value: "Female" },
    { key: "3", value: "Other" },
  ];

  const [PreferredContact, setPreferredContact] = React.useState("");
  const preferredContactData = [
    { key: "1", value: "Phone", disabled: false },
    { key: "2", value: "WhatsApp" },
    { key: "3", value: "Email" },
  ];

  const [gyms, setGyms] = useState([]);
  const [role, setRole] = React.useState("");
  const roleData = [
    { key: "1", value: "Owner", disabled: true },
    { key: "2", value: "Member" },
    { key: "3", value: "Trainer" },
    { key: "4", value: "Contractor" },
  ];

  // This is the "onChange" logic for GymList
  const handleSelectionChange = (val) => {
    setGyms(val);
  };

  const handleLinkPress = () => {
    Linking.openURL("https://cleancodeusa.com/about.html");
  };

  // 1. Define the Yup validation schema
  const schema = yup.object().shape({
    email: yup.string().required("Email is required").email("Invalid email"),
    password: yup
      .string()
      .required("Password is required")
      .min(2, "Password must contain at least 12 characters")
      .matches(
        /^[a-zA-Z0-9\s~!@#$%^&*()_+-]+$/,
        "Only letters, numbers, spaces, hyphens, and underscores are allowed",
      ),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords must match")
      .required("Please confirm your password"),
    role: yup.string().oneOf(["Owner", "Member", "Trainer", "Contractor"]),
    fname: yup.string().required("First name is required").min(2).max(20),
    lname: yup.string().required("Last name is required").min(2).max(20),
    dateOfBirth: yup
      .string()
      .matches(
        /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
        "Date must be in YYYY-MM-DD format",
      ),
    // .required("Date of birth is required"),
    sex: yup
      .string()
      .oneOf(["Male", "Female", "Other"], "Please select a valid category"),
    // .required("Category selection is required"),
    phoneNumber: yup
      .string()
      .matches(phoneRegExp, "Phone Number is not valid")
      .nullable()
      .notRequired()
      .transform((value) => (value === "" ? null : value)),
    whatsappNumber: yup
      .string()
      .matches(phoneRegExp, "WhatsApp Number number is not valid")
      .nullable()
      .notRequired()
      .transform((value) => (value === "" ? null : value)),
    // preferredContact: yup.string().oneOf(["Phone", "Email", "WhatsApp"]),
    gymId: yup.string().matches(/^\d+$/, "Gym location is required"),
    // .required("Category selection is required"),
    photo: yup
      .mixed()
      .required("A profile picture is required")
      .test(
        "fileSize",
        "A profile picture is required. Image should be < 5MB",
        (value: any) => {
          if (!value) return false;
          return !value.fileSize || value.fileSize <= 5 * 1024 * 1024;
        },
      ),
  });

  // 2. Initialize useForm with the Yup resolver
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      gymId: "",
      email: "help@simplecssjs.com",
      dateOfBirth: "2000-05-05",
      fname: "asdf",
      lname: "asdf",
      whatsappNumber: "518-517-9866",
      phoneNumber: "518-517-9866",
      photo: "",
    },
  });

  const handlePickImage = (onChange: (...event: any[]) => void) => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 1,
      },
      (response) => {
        if (
          !response.didCancel &&
          !response.errorCode &&
          response.assets &&
          response.assets.length > 0
        ) {
          // Pass the plain asset object into React Hook Form
          onChange(response.assets[0]);
        }
      },
    );
  };

  // 3. Define the submit handler
  const registerUser = async (data: any) => {
    const formData = new FormData();
    const totalTimeElapsed = Date.now() - formLoadTime.current;
    console.log(data);

    // 1. Honeypot check
    if (website.trim() !== "") {
      console.log("Submission failed", "Bot behavior detected.");
      return;
    }

    // 2. Timestamp check
    if (totalTimeElapsed < MIN_SUBMISSION_TIME_MS) {
      console.log("Submission failed", "Form submitted too quickly.");
      return;
    }

    // Fix file paths for iOS environment without Expo asset utilities
    const nativeUri =
      Platform.OS === "ios"
        ? data.photo.uri.replace("file://", "")
        : data.photo.uri;

    formData.append("gym_id", data.gymId);
    formData.append("gym_id", data.gymId);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("data.confirmPassword", data.confirmPassword);
    formData.append("role", data.role);
    formData.append("fname", data.fname);
    formData.append("lname", data.lname);
    formData.append("date_of_birth", data.dateOfBirth);
    formData.append("sex", data.sex);
    formData.append("phone", data.phoneNumber);
    formData.append("whatsapp", data.whatsappNumber);
    formData.append("preferred_contact", data.preferredContact);

    formData.append("photo", {
      uri: nativeUri,
      type: data.photo.type || "image/jpeg",
      name: data.photo.fileName || "avatar.jpg",
    } as any);

    console.log(formData);

    const response = await fetch(
      "http://localhost:8080/classy-api/api/register.php",
      {
        method: "POST",
        body: formData,
      },
    );

    const json = await response.json();
    console.log(response.status);
    console.log("Server Response:", json);

    const obj = JSON.parse(json);

    if (response.status == 200) {
      showMessage({
        message: obj?.message,
        type: "success",
        autoHide: false,
        onPress: () => hideMessage(),
      });
      navigation.navigate("ThankYouScreen");
    } else {
      showMessage({
        message: obj.message,
        type: "danger",
        autoHide: false,
        onPress: () => hideMessage(),
      });
    }
  };

  return (
    <>
      <View style={styles.fieldset}>
        <View style={styles.field}>
          <Controller
            control={control}
            name="photo"
            render={({ field: { onChange, value } }) => (
              <View style={styles.imageContainer}>
                {value?.uri ? (
                  <Image source={{ uri: value.uri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.placeholder]}>
                    <Text>No Image</Text>
                  </View>
                )}
                <Button
                  title="Select Image"
                  onPress={() => handlePickImage(onChange)}
                />
              </View>
            )}
          />
          {errors.photo && (
            <Text style={styles.errorText}>{errors.photo.message}</Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.formLabel}>E-mail</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email.message}</Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.formLabel}>Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                secureTextEntry
              />
            )}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.formLabel}>Confirm Password</Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                secureTextEntry
              />
            )}
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>
              {errors.confirmPassword.message}
            </Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.formLabel}>Role</Text>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, onBlur, value } }) => (
              <SelectList
                setSelected={(val) => onChange(val)} // Send selection to hook-form
                data={roleData}
                save="value"
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
            )}
          />
          {errors.role && (
            <Text style={styles.errorText}>{errors.role.message}</Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.formLabel}>First Name</Text>
          <Controller
            control={control}
            name="fname"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
              />
            )}
          />
          {errors.fname && (
            <Text style={styles.errorText}>{errors.fname.message}</Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.formLabel}>Last Name</Text>
          <Controller
            control={control}
            name="lname"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
              />
            )}
          />
          {errors.lname && (
            <Text style={styles.errorText}>{errors.lname.message}</Text>
          )}
        </View>
        {/* 3. Include the honeypot trap in your form */}
        <HoneypotField value={website} onChangeText={setWebsite} />
        <View style={styles.field}>
          <Text style={styles.formLabel}>Date of Birth</Text>
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
                placeholder="yyyy/mm/dd"
              /> // needs date picker added. check
            )}
          />
          {errors.dateOfBirth && (
            <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.formLabel}>Sex</Text>
          <Controller
            name="sex"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <SelectList
                setSelected={(val) => onChange(val)} // Send selection to hook-form
                data={sexData}
                save="value"
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
            )}
          />
          {errors.sex && (
            <Text style={styles.errorText}>{errors.sex.message}</Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.formLabel}>Phone Number</Text>
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
                placeholder="518-555-5555"
              />
            )}
          />
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.formLabel}>WhatsApp Number</Text>
          <Controller
            control={control}
            name="whatsappNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                placeholder="518-555-5555"
                autoCapitalize="none"
              />
            )}
          />
          {errors.whatsappNumber && (
            <Text style={styles.errorText}>
              {errors.whatsappNumber.message}
            </Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.formLabel}>Preferred Contact</Text>
          <Controller
            control={control}
            name="preferredContact"
            render={({ field: { onChange, onBlur, value } }) => (
              <SelectList
                setSelected={(val) => onChange(val)} // Send selection to hook-form
                data={preferredContactData}
                save="value"
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
            )}
          />
          {errors.preferredContact && (
            <Text style={styles.errorText}>
              {errors.preferredContact.message}
            </Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.formLabel}>Gym Location / Fitness Center</Text>
          <Controller
            control={control}
            name="gymId"
            render={({ field: { onChange } }) => (
              <GymList onSelectValue={onChange} />
            )}
          />
          {errors.gymId && (
            <Text style={styles.errorText}>{errors.gymId.message}</Text>
          )}
        </View>
        <Text style={styles.agreement}>
          By using Classy Fit, you agree and consent to our:{" "}
          <Text style={styles.linkText} onPress={handleLinkPress}>
            Terms of Service -{" "}
            <Text style={styles.linkText} onPress={handleLinkPress}>
              Cookie Policy -{" "}
            </Text>
            <Text style={styles.linkText} onPress={handleLinkPress}>
              Privacy Policy
            </Text>
          </Text>
        </Text>
        <View style={styles.loginBtnContainer}>
          <TouchableOpacity
            style={styles.loginBtn}
            title="loginSubmit"
            onPress={handleSubmit(registerUser)}
          >
            <Text style={styles.loginBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default RegisterForm;

const styles = StyleSheet.create({
  fieldset: {
    marginBottom: 32,
  },
  email: {},
  formLabel: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  inputField: {
    marginTop: 5,
    borderWidth: 1,
    paddingLeft: 8,
    borderColor: AppColors.textInputBorderColor,
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.grey,
  },
  errorText: {
    color: AppColors.red,
  },
  createAcctBtn: {},
  createAcctBtnText: {},
  loginBtnContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  loginBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 250,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    color: AppColors.white,
    fontSize: 14,
  },
  selectList: {
    marginBottom: 80,
  },
  agreement: {
    fontSize: 12,
    marginTop: 20,
    lineHeight: 24,
  },
  linkText: {
    fontSize: 12,
    color: AppColors.blue,
  },
  errorMsg: {
    color: "red",
  },
  apimessage: { color: AppColors.blue },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageContainer: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
  placeholder: {
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
});
