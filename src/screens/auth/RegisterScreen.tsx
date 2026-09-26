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
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="person-add-outline" size={26} color={AppColors.white} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>Join Classy Fit</Text>
                <Text style={styles.title}>Create your account</Text>
              </View>
            </View>
            <Text style={styles.subHead}>
              Sign up to book classes, shop products, and manage your membership in one place.
            </Text>
            {selectedGym ? (
              <View style={styles.selectedGym}>
                <Ionicons name="location-outline" size={16} color={AppColors.blue} />
                <Text style={styles.selectedGymText}>{selectedGym}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" color={AppColors.blue} size={20} />
              <Text style={styles.infoTitle}>Quick signup</Text>
            </View>
            <Text style={styles.infoText}>
              Fill out the form below to get started. It only takes a minute, and you can update your profile later.
            </Text>
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
  heroCard: {
    backgroundColor: AppColors.grey4,
    borderRadius: 28,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: AppColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 28,
    lineHeight: 34,
  },
  subHead: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.primary,
  },
  selectedGym: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    fontFamily: 'Montserrat',
    fontSize: 13,
    color: AppColors.primary,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedGymText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  infoCard: {
    backgroundColor: AppColors.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.grey2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  infoText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 13,
    lineHeight: 19,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  formCard: {
    backgroundColor: AppColors.white,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  imageContainer: {
    marginTop: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  scrollView: {}
})
