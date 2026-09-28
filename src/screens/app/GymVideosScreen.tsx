// @ts-nocheck
import { useMemo } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import SignOut from "../../components/utils/SignOut";
import { AppColors } from "../../styles/colors";

type GymVideo = {
  title: string;
  description: string;
  category: string;
  query: string;
};

const gymVideoTopics: GymVideo[] = [
  {
    title: "Leg Press Machine Tutorial",
    description: "Learn foot placement, seat setup, and safe range of motion on the leg press.",
    category: "Machines",
    query: "leg press machine tutorial proper form",
  },
  {
    title: "Lat Pulldown Machine Tutorial",
    description: "A beginner-friendly walkthrough for back training and shoulder-safe pulling.",
    category: "Upper Body",
    query: "lat pulldown machine tutorial proper form",
  },
  {
    title: "Seated Row Machine Tutorial",
    description: "Build a stronger back while keeping your posture and wrist position in check.",
    category: "Upper Body",
    query: "seated row machine tutorial proper form",
  },
  {
    title: "Chest Press Machine Tutorial",
    description: "Set the seat height, control the press, and keep your shoulders protected.",
    category: "Upper Body",
    query: "chest press machine tutorial proper form",
  },
  {
    title: "Smith Machine Safety Guide",
    description: "See how to rack, unrack, and move safely on the Smith machine.",
    category: "Safety",
    query: "smith machine safety tutorial",
  },
  {
    title: "Cable Machine Exercises for Beginners",
    description: "Simple cable movements for arms, back, and core using the cable stack.",
    category: "Machines",
    query: "cable machine exercises for beginners",
  },
  {
    title: "Rowing Machine Technique",
    description: "Use the rower efficiently with good posture, leg drive, and rhythm.",
    category: "Cardio",
    query: "rowing machine technique tutorial",
  },
  {
    title: "Treadmill Walking Workout",
    description: "Low-impact treadmill ideas for warm-ups, fat loss, and steady cardio.",
    category: "Cardio",
    query: "treadmill walking workout beginner",
  },
  {
    title: "Elliptical Workout Tips",
    description: "Get more from the elliptical with interval suggestions and posture tips.",
    category: "Cardio",
    query: "elliptical workout tips beginner",
  },
  {
    title: "Full Body Machine Workout",
    description: "A simple whole-body gym session using common resistance machines.",
    category: "Workout",
    query: "full body machine workout beginner",
  },
  {
    title: "Warm Up Before Lifting",
    description: "A quick mobility and activation routine before strength training.",
    category: "Safety",
    query: "warm up before lifting routine",
  },
  {
    title: "Gym Safety and Etiquette",
    description: "Cleaning equipment, sharing space, and staying safe around machines.",
    category: "Safety",
    query: "gym safety etiquette equipment cleaning",
  },
];

const buildYouTubeSearchUrl = (query: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

const GymVideosScreen = ({ navigation }: { navigation: any }) => {
  const groupedTopics = useMemo(() => gymVideoTopics, []);

  const openYouTube = async (query: string) => {
    const url = buildYouTubeSearchUrl(query);

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Unable to open YouTube", "Please check that YouTube is available on this device.");
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.log("Failed to open YouTube video search", error);
      Alert.alert("Unable to open YouTube", "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Feather
          name="arrow-left"
          color={AppColors.blue}
          size={36}
          onPress={() => navigation.goBack()}
        />
        <SignOut />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="youtube" size={28} color={AppColors.white} />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.eyebrow}>Gym Videos</Text>
              <Text style={styles.title}>Learn, train, and stay safe</Text>
              <Text style={styles.subtitle}>
                Tap a topic to open a helpful YouTube search for exercise form, machine tutorials, and gym safety.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended videos</Text>
          <Text style={styles.sectionSubtitle}>12 useful YouTube topics for every gym member.</Text>
        </View>

        {groupedTopics.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => openYouTube(item.query)}
          >
            <View style={styles.cardIcon}>
              <MaterialCommunityIcons name="play-circle" size={28} color={AppColors.blue} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.category}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <Feather name="external-link" size={18} color={AppColors.blue} />
          </TouchableOpacity>
        ))}

        <View style={styles.footerCard}>
          <MaterialCommunityIcons name="information-outline" size={22} color={AppColors.blue} />
          <Text style={styles.footerText}>
            These links open YouTube search results so users can choose the most relevant video and version for their machine.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GymVideosScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grey,
  },
  navs: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: AppColors.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: AppColors.grey,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FF0000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroTextBlock: {
    flex: 1,
  },
  eyebrow: {
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: "Montserrat",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    color: AppColors.blue,
    fontSize: 26,
    lineHeight: 32,
    fontFamily: "Montserrat",
    marginBottom: 6,
  },
  subtitle: {
    color: AppColors.grey3,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Montserrat",
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: AppColors.blue,
    fontSize: 20,
    fontFamily: "Montserrat",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: AppColors.grey3,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Montserrat",
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.grey,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  badge: {
    backgroundColor: "#F3F7FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: AppColors.blue,
    fontSize: 11,
    fontFamily: "Montserrat",
  },
  cardTitle: {
    color: AppColors.primary,
    fontSize: 15,
    fontFamily: "Montserrat",
    marginBottom: 4,
  },
  cardDescription: {
    color: AppColors.grey3,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Montserrat",
  },
  footerCard: {
    marginTop: 8,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.grey,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerText: {
    flex: 1,
    color: AppColors.grey3,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Montserrat",
  },
});
