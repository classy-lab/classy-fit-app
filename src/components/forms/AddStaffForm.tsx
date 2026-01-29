import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Dimensions } from 'react-native'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import { useState } from 'react'
import SelectedRolePicker from './SelectedRolePicker'
import SexPicker from './SexPicker'
import PreferredContact from './PreferredContact'
import GymLocationPicker from './GymLocationPicker'

const phoneRegExp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/

// 1. Define the Yup validation schema
const schema = yup.object().shape({
  // email: yup.string().required('Email is required').email('Invalid email'),
  // password: yup.string().required('Password is required').min(13, 'Password must contain at least 13 characters').matches(
  // /^[a-zA-Z0-9]+$/,
  // 'Password must only contain alphanumeric characters (letters and numbers)'
  // ),
  // confirmPassword: yup.string().oneOf([yup.ref('password'), null]).required(),
  role: yup.string().oneOf(['Owner', 'Gym Member', 'Trainer']),
  // fname: yup.string().required().min(3),
  // lname: yup.string().required().min(2),
  // dateOfBirth: '',
  // age: yup.number().positive().integer().min(18).required(),
  sex: yup.string().oneOf(['Male', 'Female', 'Other']),
  phoneNumber: yup.string().matches(phoneRegExp, 'Phone Number is not valid'),
  whatsappNumber: yup.string().matches(phoneRegExp, 'WhatsApp Number number is not valid'),
  preferredContact: yup.string().oneOf(['Phone', 'Email', 'WhatsApp']),
  job: yup.string(),
  // gymLocation: ''
});

const AddStaffForm = () => {
  const navigation = useNavigation()
  // const [selectedLanguage, setSelectedLanguage] = useState();

  // 2. Initialize useForm with the Yup resolver
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      SexPicker: 'gymMember' // working?
    },
  })

  // 3. Define the submit handler
  const onSubmit = async (data) => {
    // This function only runs if validation passes
    console.log('Form Submitted (Validation Passed):', data)

    try {
      // Perform your authentication logic or API call here
      // const response = await api.post('/login', data);
      // If successful, navigate to the Login page or another desired screen
      navigation.navigate('RegisterComplete')
    } catch (error) {
      // Handle API errors (React Hook Form does not swallow errors here)
      console.error("Login failed:", error)
      // Optionally, show an error message to the user
    }
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
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType='default'
                secureTextEntry
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
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
                keyboardType='default'
                secureTextEntry
              />
            )}
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
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
                autoCapitalize="none" />
            )}
          />
          {errors.role && <Text style={styles.errorText}>{errors.role.message}</Text>}
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
          {errors.fname && <Text style={styles.errorText}>{errors.fname.message}</Text>}
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
          {errors.lname && <Text style={styles.errorText}>{errors.lname.message}</Text>}
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
          {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>}
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
          {errors.age && <Text style={styles.errorText}>{errors.age.message}</Text>}
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
          {errors.sex && <Text style={styles.errorText}>{errors.sex.message}</Text>}
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
          {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>}
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
          {errors.whatsappNumber && <Text style={styles.errorText}>{errors.whatsappNumber.message}</Text>}
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
          {errors.preferredContact && <Text style={styles.errorText}>{errors.preferredContact.message}</Text>}
        </View>

        <View style={styles.field}>
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
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Gym Location / Fitness Center</Text>
          <Controller
            control={control}
            name="gymLocation"
            render={({ field: { onChange, onBlur, value } }) => (
              <GymLocationPicker
                style={[
                  // styles.inputField,
                  // styles.selectList,
                  // isPressed ? styles.pressed : styles.normal,
                  // isActive ? styles.active : null
                ]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
              />
            )}
          />
          {errors.gymLocation && <Text style={styles.errorText}>{errors.gymLocation.message}</Text>}
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.registerBtn}
            title="Register"
            onPress={handleSubmit(onSubmit)}
            activeOpacity={0.7}
          >
            <Text style={styles.registerBtnText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginBtn}
            title="Login"
            onPress={handleSubmit(onSubmit)}
            activeOpacity={0.7}
          >
            <Text style={styles.loginBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}

export default AddStaffForm

const styles = StyleSheet.create({
  fieldset: {
    marginBottom: 32
  },
  email: {},
  formLabel: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 4
  },
  inputField: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.grey
  },
  errorText: {
    color: AppColors.red
  },
  createAcctBtn: {},
  createAcctBtnText: {},
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 22,
    height: 120
  },
  registerBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 248,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnText: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    color: '#fff'
  },
  loginBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 40,
    width: 248,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    fontFamily: 'Montserrat',
    color: AppColors.blue,
    fontSize: 16
  },
  selectList: {
    marginBottom: 80,
  }
})