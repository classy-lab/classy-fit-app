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

const AddProductForm = () => {
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
          <Text style={styles.formLabel}>Title</Text>
          <Controller
            control={control}
            name="productTitle"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
                placeholder="Protein Shaker"
              />
            )}
          />
          {errors.productTitle && <Text style={styles.errorText}>{errors.productTitle.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Description</Text>
          <Controller
            control={control}
            name="productDescription"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputTextAreaField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType='default'
                numberOfLines={4}
                multiline={true}
                placeholder="Type product description here"
              />
            )}
          />
          {errors.productDescription && <Text style={styles.errorText}>{errors.productDescription.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Images</Text>
          <Controller
            control={control}
            name="productImages"
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
          {errors.productImages && <Text style={styles.errorText}>{errors.productImages.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Cost</Text>
          <Controller
            control={control}
            name="cost"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
                placeholder="50.00"
              />
            )}
          />
          {errors.cost && <Text style={styles.errorText}>{errors.cost.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Size</Text>
          <Controller
            control={control}
            name="size"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
                placeholder="Medium"
              />
            )}
          />
          {errors.size && <Text style={styles.errorText}>{errors.size.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Color</Text>
          <Controller
            control={control}
            name="color"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
                placeholder="Red"
              /> // needs date picker added. check
            )}
          />
          {errors.color && <Text style={styles.errorText}>{errors.color.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Brand Name</Text>
          <Controller
            control={control}
            name="brandName"
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
          {errors.brandName && <Text style={styles.errorText}>{errors.brandName.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Type</Text>
          <Controller
            control={control}
            name="productType"
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
          {errors.productType && <Text style={styles.errorText}>{errors.productType.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Warranty Description</Text>
          <Controller
            control={control}
            name="warrantyDescription"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputTextAreaField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType='default'
                numberOfLines={4}
                multiline={true}
                placeholder="Type warranty description here"
              />
            )}
          />
          {errors.warrantyDescription && <Text style={styles.errorText}>{errors.warrantyDescription.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Model Name</Text>
          <Controller
            control={control}
            name="modelName"
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
          {errors.modelName && <Text style={styles.errorText}>{errors.modelName.message}</Text>}
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

export default AddProductForm

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
  inputTextAreaField: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    height: 96,
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