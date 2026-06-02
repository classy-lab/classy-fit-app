import React, { useState, useEffect, useRef, useContext } from "react";
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
import { SelectList } from "react-native-dropdown-select-list";
import UploadPhoto from "../../screens/app/UploadPhoto";
import { UserContext } from "../../context/UserContext";
import HoneypotField from "./input_fields/HoneypotField";
import PreferredContact from "./PreferredContact";
import GymList from "../GymList";
import { globalStyles } from "../../styles/globalStyles";
import FlashMessage, {
  showMessage,
  hideMessage,
} from "react-native-flash-message";

const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

const MIN_SUBMISSION_TIME_MS = 5000; // 5 seconds threshold before reg form can be submitted

// 1. Define the Yup validation schema
const schema = yup.object().shape({
  email: yup.string().required("Email is required").email("Invalid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(2, "Password must contain at least 2 characters")
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
    )
    .required("Date of birth is required"),
  sex: yup
    .string()
    .oneOf(["Male", "Female", "Other"], "Please select a valid category")
    .required("Category selection is required"),
  phoneNumber: yup.string().matches(phoneRegExp, "Phone Number is not valid"),
  whatsappNumber: yup
    .string()
    .matches(phoneRegExp, "WhatsApp Number number is not valid"),
  preferredContact: yup.string(), //.oneOf(["Phone", "Email", "WhatsApp"]),
  gymId: yup
    .string()
    .matches(/^\d+$/, "Gym location is required")
    .required("Category selection is required"),
});

//
//

const ProfileScreenForm = () => {
  // const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const [photo, setPhoto] = useState(null);
  const [website, setWebsite] = useState("");
  const { webServer } = useContext(UserContext);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsApp, setWhatsApp] = useState("");
  const [preferredContact, setPreferredContact] = useState("");

  // Use a ref to store the load time without triggering re-renders
  const formLoadTime = useRef(Date.now());

  // Reset the timer if the user navigates back to this screen
  useEffect(() => {
    formLoadTime.current = Date.now();
    // console.log('sending acc');
    const fetchUserData = async ({ tokens, webServer, user, setTokens }) => {
      const response = await fetch(`${webServer}/api/v1/users/${user.sub}`, {
        headers: {
          Authorization: "Bearer " + tokens.access_token,
        },
      });
      const json = await response.text();
      const obj = JSON.parse(json);

      if (response.status == 200) {
        //set profile fields here
        console.log("set profile fields here");

        reset({
          dateOfBirth: obj.fields.date_of_birth,
          phoneNumber: obj.fields.phone,
          preferredContact: obj.fields.preferred_contact,
          whatsappNumber: obj.fields.whatsapp,
        });
        // }
      } else {
        console.log("Access token expired, requesting new one - useEffect()");

        const response = await fetch(`${webServer}/api/refresh.php`, {
          method: "POST",
          body: JSON.stringify({
            token: tokens.refresh_token,
          }),
        });

        const json = await response.text();
        const obj = JSON.parse(json);

        if (response.status == 200) {
          console.log("Got new access token and refresh token");
          setTokens({
            ...tokens,
            access_token: obj.access_token,
            refresh_token: obj.refresh_token,
          });
        }
      }
    };
    fetchUserData({ tokens, webServer, user, setTokens });
  }, []);

  const sexData = [
    { key: "1", value: "Male", disabled: false },
    { key: "2", value: "Female" },
    { key: "3", value: "Other" },
  ];

  const roleData = [
    { key: "1", value: "Owner", disabled: false },
    { key: "2", value: "Member" },
    { key: "3", value: "Trainer" },
    { key: "4", value: "Contractor" },
  ];

  // 2. Initialize useForm with the Yup resolver
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      gymId: user.gym_id,
      email: user.email,
      dateOfBirth: "",
      fname: user.given_name,
      lname: user.family_name,
      whatsappNumber: "",
      phoneNumber: "",
      role: "Owner",
      sex: user.gender,
      preferredContact: "",
    },
  });

  // 3. Define the submit handler
  const updateUser = async (data) => {
    const totalTimeElapsed = Date.now() - formLoadTime.current;
    // console.log(data);

    // Honeypot check
    if (website.trim() !== "") {
      console.log("Submission failed", "Bot behavior detected.");
      return;
    }

    // Timestamp check
    if (totalTimeElapsed < MIN_SUBMISSION_TIME_MS) {
      console.log("Submission failed", "Form submitted too quickly.");
      return;
    }

    const response = await fetch(`${webServer}/api/register.php`, {
      method: "PATCH",
      headers: {
        Authorizatio: "Bearer " + tokens.access_token,
      },
      body: JSON.stringify({
        gym_id: data.gymId,
        username: "",
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        role: data.role,
        fname: data.fname,
        lname: data.lname,
        date_of_birth: data.dateOfBirth,
        sex: data.sex,
        phone: data.phoneNumber,
        whatsapp: data.whatsappNumber,
        preferred_contact: data.preferredContact,
      }),
    });

    const json = await response.text();
    const obj = JSON.parse(json);
    console.log(obj);

    if (response.status == 200) {
      showMessage({
        message: obj?.message,
        type: "success",
        autoHide: false, // prevents the message from disappearing automatically
        onPress: () => hideMessage(), // closes the message when pressed
      });
      // console.log("json: ", JSON.stringify(obj));
    } else {
      showMessage({
        message: obj?.message,
        type: "danger",
        autoHide: false, // prevents the message from disappearing automatically
        onPress: () => hideMessage(), // closes the message when pressed
      });
    }
  };

  return (
    <>
      <View style={styles.fieldset}>
        <View style={styles.field}>
          {/* <UploadPhoto
            photo={photo}
            setPhoto={setPhoto}
            uploadPhoto={uploadPhoto}
          /> */}
        </View>
        <View style={[styles.field, { opacity: 0.5 }]} pointerEvents="none">
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
        <View
          style={styles.field}
          pointerEvents="none"
          style={{ opacity: 0.5 }}
        >
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
                defaultOption={{ key: "", value: user.role }}
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
                value={value} // This will smoothly transition from '' to the API value
                keyboardType="default"
                autoCapitalize="none"
                placeholder="yyyy-mm-dd"
              /> // needs date picker added. check
            )}
          />
          {errors.dateOfBirth && (
            <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>
          )}
        </View>
        <View
          style={styles.field}
          pointerEvents="none"
          style={{ opacity: 0.5 }}
        >
          <Text style={styles.formLabel}>Sex</Text>
          <Controller
            name="sex"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <SelectList
                setSelected={(val) => onChange(val)} // Send selection to hook-form
                data={sexData}
                save="value"
                defaultOption={{ key: "", value: user.gender }}
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
            render={({ field: { onChange } }) => (
              <PreferredContact onSelectValue={onChange} />
            )}
          />
          {errors.preferredContact && (
            <Text style={styles.errorText}>
              {errors.preferredContact.message}
            </Text>
          )}
        </View>
        <View
          style={styles.field}
          pointerEvents="none"
          style={{ opacity: 0.5 }}
        >
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

        <View style={globalStyles.loginBtnContainer}>
          <TouchableOpacity
            style={globalStyles.registerBtn}
            title="loginSubmit"
            onPress={handleSubmit(updateUser)}
          >
            <Text style={globalStyles.registerBtnText}>Save Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={globalStyles.loginBtn}
            title="loginSubmit"
            onPress={() => {
              console.log("Delete profile btn pressed");
            }}
          >
            <Text style={globalStyles.loginBtnText}>Delete Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={globalStyles.loginBtn}
            title="loginSubmit"
            onPress={() => {
              console.log("Cancel Gym Membership btn pressed");
            }}
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
    paddingLeft: 8,
    borderColor: AppColors.textInputBorderColor,
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.grey,
  },
  errorText: {
    color: AppColors.red,
  },
  selectList: {
    marginBottom: 80,
  },
});
