import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import { s } from 'react-native-size-matters'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Feather from '@expo/vector-icons/Feather'
import ClassyGymTabNavigator from '../ClassyGymTabNavigator'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

const windowHeight = Dimensions.get('window').height

const StaffScreen = () => {
  const navigation = useNavigation()

  // 1. Define the Yup validation schema
  const schema = yup.object().shape({
    search: yup.string().required('Search field is required').matches(
      /^[a-zA-Z0-9]+$/,
      'Password must only contain alphanumeric characters (letters and numbers)'
    )
  })

  // 2. Initialize useForm with the Yup resolver
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      search: '',
    },
  })

  // 3. Define the submit handler
  const onSubmit = async (data) => {
    // This function only runs if validation passes
    console.log('Form Submitted (Validation Passed):', data);

    try {
      // Perform your authentication logic or API call here
      // const response = await api.post('/login', data);
      // If successful, navigate to the Login page or another desired screen
      // navigation.navigate('DashboardScreen');
    } catch (error) {
      // Handle API errors (React Hook Form does not swallow errors here)
      console.error("Login failed:", error);
      // Optionally, show an error message to the user
    }
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
          <View style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
            <View style={styles.circle}>
              <MaterialIcons name="logout" color={AppColors.white} size={18} onPress={() => { navigation.navigate('SignoutScreen') }} />
            </View>
          </View>
        </View>
        <ScrollView>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Staff</Text>
            <PinkLeafSvg style={styles.pinkLeaf} />
          </View>
          <View style={styles.body}>


            <View style={styles.fieldset}>
              <View style={styles.field}>
                <Controller
                  control={control}
                  name="search"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="default"
                      autoCapitalize="none"
                      placeholder="Search"
                    />
                  )}
                />

              </View>
              {/* Render other form inputs and their corresponding error messages */}
              <View style={styles.loginBtnContainer}>
                <TouchableOpacity
                  style={styles.loginBtn}
                  title="loginSubmit"
                  activeOpacity={0.7}
                  onPress={handleSubmit(onSubmit)}
                >
                  <Text style={styles.loginBtnText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>
            {errors.search && <Text style={styles.errorText}>{errors.search.message}</Text>}

          </View>
        </ScrollView>
        <ClassyGymTabNavigator />
      </SafeAreaView>

    </>
  )
}

export default StaffScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
    width: '100%',
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    marginRight: 4,
    color: AppColors.blue,
    fontSize: 14
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 60,
  },
  pinkLeaf: {
    position: 'absolute',
    // zIndex: -1,
    top: 40,
    right: 140
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 8,
    flex: 1,
    height: windowHeight,
    // borderWidth: 1, borderColor: 'red',
  },
  errorText: {
    color: AppColors.red
  },
  fieldset: {
    flexDirection: 'row',
    // borderWidth: 1, borderColor: 'red',
    alignItems: 'center',
    justifyContent: 'center'
  },
  field: {
    flexGrow: 1
  },
  inputField: {
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    paddingLeft: 22,
    height: s(48),
    borderRadius: s(8),
  },
  loginBtnContainer: {
    alignItems: 'center',
  },
  loginBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 8,
    height: s(48),
    justifyContent: 'center',
    marginLeft: 8,
    padding: 4
  },
  loginBtnText: {
    color: AppColors.white,
    fontSize: s(14),
    fontFamily: 'Montserrat-Medium'
  },
})
