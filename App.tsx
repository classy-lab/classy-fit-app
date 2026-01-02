import { StyleSheet, Text, View, Button, Alert, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font'
import PinkLeafImg from './src/assets/images/pinkLeaf.png'

export default function App() {
  const vectorImg = require('./src/assets/images/vector-img.png')

  const [fontLoaded] = useFonts({
    "Montserrat": require("./src/assets/fonts/montserrat/Montserrat-Regular.ttf")
  })

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Classy Gym</Text>
      <Image style={styles.pinkLeaf} source={PinkLeafImg} />
      <View style={{
        flexDirection: "row",
        justifyContent: 'space-evenly',
        width: 300,
        marginTop: 32,
        marginBottom: 20
      }}>
        <View style={styles.box}><Text>Gym</Text></View>
        <View style={styles.box}><Text>Classes</Text></View>
      </View>
      <View style={{
        flexDirection: "row",
        justifyContent: 'space-evenly',
        width: 300,
        marginBottom: 20
      }}>
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
          onPress={() => { }}
          activeOpacity={0.7}
        >
          <Text style={styles.registerBtnText}>
            Register
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginBtn}
          title="Login"
          onPress={() => { }}
          activeOpacity={0.7}
        >
          <Text style={styles.loginBtnText}>
            Login
          </Text>
        </TouchableOpacity>
      </View>
      <Image style={styles.image} source={vectorImg} />
      {/* <SvgUri
        width="300"
        uri="https://cleancodeusa.com/img/online-learning.svg"
      /> */}
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: "100%"
  },
  title: {
    color: '#020EFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 32,
    marginTop: 90,
    marginBottom: 32
  },
  pinkLeaf: {
    position: 'relative',
    // zIndex: -1,
    top: -120,
    right: -80
  },
  box: {
    backgroundColor: '#F5F6FA',
    width: 90,
    height: 90,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center"
  },
  subTitle: {
    fontFamily: "Montserrat-Regular",
    color: '#020eff',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center'
  },
  registerBtn: {
    backgroundColor: '#020EFF',
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
    borderColor: '#020eff',
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#020eff',
    fontSize: 14
  },
  image: {
    // width: '90%'
  }
});
