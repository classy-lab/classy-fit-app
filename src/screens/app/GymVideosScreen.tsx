// @ts-nocheck
import { useCallback, useContext, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import SignOut from '../../components/utils/SignOut'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import {
  fetchPublishedGymVideos,
  gymVideoCategories,
  getGymVideoCategoryLabel,
  getGymVideoCategoryMeta,
  getGymVideoThumbnailUri,
  type GymVideoRecord,
} from '../../utils/gymVideosApi'
import { showMessage } from 'react-native-flash-message'
import { useFocusEffect } from '@react-navigation/native'

const GymVideosScreen = ({ navigation }: { navigation: any }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext)
  const [videos, setVideos] = useState<GymVideoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | GymVideoRecord['category']>('all')
  const [failedThumbnails, setFailedThumbnails] = useState<Record<string, boolean>>({})

  const loadVideos = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!user?.gym_id || !tokens?.access_token) {
        setErrorMessage('Please sign in again to view gym videos.')
        setVideos([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setErrorMessage('')

      try {
        const result = await fetchPublishedGymVideos({
          webServer,
          gymId: user.gym_id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          setTokens,
        })

        if (!result.ok) {
          const message = result.message || 'Unable to load gym videos.'
          setErrorMessage(message)
          setVideos([])
          showMessage({
            message: 'Gym videos unavailable',
            description: message,
            type: 'danger',
          })
          return
        }

        setVideos(result.videos)
        setFailedThumbnails({})
      } catch (error) {
        console.log('Failed to load gym videos:', error)
        const message = 'Failed to load gym videos.'
        setErrorMessage(message)
        setVideos([])
        showMessage({
          message: 'Gym videos unavailable',
          description: message,
          type: 'danger',
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [setTokens, tokens?.access_token, tokens?.refresh_token, user?.gym_id, webServer],
  )

  useFocusEffect(
    useCallback(() => {
      let isActive = true

      const run = async () => {
        if (!isActive) {
          return
        }
        await loadVideos()
      }

      void run()

      return () => {
        isActive = false
      }
    }, [loadVideos]),
  )

  const filteredVideos = useMemo(() => {
    if (activeCategory === 'all') {
      return videos
    }

    return videos.filter((video) => video.category === activeCategory)
  }, [activeCategory, videos])

  const categoryCounts = useMemo(() => {
    return gymVideoCategories.reduce<Record<string, number>>((acc, category) => {
      acc[category.key] = videos.filter((video) => video.category === category.key).length
      return acc
    }, {})
  }, [videos])

  const openVideo = useCallback(async (video: GymVideoRecord) => {
    const url = String(video?.video_url ?? '').trim()
    if (!url) {
      Alert.alert('Unable to open video', 'This video does not have a valid URL.')
      return
    }

    try {
      const supported = await Linking.canOpenURL(url)
      if (!supported) {
        Alert.alert('Unable to open video', 'Please check that a compatible app or browser is available.')
        return
      }

      await Linking.openURL(url)
    } catch (error) {
      console.log('Failed to open gym video URL', error)
      Alert.alert('Unable to open video', 'Please try again.')
    }
  }, [])

  const onRefresh = () => {
    void loadVideos({ isRefresh: true })
  }

  const getThumbnailSource = useCallback((video: GymVideoRecord) => {
    const thumbnailUri = getGymVideoThumbnailUri(video)
    if (!thumbnailUri) {
      return null
    }

    const thumbKey = `thumb:${video.uid}:${thumbnailUri}`
    if (failedThumbnails[thumbKey]) {
      return null
    }

    return { uri: thumbnailUri }
  }, [failedThumbnails])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => navigation.goBack()} />
        <SignOut />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.blue} />}
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
                Browse published videos from your gym for machine tutorials, workout ideas, and safety tips.
              </Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatPill}>
              <MaterialCommunityIcons name="play-box-multiple" size={16} color={AppColors.blue} />
              <Text style={styles.heroStatText}>{videos.length} published videos</Text>
            </View>
            <View style={styles.heroStatPill}>
              <MaterialCommunityIcons name="shield-check" size={16} color={AppColors.blue} />
              <Text style={styles.heroStatText}>Members and trainers only</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Text style={styles.sectionSubtitle}>Tap a category to filter the library.</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, activeCategory === 'all' && styles.filterChipActive]}
              onPress={() => setActiveCategory('all')}
            >
              <Text style={[styles.filterChipText, activeCategory === 'all' && styles.filterChipTextActive]}>
                All ({videos.length})
              </Text>
            </TouchableOpacity>

            {gymVideoCategories.map((category) => {
              const count = categoryCounts[category.key] ?? 0
              const isActive = activeCategory === category.key
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveCategory(category.key)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {category.label} ({count})
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={AppColors.blue} />
            <Text style={styles.stateText}>Loading gym videos...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load gym videos</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadVideos()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredVideos.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="youtube" size={28} color={AppColors.blue} />
            </View>
            <Text style={styles.emptyTitle}>
              {activeCategory === 'all'
                ? 'No published videos yet'
                : `No ${getGymVideoCategoryLabel(activeCategory).toLowerCase()} videos`}
            </Text>
            <Text style={styles.stateText}>
              {activeCategory === 'all'
                ? 'Check back soon for new gym content.'
                : 'Try another category or check back later for new content.'}
            </Text>
          </View>
        ) : (
          <View style={styles.videoList}>
            {filteredVideos.map((video) => {
              const categoryMeta = getGymVideoCategoryMeta(video.category)
              const thumbnailSource = getThumbnailSource(video)
              const thumbKey = `thumb:${video.uid}:${thumbnailSource?.uri ?? 'placeholder'}`

              return (
                <TouchableOpacity
                  key={String(video.uid)}
                  style={styles.videoCard}
                  activeOpacity={0.88}
                  onPress={() => openVideo(video)}
                >
                  <View style={styles.thumbnailWrap}>
                    {thumbnailSource ? (
                      <Image
                        source={thumbnailSource}
                        style={styles.thumbnail}
                        resizeMode="cover"
                        onError={() =>
                          setFailedThumbnails((prev) => ({
                            ...prev,
                            [thumbKey]: true,
                          }))
                        }
                      />
                    ) : (
                      <View style={[styles.thumbnailPlaceholder, { backgroundColor: categoryMeta.accent }]}>
                        <MaterialCommunityIcons name={categoryMeta.icon} size={30} color={AppColors.white} />
                        <Text style={styles.placeholderText}>{categoryMeta.label}</Text>
                      </View>
                    )}

                    <View style={styles.videoTypePill}>
                      <Text style={styles.videoTypeText}>{String(video.video_type ?? '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.videoBody}>
                    <View style={styles.videoHeaderRow}>
                      <Text style={styles.videoTitle} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <Feather name="external-link" size={18} color={AppColors.blue} />
                    </View>

                    <View style={styles.metaRow}>
                      <View style={[styles.categoryPill, { borderColor: categoryMeta.accent }]}>
                        <Text style={[styles.categoryPillText, { color: categoryMeta.accent }]}>
                          {categoryMeta.label}
                        </Text>
                      </View>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>{String(video.video_type ?? '').replace('_', ' ')}</Text>
                    </View>

                    {video.description ? (
                      <Text style={styles.videoDescription} numberOfLines={3}>
                        {video.description}
                      </Text>
                    ) : (
                      <Text style={styles.videoDescriptionMuted}>No description provided.</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default GymVideosScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grey,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: AppColors.grey,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroTextBlock: {
    flex: 1,
  },
  eyebrow: {
    color: AppColors.blue,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Montserrat',
  },
  title: {
    color: AppColors.primary,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 4,
    fontFamily: 'Montserrat',
  },
  subtitle: {
    color: AppColors.grey3,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontFamily: 'Montserrat',
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  heroStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: AppColors.grey,
    backgroundColor: AppColors.grey,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroStatText: {
    color: AppColors.blue,
    fontSize: 13,
    fontFamily: 'Montserrat',
  },
  filterSection: {
    marginTop: 18,
    marginBottom: 14,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Montserrat',
    color: AppColors.blue,
  },
  sectionSubtitle: {
    marginTop: 4,
    color: AppColors.grey3,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Montserrat',
  },
  filterRow: {
    paddingRight: 4,
    gap: 10,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.grey,
    backgroundColor: AppColors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: AppColors.blue,
    borderColor: AppColors.blue,
  },
  filterChipText: {
    color: AppColors.primary,
    fontSize: 13,
    fontFamily: 'Montserrat',
  },
  filterChipTextActive: {
    color: AppColors.white,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  stateText: {
    color: AppColors.grey3,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  errorCard: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  errorTitle: {
    color: AppColors.primary,
    fontSize: 18,
    fontFamily: 'Montserrat',
  },
  errorText: {
    color: AppColors.grey3,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Montserrat',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  retryBtnText: {
    color: AppColors.white,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  emptyCard: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.grey,
  },
  emptyTitle: {
    marginTop: 14,
    color: AppColors.primary,
    fontSize: 18,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  videoList: {
    gap: 14,
  },
  videoCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.grey,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  thumbnailWrap: {
    position: 'relative',
    backgroundColor: AppColors.grey,
  },
  thumbnail: {
    width: '100%',
    height: 190,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  placeholderText: {
    marginTop: 10,
    color: AppColors.white,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  videoTypePill: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  videoTypeText: {
    color: AppColors.blue,
    fontSize: 11,
    fontFamily: 'Montserrat',
  },
  videoBody: {
    padding: 16,
  },
  videoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  videoTitle: {
    flex: 1,
    color: AppColors.primary,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Montserrat',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  categoryPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: AppColors.white,
  },
  categoryPillText: {
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  metaDot: {
    color: AppColors.grey3,
    fontSize: 12,
  },
  metaText: {
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  videoDescription: {
    marginTop: 12,
    color: AppColors.primary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Montserrat',
  },
  videoDescriptionMuted: {
    marginTop: 12,
    color: AppColors.grey3,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Montserrat',
  },
})
