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
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
};

type VideoCategory = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
};

const videoCategories: VideoCategory[] = [
  {
    key: "machines",
    title: "Machine Tutorials",
    subtitle: "Learn how to set up and use the most common gym machines.",
    icon: "weight-lifter",
    accent: "#2563EB",
  },
  {
    key: "cardio",
    title: "Cardio Workouts",
    subtitle: "Simple treadmill, rower, and elliptical sessions for all levels.",
    icon: "run",
    accent: "#7C3AED",
  },
  {
    key: "safety",
    title: "Safety & Etiquette",
    subtitle: "Warm-ups, machine safety, cleaning, and gym-friendly habits.",
    icon: "shield-check",
    accent: "#0F766E",
  },
  {
    key: "fullbody",
    title: "Workout Ideas",
    subtitle: "Use the equipment around you for simple strength sessions.",
    icon: "dumbbell",
    accent: "#DB2777",
  },
];

const gymVideoTopics: GymVideo[] = [
  {
    title: "Leg Press Machine Tutorial",
    description: "Learn foot placement, seat setup, and a safe range of motion.",
    category: "machines",
    query: "leg press machine tutorial proper form",
    icon: "weight-lifter",
    accent: "#2563EB",
  },
  {
    title: "Lat Pulldown Machine Tutorial",
    description: "A beginner-friendly walkthrough for back training and posture.",
    category: "machines",
    query: "lat pulldown machine tutorial proper form",
    icon: "weight-lifter",
    accent: "#2563EB",
  },
  {
    title: "Seated Row Machine Tutorial",
    description: "Build a stronger back while keeping your wrist and shoulder position in check.",
    category: "machines",
    query: "seated row machine tutorial proper form",
    icon: "weight-lifter",
    accent: "#2563EB",
  },
  {
    title: "Chest Press Machine Tutorial",
    description: "Set the seat height, control the press, and protect your shoulders.",
    category: "machines",
    query: "chest press machine tutorial proper form",
    icon: "weight-lifter",
    accent: "#2563EB",
  },
  {
    title: "Smith Machine Safety Guide",
    description: "See how to rack, unrack, and move safely on the Smith machine.",
    category: "safety",
    query: "smith machine safety tutorial",
    icon: "shield-check",
    accent: "#0F766E",
  },
  {
    title: "Gym Safety and Etiquette",
    description: "Cleaning equipment, sharing space, and staying safe around machines.",
    category: "safety",
    query: "gym safety etiquette equipment cleaning",
    icon: "shield-check",
    accent: "#0F766E",
  },
  {
    title: "Warm Up Before Lifting",
    description: "A quick mobility and activation routine before strength training.",
    category: "safety",
    query: "warm up before lifting routine",
    icon: "shield-check",
    accent: "#0F766E",
  },
  {
    title: "Cable Machine Exercises for Beginners",
    description: "Simple cable movements for arms, back, and core using the cable stack.",
    category: "fullbody",
    query: "cable machine exercises for beginners",
    icon: "dumbbell",
    accent: "#DB2777",
  },
  {
    title: "Full Body Machine Workout",
    description: "A simple whole-body gym session using common resistance machines.",
    category: "fullbody",
    query: "full body machine workout beginner",
    icon: "dumbbell",
    accent: "#DB2777",
  },
  {
    title: "Rowing Machine Technique",
    description: "Use the rower efficiently with good posture, leg drive, and rhythm.",
    category: "cardio",
    query: "rowing machine technique tutorial",
    icon: "run",
    accent: "#7C3AED",
  },
  {
    title: "Treadmill Walking Workout",
    description: "Low-impact treadmill ideas for warm-ups, fat loss, and steady cardio.",
    category: "cardio",
    query: "treadmill walking workout beginner",
    icon: "run",
    accent: "#7C3AED",
  },
  {
    title: "Elliptical Workout Tips",
    description: "Get more from the elliptical with interval suggestions and posture tips.",
    category: "cardio",
    query: "elliptical workout tips beginner",
    icon: "run",
    accent: "#7C3AED",
  },
];

const buildYouTubeSearchUrl = (query: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

const GymVideosScreen = ({ navigation }: { navigation: any }) => {
  const groupedTopics = useMemo(() => {
    return videoCategories.map((category) => ({
      ...category,
      count: gymVideoTopics.filter((topic) => topic.category === category.key).length,
      videos: gymVideoTopics.filter((topic) => topic.category === category.key),
    }));
  }, []);

  const featuredTopics = useMemo(
    () => [
      gymVideoTopics.find((video) => video.title === "Leg Press Machine Tutorial"),
      gymVideoTopics.find((video) => video.title === "Gym Safety and Etiquette"),
      gymVideoTopics.find((video) => video.title === "Full Body Machine Workout"),
    ].filter(Boolean),
    [],
  );

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
                Tap a topic to open a YouTube search for exercise form, machine tutorials, and gym safety.
              </Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatPill}>
              <MaterialCommunityIcons name="play-box-multiple" size={16} color={AppColors.blue} />
              <Text style={styles.heroStatText}>12 curated topics</Text>
            </View>
            <View style={styles.heroStatPill}>
              <MaterialCommunityIcons name="shield-check" size={16} color={AppColors.blue} />
              <Text style={styles.heroStatText}>Form & safety first</Text>
            </View>
          </View>
        </View>

        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured picks</Text>
            <Text style={styles.sectionSubtitle}>Quick-start videos members often need first.</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
            {featuredTopics.map((video) => (
              <TouchableOpacity
                key={video.title}
                style={[styles.featuredCard, { borderColor: video.accent }]}
                activeOpacity={0.9}
                onPress={() => openYouTube(video.query)}
              >
                <View style={[styles.previewPane, { backgroundColor: video.accent }]}>
                  <View style={styles.previewTopRow}>
                    <View style={styles.previewBadge}>
                      <MaterialCommunityIcons name={video.icon} size={15} color={video.accent} />
                      <Text style={[styles.previewBadgeText, { color: video.accent }]}>
                        {videoCategories.find((category) => category.key === video.category)?.title}
                      </Text>
                    </View>
                    <View style={styles.previewPlayButton}>
                      <MaterialCommunityIcons name="play" size={18} color={AppColors.white} />
                    </View>
                  </View>
                  <Text style={styles.previewTitle} numberOfLines={3}>
                    {video.title}
                  </Text>
                  <Text style={styles.previewLabel}>Open on YouTube</Text>
                </View>
                <View style={styles.featuredBody}>
                  <Text style={styles.featuredDescription} numberOfLines={3}>
                    {video.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {groupedTopics.map((category) => (
          <View key={category.key} style={styles.categoryBlock}>
            <View style={styles.sectionHeader}>
              <View style={styles.categoryHeaderRow}>
                <View style={[styles.categoryIcon, { backgroundColor: category.accent }]}>
                  <MaterialCommunityIcons name={category.icon} size={18} color={AppColors.white} />
                </View>
                <View style={styles.categoryHeaderText}>
                  <Text style={styles.sectionTitle}>{category.title}</Text>
                  <Text style={styles.sectionSubtitle}>{category.subtitle}</Text>
                </View>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{category.count} videos</Text>
              </View>
            </View>

            {category.videos.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.videoCard}
                activeOpacity={0.86}
                onPress={() => openYouTube(item.query)}
              >
                <View style={[styles.videoThumbnail, { backgroundColor: item.accent }]}>
                  <View style={styles.thumbnailTopRow}>
                    <View style={styles.thumbnailTag}>
                      <MaterialCommunityIcons name={item.icon} size={14} color={item.accent} />
                      <Text style={[styles.thumbnailTagText, { color: item.accent }]}>YouTube</Text>
                    </View>
                    <View style={styles.thumbnailPlayCircle}>
                      <MaterialCommunityIcons name="play" size={20} color={AppColors.white} />
                    </View>
                  </View>
                  <Text style={styles.thumbnailHeadline} numberOfLines={3}>
                    {item.title}
                  </Text>
                  <Text style={styles.thumbnailSubhead}>Tap to search YouTube</Text>
                </View>

                <View style={styles.videoBody}>
                  <Text style={styles.videoTitle}>{item.title}</Text>
                  <Text style={styles.videoDescription}>{item.description}</Text>
                  <View style={styles.actionRow}>
                    <View style={styles.actionPill}>
                      <Text style={styles.actionPillText}>Open video search</Text>
                    </View>
                    <Feather name="external-link" size={16} color={AppColors.blue} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: AppColors.white,
    borderRadius: 24,
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
    width: 54,
    height: 54,
    borderRadius: 18,
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
  heroStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  heroStatPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  heroStatText: {
    color: AppColors.blue,
    fontSize: 12,
    fontFamily: "Montserrat",
  },
  featuredSection: {
    marginTop: 20,
  },
  featuredRow: {
    gap: 12,
    paddingBottom: 4,
  },
  featuredCard: {
    width: 230,
    borderRadius: 22,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    overflow: "hidden",
  },
  previewPane: {
    minHeight: 170,
    padding: 14,
    justifyContent: "space-between",
  },
  previewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewBadgeText: {
    fontSize: 11,
    fontFamily: "Montserrat",
  },
  previewPlayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewTitle: {
    color: AppColors.white,
    fontFamily: "Montserrat",
    fontSize: 18,
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 8,
  },
  previewLabel: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    fontFamily: "Montserrat",
  },
  featuredBody: {
    padding: 14,
  },
  featuredDescription: {
    color: AppColors.grey3,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Montserrat",
  },
  categoryBlock: {
    marginTop: 22,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  categoryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryHeaderText: {
    flex: 1,
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
  countPill: {
    alignSelf: "flex-start",
    backgroundColor: AppColors.white,
    borderColor: AppColors.grey,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countPillText: {
    color: AppColors.blue,
    fontSize: 12,
    fontFamily: "Montserrat",
  },
  videoCard: {
    backgroundColor: AppColors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: AppColors.grey,
    marginBottom: 12,
    overflow: "hidden",
  },
  videoThumbnail: {
    minHeight: 160,
    padding: 14,
    justifyContent: "space-between",
  },
  thumbnailTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  thumbnailTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  thumbnailTagText: {
    fontSize: 11,
    fontFamily: "Montserrat",
  },
  thumbnailPlayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailHeadline: {
    color: AppColors.white,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: "Montserrat",
    marginTop: 10,
    marginBottom: 8,
  },
  thumbnailSubhead: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    fontFamily: "Montserrat",
  },
  videoBody: {
    padding: 14,
  },
  videoTitle: {
    color: AppColors.primary,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "Montserrat",
    marginBottom: 6,
  },
  videoDescription: {
    color: AppColors.grey3,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Montserrat",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionPill: {
    backgroundColor: "#EEF5FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionPillText: {
    color: AppColors.blue,
    fontSize: 12,
    fontFamily: "Montserrat",
  },
  footerCard: {
    marginTop: 18,
    backgroundColor: AppColors.white,
    borderRadius: 18,
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
