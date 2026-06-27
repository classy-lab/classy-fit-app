import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import Feather from '@expo/vector-icons/Feather'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import { useEffect } from 'react'
import SignOut from '../../components/utils/SignOut'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

const StaffScreen = ({ navigation, route }) => {
  const [fontsLoaded] = useFonts({
    Montserrat: require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf"),
  });

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

    try {
      // Perform your authentication logic or API call here
      // const response = await api.post('/login', data);
      // If successful, navigate to the Login page or another desired screen
      console.log('Form Submitted (Validation Passed):', data);
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
          <Feather
            name="arrow-left"
            color={AppColors.blue}
            size={36}
            onPress={() => {
              navigation.goBack();
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
            {/* move to separate component */}
            <View style={styles.signOut}>
              <Text style={styles.signOutText}>Add</Text>
              <View style={styles.circle}>
                <MaterialIcons name="add" color={AppColors.white} size={16} />
              </View>
            </View>
            <SignOut />
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
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
                      // onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="default"
                      autoCapitalize="none"
                      placeholder="Search"
                      placeholderTextColor={AppColors.blue}
                      onBlur={handleSubmit(onSubmit)}
                    />
                  )}
                />
              </View>
              {/* Render other form inputs and their corresponding error messages */}
              {errors.search && <Text style={styles.errorText}>{errors.search.message}</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Owners</Text>
              <View style={styles.boxes}>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/sarahHeadshot.png')} />
                    <Text style={styles.personName}>Sarah B.</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trainers</Text>
              <View style={styles.boxes}>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/jenniferHeadshot.png')} />
                    <Text style={styles.personName}>Jenniffer P.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/mariaHeadshot.png')} />
                    <Text style={styles.personName}>Maria K.</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default StaffScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 32,
    marginTop: 20,
    marginBottom: 40,
    width: 320,
    textAlign: "center",
  },
  pinkLeaf: {
    position: "absolute",
    zIndex: -1,
    // top: -8,
    right: 96,
  },
  body: {
    flex: 1,
  },
  bodyText: {
    fontSize: 16,
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    marginLeft: 10,
    marginRight: 4,
    color: AppColors.blue,
    fontSize: 14
  },
  errorText: {
    color: AppColors.red,
    // marginTop: 8
  },
  fieldset: {},
  field: {
    flexGrow: 1
  },
  inputField: {
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    paddingLeft: 22,
    // marginTop: 20,
    height: 48,
    borderRadius: 8,
  },
  section: {
    // flexDirection: 'column',
    marginTop: 24,
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 24,
    // marginBottom: 16,
    width: '100%'
  },
  boxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 26,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  box: {},
  image: {
    marginTop: 16,
    width: 80,
    height: 80
  },
  personName: {
    marginTop: 10,
    textAlign: 'center'
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
