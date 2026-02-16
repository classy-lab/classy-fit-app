import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import DesignerSvg from '../../components/svg/DesignerSvg'
import Feather from '@expo/vector-icons/Feather'

const ThankYouScreen = ({ navigation, route }) => {

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Thank you!</Text>
          </View>
          <View style={styles.body}>

            <Text style={styles.bodyText}>
              Your Order is complete. Your Order number is: {'\n'}
              <Text style={styles.boldText}>100</Text> {'\n'}
              A confirmation email has been sent to: <Text style={styles.boldText}>emma56@gmail.com</Text>
            </Text>

            <View style={styles.imageContainer}>
              <DesignerSvg />
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default ThankYouScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.blue,
    fontSize: 32,
    marginTop: 60,
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 8,
    alignItems: 'center'
    // borderWidth: 1, borderColor: 'red',
  },
  bodyText: {
    color: AppColors.primary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40
  },
  boldText: {
    fontWeight: 'bold',
  },
  imageContainer: {
    marginBottom: 8,
    alignItems: 'center',
    marginTop: 132
  }
})
