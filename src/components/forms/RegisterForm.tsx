import * as yup from 'yup';
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Dimensions } from 'react-native'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useFonts } from 'expo-font'
import { s, vs } from 'react-native-size-matters'
import { useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import SelectedLanguagePicker from './SelectedLanguagePicker'
import CheckboxComponent from './CheckboxComponent'
import RegisterComplete from '../../screens/auth/RegisterComplete'

const windowWidth = Dimensions.get('window').width

// 1. Define the Yup validation schema
const schema = yup.object().shape({
  email: yup.string().required('Email is required').email('Invalid email'),
  password: yup.string().required('Password is required').min(13, 'Password must contain at least 13 characters').matches(
    /^[a-zA-Z0-9]+$/,
    'Password must only contain alphanumeric characters (letters and numbers)'
  ),
});

const RegisterForm = () => {
  const navigation = useNavigation()
  const [selectedLanguage, setSelectedLanguage] = useState();

  // 2. Initialize useForm with the Yup resolver
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // 3. Define the submit handler
  const onSubmit = (data) => {
    console.log("Form Submitted:", data);
    // Handle form submission logic (e.g., API call)
  }

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
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Password</Text>
          <TextInput style={styles.inputField} name="password"  {...register("password")} keyboardType='default' secureTextEntry />
          {errors.password && <Text style={styles.errorMessage}>{errors.password.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Confirm Password</Text>
          <TextInput style={styles.inputField} name="confirmPassword"  {...register("confirmPassword")} keyboardType='default' secureTextEntry />
          {errors.password && <Text style={styles.errorMessage}>{errors.password.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Role</Text>
          <SelectedLanguagePicker name="role"  {...register("role")} />
          {errors.password && <Text style={styles.errorMessage}>{errors.password.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>First Name</Text>
          <TextInput style={styles.inputField} name="fname" {...register("fname")} keyboardType='default' />
          {errors.fname && <Text>{errors.fname.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Last Name</Text>
          <TextInput style={styles.inputField} name="lname" {...register("lname")} keyboardType='default' />
          {errors.lname && <Text>{errors.lname.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Date of Birth</Text>
          <TextInput style={styles.inputField} name="dateOfBirth" {...register("dateOfBirth")} keyboardType='default' />
          {errors.dateOfBirth && <Text>{errors.dateOfBirth.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Age</Text>
          <TextInput style={styles.inputField} name="age" {...register("age")} keyboardType='default' />
          {errors.age && <Text>{errors.age.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Sex</Text>
          <TextInput style={styles.inputField} name="sex" {...register("sex")} keyboardType='default' />
          {errors.sex && <Text>{errors.sex.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Phone Number</Text>
          <TextInput style={styles.inputField} name="phoneNumber" {...register("phoneNumber")} keyboardType='default' />
          {errors.phoneNumber && <Text>{errors.phoneNumber.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>WhatsApp Number</Text>
          <TextInput style={styles.inputField} name="whatsappNumber" {...register("whatsappNumber")} keyboardType='default' />
          {errors.whatsappNumber && <Text>{errors.whatsappNumber.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Preferred Contact</Text>
          <TextInput style={styles.inputField} name="preferredContact" {...register("preferredContact")} keyboardType='default' />
          {errors.preferredContact && <Text>{errors.preferredContact.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Job</Text>
          <TextInput style={styles.inputField} name="job" {...register("job")} keyboardType='default' />
          {errors.job && <Text>{errors.job.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Gym Location / Fitness Center</Text>
          <TextInput style={styles.inputField} name="gymLocation" {...register("gymLocation")} keyboardType='default' />
          {errors.gymLocation && <Text>{errors.gymLocation.message}</Text>}
        </View>

        <CheckboxComponent />

        <View style={styles.loginBtnContainer}>
          <TouchableOpacity
            style={styles.loginBtn}
            title="loginSubmit"
            activeOpacity={0.7}
            onPress={() => {
              handleSubmit(onSubmit)
              navigation.navigate('RegisterComplete')
            }}
          >
            <Text style={styles.loginBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default RegisterForm

const styles = StyleSheet.create({
  fieldset: {
    marginBottom: s(32)
  },
  email: {},
  formLabel: {
    fontSize: s(12),
    marginTop: s(16),
    // marginBottom: s(-10)
  },
  inputField: {
    marginTop: s(5),
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    height: s(48),
    borderRadius: s(8),
    width: windowWidth - 64,
    backgroundColor: AppColors.grey
  },
  errorMessage: {},
  createAcctBtn: {},
  createAcctBtnText: {},
  loginBtnContainer: {
    alignItems: 'center',
    marginTop: s(16)
  },
  loginBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 250,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    color: AppColors.white,
    fontSize: s(14),
    fontFamily: 'Montserrat-Medium'
  },
})