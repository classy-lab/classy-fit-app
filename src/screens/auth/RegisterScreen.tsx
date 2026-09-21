// @ts-nocheck
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native'
import { AppColors } from '../../styles/colors'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import VectorImageSvg from '../../components/svg/VectorImageSvg'
import RegisterForm from '../../components/forms/RegisterForm'

const RegisterScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const selectedGym = route.params?.gym || ''
  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => { navigation.goBack() }} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Open menu">
            <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Register</Text>
            <Text style={styles.subHead}>Create your account to book classes, shop products, and manage your membership.</Text>
            {selectedGym ? <Text style={styles.selectedGym}>{selectedGym}</Text> : null}
          </View>
          <View style={styles.formCard}>
            <RegisterForm />
          </View>
          <View style={styles.imageContainer}>
            <VectorImageSvg />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default RegisterScreen

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
    alignItems: 'center',
    marginTop: 8,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 34,
    marginBottom: 8,
  },
  subHead: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.primary,
    textAlign: 'center',
  },
  selectedGym: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    fontFamily: 'Montserrat',
    fontSize: 13,
    color: AppColors.blue,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  formCard: {
    backgroundColor: AppColors.white,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  imageContainer: {
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  scrollView: {}
})
