import * as yup from 'yup';
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppColors } from '../../styles/colors'
import VectorImageSvg from '../../components/svg/VectorImageSvg'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import GymLocationPicker from '../../components/forms/GymLocationPicker'

// 1. Define the Yup validation schema
const schema = yup.object().shape({
  gymLocation: ''
});

const StartScreen = () => {
  const navigation = useNavigation()

  // 2. Initialize useForm with the Yup resolver
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      // email: '',
      // password: '',
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
      navigation.navigate('RegisterComplete');
    } catch (error) {
      // Handle API errors (React Hook Form does not swallow errors here)
      console.error("Login failed:", error);
      // Optionally, show an error message to the user
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
      </View>
      <View style={styles.headingContainer}>
        <Text style={styles.title}>Classy Gym</Text>
        <PinkLeafSvg style={styles.pinkLeaf} />
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <View style={styles.box}><Text style={styles.boxText}>Gym</Text></View>
          <View style={styles.box}><Text style={styles.boxText}>Classes</Text></View>
        </View>
        <View style={styles.row}>
          <View style={styles.box}><Text style={styles.boxText}>Training</Text></View>
        </View>
        <Text style={styles.subTitle}>Helping gyms and workouts be productive for everyone</Text>
        <View style={styles.fieldset}>
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
              // onPress={() => { navigation.navigate('RegisterScreen') }}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.registerBtnText}>
                Register
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.loginBtn}
              title="Login"
              // onPress={() => { navigation.navigate('LoginScreen') }}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.loginBtnText}>
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.imageContainer}>
        <VectorImageSvg />
      </View>
    </SafeAreaView>
  )
}

export default StartScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    // justifyContent: 'flex-end',
    alignItems: 'center',
    width: "100%",
    paddingLeft: 24,
    paddingRight: 24,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  headingContainer: {
    width: 375,
    alignItems: 'center'
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 60,
  },
  pinkLeaf: {
    position: 'relative',
    zIndex: -1,
    top: -68,
    right: -40
  },
  body: {
    // borderWidth: 1, borderColor: 'red',
    flex: 1,
  },
  bodyText: {
    fontSize: 16,
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
  },
  registerBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 16
  },
  loginBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    color: AppColors.blue,
    fontSize: 16
  },
  imageContainer: {
    marginBottom: 8
    // borderWidth: 1, borderColor: 'red',
  },
  row: {
    flexDirection: "row",
    justifyContent: 'space-evenly',
    marginBottom: 10,
  },
  fieldset: {
  },
  formLabel: {
    fontWeight: 'bold',
    marginBottom: 16
  },
  field: {
    marginBottom: 16,
    width: 300
    ,
    alignSelf: 'center'
  },
  box: {
    backgroundColor: AppColors.grey,
    width: 90,
    height: 90,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center"
  },
  boxText: {
    fontSize: 16,
  },
  subTitle: {
    fontFamily: "Montserrat",
    color: AppColors.blue,
    fontSize: 16,
    lineHeight: 32,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 24,
  }
})
