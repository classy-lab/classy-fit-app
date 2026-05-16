import { StyleSheet, Text, View, Dimensions, ScrollView, TouchableOpacity, Image, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import WorkoutSvg from '../../components/svg/WorkoutSvg'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

const TemplateScreen = () => {
  const { height, width } = useWindowDimensions()
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
          <View style={styles.signOut}>
            <Text style={styles.signOutText}>Add</Text>
            <View style={styles.circle}>
              <Feather name="plus" size={24} color={AppColors.white} size={18} onPress={() => { navigation.navigate('SignoutScreen') }} />
            </View>
            <Text style={styles.signOutText}>Sign out</Text>
            <View style={styles.circle}>
              <MaterialIcons name="logout" color={AppColors.white} size={18} onPress={() => { navigation.navigate('SignoutScreen') }} />
            </View>
          </View>
        </View> */}
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
          <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Template</Text>
            <PinkLeafSvg style={styles.pinkLeaf} />
          </View>
          <View style={[styles.body]}>
            <Text style={styles.bodyText}>
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            </Text>
          </View>
        </ScrollView>
        <View style={styles.imageContainer}>
          <WorkoutSvg />
        </View>
      </SafeAreaView>
    </>
  )
}

export default TemplateScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
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
    position: 'relative',
    zIndex: -1,
    top: -68,
    right: -40
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 8,
  },
  bodyText: {
    marginBottom: 8,
    fontFamily: "Montserrat",
    lineHeight: 32,
    color: AppColors.blue,
    fontSize: 20,
    textAlign: 'center'
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  }
})
