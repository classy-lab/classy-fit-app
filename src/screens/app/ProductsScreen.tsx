import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import { s } from 'react-native-size-matters'
import Feather from '@expo/vector-icons/Feather'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

const windowHeight = Dimensions.get('window').height

const ProductsScreen = ({ navigation, route }) => {
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
  })

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
          {/* <View style={styles.signOut}>
            <Text style={styles.signOutText}>Add</Text>
            <View style={styles.circle}>
              <Feather name="plus" size={24} color={AppColors.white} size={18} onPress={() => { navigation.navigate('SignoutScreen') }} />
            </View>
            <Text style={styles.signOutText}>Sign out</Text>
            <View style={styles.circle}>
              <MaterialIcons name="logout" color={AppColors.white} size={18} onPress={() => { navigation.navigate('SignoutScreen') }} />
            </View>
          </View> */}
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Products</Text>
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
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Products</Text>
                <Text style={styles.countText}>Count: 6</Text>
              </View>
              <View style={styles.boxes}>
                <TouchableOpacity onPress={() => navigation.navigate('ProductsTab', { screen: 'ProductDetailScreen' })}>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/products/boxingGloves.png')} resizeMode="contain" />
                    <Text style={styles.productTitle}>Boxing Gloves</Text>
                    <Text style={styles.cost}>$25.00</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/products/proteinShaker.png')} resizeMode="contain" />
                    <Text style={styles.productTitle}>Protein Shaker</Text>
                    <Text style={styles.cost}>$10.00</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/products/proteinShaker2.png')} resizeMode="contain" />
                    <Text style={styles.productTitle}>Protein Shaker</Text>
                    <Text style={styles.cost}>$10.00</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/products/tShirt.png')} resizeMode="contain" />
                    <Text style={styles.productTitle}>T Shirt</Text>
                    <Text style={styles.cost}>$21.00</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/products/wristBand.png')} resizeMode="contain" />
                    <Text style={styles.productTitle}>Wrist band</Text>
                    <Text style={styles.cost}>$20.50</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/products/headPhones.png')} resizeMode="contain" />
                    <Text style={styles.productTitle}>Headphones</Text>
                    <Text style={styles.cost}>$100.00</Text>
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

export default ProductsScreen

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
    marginLeft: 10,
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
    // paddingLeft: 3
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 20,
  },
  pinkLeaf: {
    position: 'absolute',
    // zIndex: -1,
    // top: 0,
    right: 88
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
    marginTop: 20,
    height: s(48),
    borderRadius: s(8),
  },
  section: {
    // flexDirection: 'column',
    marginTop: 24,
    marginBottom: 32
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 24,
    // marginBottom: 16,
  },
  countText: {
    fontSize: 12
  },
  boxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 26,
    justifyContent: 'space-evenly',
    // alignItems: 'center',
  },
  image: {
    marginTop: 16,
    width: 96,
    height: 96
  },
  productTitle: {
    marginTop: 10,
    textAlign: 'center'
  },
  scrollView: {
    marginBottom: 32
  },
  cost: {
    marginTop: 8,
    textAlign: 'center',
    color: AppColors.grey2
  }
})
