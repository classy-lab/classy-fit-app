import {
  StyleSheet,
  Button,
  Text,
  View,
  Image,
  TouchableOpacity,
  useWindowDimensions
} from 'react-native';
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SafeAreaView } from 'react-native-safe-area-context';
import PinkLeafImg from '../../assets/images/pinkLeaf.png'

const AuthStack = () => {
  const navigation = useNavigation()
  const vectorImg = require('../../assets/images/vector-img.png')
  const { height, width } = useWindowDimensions();
  const [fontLoaded] = useFonts({
    'Montserrat-Regular': require('../../assets/fonts/montserrat/Montserrat-Regular.ttf'),
    'Montserrat-Bold': require('../../assets/fonts/montserrat/Montserrat-Bold.ttf'),
    'Montserrat-Medium': require('../../assets/fonts/montserrat/Montserrat-Medium.ttf'),
  })

  return (
    <SafeAreaView style={styles.container}>
      <Button
        onPress={() => navigation.openDrawer()}
        title="Open Drawer"
      />
      <View style={styles.headingContainer}>
        <Text style={styles.title}>Classy Gym</Text>
        <Image style={styles.pinkLeaf} source={PinkLeafImg} />
      </View>
      <View style={styles.row}>
        <View style={styles.box}><Text>Gym</Text></View>
        <View style={styles.box}><Text>Classes</Text></View>
      </View>
      <View style={styles.row}>
        <View style={styles.box}><Text>Training</Text></View>
      </View>
      <Text style={styles.subTitle}>Helping gyms and workouts be productive for everyone</Text>
      <View style={{
        flexDirection: "row",
        justifyContent: 'space-evenly',
        width: 300,
        marginTop: 32,
        marginBottom: 20
      }}>
        <TouchableOpacity
          style={styles.registerBtn}
          title="Register"
          onPress={() => { navigation.navigate('RegisterScreen') }}
          activeOpacity={0.7}
        >
          <Text style={styles.registerBtnText}>
            Register
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginBtn}
          title="Login"
          onPress={() => { navigation.navigate('LoginScreen') }}
          activeOpacity={0.7}
        >
          <Text style={styles.loginBtnText}>
            Login
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.imageContainer}>
        <Image style={styles.image} source={vectorImg} />
      </View>
      {/* <SvgUri
        width="300"
        uri="https://cleancodeusa.com/img/online-learning.svg"
      /> */}
    </SafeAreaView>
  )
}

export default AuthStack

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    alignItems: 'center',
    width: "100%",
    borderWidth: 1,
  },
  headingContainer: {
    width: 375,
    alignItems: 'center'
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat-Regular',
    fontSize: 32,
    marginTop: 90,
  },
  pinkLeaf: {
    position: 'relative',
    zIndex: -1,
    top: -68,
    right: -72
  },
  row: {
    flexDirection: "row",
    justifyContent: 'space-evenly',
    width: 300,
    marginBottom: 10,
  },
  box: {
    backgroundColor: AppColors.grey,
    width: 90,
    height: 90,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center"
  },
  subTitle: {
    fontFamily: "Montserrat-Regular",
    color: AppColors.blue,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    margin: 32
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
    fontSize: 14
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
    fontSize: 14
  },
  imageContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    marginBottom: 32
  }
})
