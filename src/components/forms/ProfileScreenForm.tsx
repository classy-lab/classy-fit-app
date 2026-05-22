import React, { useContext, useEffect } from "react";
import { UserContext } from "../../context/UserContext";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { AppColors } from "../../styles/colors";
import { useNavigation } from "@react-navigation/native";
import { s, vs } from "react-native-size-matters";
import { useState } from "react";
import SelectedRolePicker from "./SelectedRolePicker";
import CheckboxComponent from "./CheckboxComponent";
import SexPicker from "./SexPicker";
import PreferredContact from "./PreferredContact";
import { globalStyles } from "../../styles/globalStyles";

const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

// 1. Define the Yup validation schema
const schema = yup.object().shape({
  email: yup.string().required("Email is required").email("Invalid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(13, "Password must contain at least 13 characters")
    .matches(
      /^[a-zA-Z0-9]+$/,
      "Password must only contain alphanumeric characters (letters and numbers)",
    ),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null])
    .required(),
  role: yup.string().oneOf(["Owner", "Member", "Trainer", "Contractor"]),
  fname: yup.string().required().min(3),
  lname: yup.string().required().min(2),
  // dateOfBirth: '',
  age: yup.number().positive().integer().min(18).required(),
  sex: yup.string().oneOf(["Male", "Female", "Other"]),
  phoneNumber: yup.string().matches(phoneRegExp, "Phone Number is not valid"),
  whatsappNumber: yup
    .string()
    .matches(phoneRegExp, "WhatsApp Number number is not valid"),
  preferredContact: yup.string().oneOf(["Phone", "Email", "WhatsApp"]),
  // job: yup.string(),
  // gymLocation: ''
});

const ProfileScreenForm = () => {
  const navigation = useNavigation();
  const [selectedLanguage, setSelectedLanguage] = useState();
  const { user, setUser } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);

  // 2. Initialize useForm with the Yup resolver
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: user?.email,
      password: "",
      role: "",
      fname: user?.given_name,
      lname: user?.family_name,
      sex: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/udemy/classy-api/api/tasks",
          {
            headers: {
              Authorization: "Bearer " + tokens?.access_token,
            },
          },
        );

        const json = await response.text();
        const obj = JSON.parse(json);
        // console.log('line 69: ' + obj);
        // console.log(tokens.access_token);

        if (response.status == 200) {
          obj.forEach(async function (task) {
            console.log(task);
          });
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  // 3. Define the submit handler
  const onSubmit = async (data) => {
    // This function only runs if validation passes
    console.log("Form Submitted (Validation Passed):", data);

    try {
      // Perform your authentication logic or API call here
      // const response = await api.post('/login', data);
      // If successful, navigate to the Login page or another desired screen
      // navigation.navigate('RegisterComplete');
    } catch (error) {
      // Handle API errors (React Hook Form does not swallow errors here)
      console.error("Login failed:", error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <>
      <View style={styles.fieldset}>
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
              <SelectedRolePicker
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
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
                placeholder="mm/dd/yyyy"
              /> // needs date picker added. check
            )}
          />
          {errors.dateOfBirth && (
            <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Age</Text>
          <Controller
            control={control}
            name="age"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
                autoCapitalize="none"
              />
            )}
          />
          {errors.age && (
            <Text style={styles.errorText}>{errors.age.message}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Sex</Text>
          <Controller
            control={control}
            name="sex"
            render={({ field: { onChange, onBlur, value } }) => (
              <SexPicker
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
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
              <PreferredContact
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
              />
            )}
          />
          {errors.preferredContact && (
            <Text style={styles.errorText}>
              {errors.preferredContact.message}
            </Text>
          )}
        </View>

        {/* <View style={styles.field}>
          <Text style={styles.formLabel}>Job</Text>
          <Controller
            control={control}
            name="job"
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
          {errors.job && <Text style={styles.errorText}>{errors.job.message}</Text>}
        </View> */}

        <View style={styles.loginBtnContainer}>
          <TouchableOpacity
            style={globalStyles.registerBtn}
            title="loginSubmit"
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={globalStyles.registerBtnText}>Save Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginBtnContainer}>
          <TouchableOpacity
            style={globalStyles.loginBtn}
            title="loginSubmit"
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={globalStyles.loginBtnText}>Delete Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginBtnContainer}>
          <TouchableOpacity
            style={globalStyles.loginBtn}
            title="loginSubmit"
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={globalStyles.loginBtnText}>Cancel Gym Membership</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default ProfileScreenForm;

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
    marginTop: s(16),
  },
  selectList: {
    marginBottom: 80,
  },
});
