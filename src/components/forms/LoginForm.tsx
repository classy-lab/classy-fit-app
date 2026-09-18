// @ts-nocheck
import React, { useState, useContext } from "react";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Button,
} from "react-native";
import { AppColors } from "../../styles/colors";
import { s } from "react-native-size-matters";
import { useRoute } from "@react-navigation/native";
import { UserContext } from "../../context/UserContext";
import HoneypotField from "./input_fields/HoneypotField";
import FlashMessage, {
  showMessage,
  hideMessage,
} from "react-native-flash-message";

const windowWidth = Dimensions.get("window").width;

const LoginForm = () => {
  const route = useRoute();
  const selectedGymId = route.params?.gymId || "";
  const selectedGymName = route.params?.gym || "";
  const { user, setUser } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { isLoggedIn, setIsLoggedIn } = useContext(UserContext);
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { webServer } = useContext(UserContext);
  console.log(webServer);

  // 1. Define the Yup validation schema
  const schema = yup.object().shape({
    email: yup.string().required("Email is required").email("Invalid email"),
    password: yup
      .string()
      .required("Password is required")
      .matches(
        /^[a-zA-Z0-9]+$/,
        "Password must only contain alphanumeric characters (letters and numbers)",
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
      email: "vishal@gmail.com",
      password: "TestPass12345",
    },
  });

  // 3. Define the submit handler
  const onSubmit = async (data) => {
    // 1. Honeypot check
    if (website.trim() !== "") {
      // console.log("Submission failed", "Bot behavior detected.");
      return;
    }

    // This function only runs if validation passes
    // console.log("Form Submitted (Validation Passed):", data);

    setIsSubmitting(true);
    try {
      // Perform your authentication logic or API call here
      // const response = await api.post('/login', data);
      // If successful, navigate to the Login page or another desired screen

      const response = await fetch(
        `${webServer}/api/v1/login`,
        {
          method: "POST",
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            gym_id: selectedGymId,
          }),
        },
      );

      const json = await response.text();
      const obj = JSON.parse(json);
      console.log("access_token: ", obj.access_token);
      console.log("refresh_token: ", obj.refresh_token);
      console.log("response status: ", response.status);

      if (response.status === 200) {
        setTokens(obj); // store access_token, refresh_token in app memory
        const payload = obj.access_token?.split(".");
        const userPayload = JSON.parse(atob(payload[1]));
        setUser(userPayload); // store token payload user info
        setIsLoggedIn("true"); // set loggedIn status to true
        // console.log(userPayload);

        showMessage({
          message: `Login Success`,
          description: `Hello ${userPayload?.given_name} ${userPayload?.family_name}`,
          type: "success",
          autoHide: true,
        });
      } else {
        showMessage({
          message: obj?.message,
          // description: "API Server Response",
          type: "danger",
          autoHide: false, // prevents the message from disappearing automatically
          onPress: () => hideMessage(), // closes the message when pressed
        });
        // console.log(obj.message);
      }
    } catch (error) {
      // Handle API errors (React Hook Form does not swallow errors here)
      console.error("Login failed:", error);
      // Optionally, show an error message to the user
    } finally {
      setIsSubmitting(false);
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
                secureTextEntry
              />
            )}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}
        </View>

        <HoneypotField value={website} onChangeText={setWebsite} />

        {/* Render other form inputs and their corresponding error messages */}
        <View style={styles.loginBtnContainer}>
          <TouchableOpacity
            style={[styles.loginBtn, isSubmitting && styles.loginBtnDisabled]}
            title="loginSubmit"
            activeOpacity={0.7}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={AppColors.white} />
            ) : (
              <Text style={styles.loginBtnText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default LoginForm;

const styles = StyleSheet.create({
  fieldset: {
    marginTop: s(24),
  },
  email: {
    width: "100%",
  },
  field: {
    marginTop: s(16),
  },
  formLabel: {
    fontSize: s(12),
    marginBottom: s(8),
  },
  inputField: {
    borderWidth: 1,
    paddingLeft: 8,
    borderColor: AppColors.textInputBorderColor,
    height: s(48),
    borderRadius: s(8),
    width: windowWidth - 64,
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
    fontSize: s(14),
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
});
