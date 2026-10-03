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
import { useFocusEffect } from '@react-navigation/native'
import { showMessage } from 'react-native-flash-message'
import SignOut from '../../components/utils/SignOut'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import {
  createGymVideo,
  extractGymVideoYouTubeId,
  fetchGymVideos,
  getGymVideoCategoryMeta,
  gymVideoCategories,
  type GymVideoCategory,
  type GymVideoStatus,
} from '../../utils/gymVideosApi'
import {
  getSuggestedVideoThumbnail,
  getSuggestedVideoUrl,
  suggestedGymVideos,
  type SuggestedGymVideo,
} from '../../data/suggestedGymVideos'

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
  user?: {
    gym_id?: number | string
    role?: string | null
  } | null
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type CategoryFilter = 'all' | GymVideoCategory

const statusOptions: Array<{ key: GymVideoStatus; label: string; hint: string }> = [
  { key: 'draft', label: 'Save as draft', hint: 'Hidden from members until you publish.' },
  { key: 'published', label: 'Publish now', hint: 'Visible to members immediately.' },
]

const SuggestedGymVideosScreen = ({ navigation }: { navigation: any }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  const [addStatus, setAddStatus] = useState<GymVideoStatus>('draft')
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [failedThumbnails, setFailedThumbnails] = useState<Record<string, boolean>>({})

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'
  const gymId = user?.gym_id ?? null
  const isBusy = isBulkAdding || addingIds.size > 0

  const loadExisting = useCallback(
    async (isRefresh = false) => {
      if (!gymId || !tokens?.access_token) {
        setErrorMessage('Please sign in again to manage gym videos.')
        setLoading(false)
        setRefreshing(false)
        return
      }

      try {
        const result = await fetchGymVideos({
          webServer,
          gymId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          setTokens,
        })

        if (!result.ok) {
          setErrorMessage((result as { ok: false; message: string }).message)
          return
        }

        const ids = result.videos
          .map((video) => extractGymVideoYouTubeId(String(video.video_url ?? '')))
          .filter((id): id is string => Boolean(id))
        setExistingIds(new Set(ids))
        setErrorMessage('')
      } catch {
        setErrorMessage('Unable to check your current video library.')
      } finally {
        if (!isRefresh) {
          setLoading(false)
        }
        setRefreshing(false)
      }
    },
    [gymId, setTokens, tokens?.access_token, tokens?.refresh_token, webServer],
  )

  useFocusEffect(
    useCallback(() => {
      if (!isOwner) {
        setLoading(false)
        return undefined
      }

      void loadExisting()
      return undefined
    }, [isOwner, loadExisting]),
  )

  const visibleVideos = useMemo(
    () =>
      activeCategory === 'all'
        ? suggestedGymVideos
        : suggestedGymVideos.filter((video) => video.category === activeCategory),
    [activeCategory],
  )

  const remainingInView = useMemo(
    () => visibleVideos.filter((video) => !existingIds.has(video.youtubeId)),
    [existingIds, visibleVideos],
  )

  const addedCount = useMemo(
    () => suggestedGymVideos.filter((video) => existingIds.has(video.youtubeId)).length,
    [existingIds],
  )

  const addVideos = useCallback(
    async (videos: SuggestedGymVideo[]) => {
      if (!gymId || !tokens?.access_token || videos.length === 0) {
        return
      }

      let addedNow = 0
      const failures: string[] = []

      for (const video of videos) {
        setAddingIds((current) => new Set(current).add(video.youtubeId))

        try {
          const result = await createGymVideo({
            webServer,
            gymId,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            setTokens,
            payload: {
              title: video.title,
              description: `${video.description} Credit: ${video.source}.`,
              category: video.category,
              video_type: 'youtube',
              video_url: getSuggestedVideoUrl(video),
              status: addStatus,
            },
          })

          if (result.ok) {
            addedNow += 1
            setExistingIds((current) => new Set(current).add(video.youtubeId))
          } else {
            const failure = result as { ok: false; message: string }
            failures.push(failure.message)

            // Retrying the rest would only repeat the same sign-in failure.
            if (/sign in/i.test(failure.message)) {
              break
            }
          }
        } catch {
          failures.push('Network error')
        } finally {
          setAddingIds((current) => {
            const next = new Set(current)
            next.delete(video.youtubeId)
            return next
          })
        }
      }

      if (failures.length === 0) {
        showMessage({
          message: addedNow === 1 ? 'Video added' : `${addedNow} videos added`,
          description:
            addStatus === 'draft'
              ? 'Saved as drafts. Publish them from Manage Videos when you are ready.'
              : 'They are now visible to your members.',
          type: 'success',
        })
      } else {
        showMessage({
          message: addedNow > 0 ? `${addedNow} added, ${failures.length} failed` : 'Could not add videos',
          description: failures[0],
          type: 'danger',
        })
      }
    },
    [addStatus, gymId, setTokens, tokens?.access_token, tokens?.refresh_token, webServer],
  )

  const handleAddAll = useCallback(() => {
    const count = remainingInView.length
    if (count === 0 || isBusy) {
      return
    }

    const where = activeCategory === 'all' ? '' : ` in ${getGymVideoCategoryMeta(activeCategory).label}`
    Alert.alert(
      `Add ${count} video${count === 1 ? '' : 's'}${where}?`,
      addStatus === 'draft'
        ? 'They will be saved as drafts, so members will not see them until you publish.'
        : 'They will be published right away and visible to all members.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: addStatus === 'draft' ? 'Add as drafts' : 'Add and publish',
          onPress: async () => {
            setIsBulkAdding(true)
            try {
              await addVideos(remainingInView)
            } finally {
              setIsBulkAdding(false)
            }
          },
        },
      ],
    )
  }, [activeCategory, addStatus, addVideos, isBusy, remainingInView])

  const handleAddOne = useCallback(
    async (video: SuggestedGymVideo) => {
      if (isBusy) {
        return
      }

      await addVideos([video])
    },
    [addVideos, isBusy],
  )

  const previewVideo = useCallback(async (video: SuggestedGymVideo) => {
    try {
      await Linking.openURL(getSuggestedVideoUrl(video))
    } catch {
      Alert.alert('Unable to open video', 'Please try again.')
    }
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    void loadExisting(true)
  }

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Feather name="lock" size={34} color={AppColors.blue} />
          <Text style={styles.accessDeniedTitle}>Owner access required</Text>
          <Text style={styles.accessDeniedText}>Only gym owners can add videos to the library.</Text>
        </View>
      </SafeAreaView>
    )
  }

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
              <MaterialCommunityIcons name="playlist-plus" size={26} color={AppColors.white} />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.eyebrow}>Starter Videos</Text>
              <Text style={styles.title}>Suggested for your members</Text>
              <Text style={styles.subtitle}>
                Beginner-friendly workouts, machine tutorials, safety tips, and recovery routines from trusted
                trainers and health organizations. Add the ones you like to your library.
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(addedCount / Math.max(suggestedGymVideos.length, 1)) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {addedCount} of {suggestedGymVideos.length} added
            </Text>
          </View>

          <Text style={styles.sectionLabel}>When adding</Text>
          <View style={styles.segmentRow}>
            {statusOptions.map((option) => {
              const active = addStatus === option.key
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setAddStatus(option.key)}
                  disabled={isBusy}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <Text style={styles.segmentHint}>{statusOptions.find((option) => option.key === addStatus)?.hint}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'all' && styles.filterChipActive]}
            onPress={() => setActiveCategory('all')}
          >
            <Text style={[styles.filterChipText, activeCategory === 'all' && styles.filterChipTextActive]}>
              All ({suggestedGymVideos.length})
            </Text>
          </TouchableOpacity>
          {gymVideoCategories
            .filter((category) => suggestedGymVideos.some((video) => video.category === category.key))
            .map((category) => {
              const active = activeCategory === category.key
              const total = suggestedGymVideos.filter((video) => video.category === category.key).length
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setActiveCategory(category.key)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {category.label} ({total})
                  </Text>
                </TouchableOpacity>
              )
            })}
        </ScrollView>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={AppColors.blue} />
            <Text style={styles.stateText}>Checking your library...</Text>
          </View>
        ) : (
          <>
            {errorMessage ? (
              <View style={styles.warningCard}>
                <Feather name="alert-triangle" size={18} color="#c2410c" />
                <Text style={styles.warningText}>
                  {errorMessage} Videos you already have may not be marked as added.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.addAllButton, (remainingInView.length === 0 || isBusy) && styles.buttonDisabled]}
              onPress={handleAddAll}
              disabled={remainingInView.length === 0 || isBusy}
              activeOpacity={0.88}
            >
              {isBulkAdding ? (
                <ActivityIndicator color={AppColors.white} size="small" />
              ) : (
                <Feather name="plus-circle" size={18} color={AppColors.white} />
              )}
              <Text style={styles.addAllText}>
                {remainingInView.length === 0
                  ? 'Everything here is already in your library'
                  : activeCategory === 'all'
                    ? `Add all ${remainingInView.length} remaining`
                    : `Add ${remainingInView.length} remaining in this category`}
              </Text>
            </TouchableOpacity>

            <View style={styles.videoList}>
              {visibleVideos.map((video) => {
                const categoryMeta = getGymVideoCategoryMeta(video.category)
                const alreadyAdded = existingIds.has(video.youtubeId)
                const adding = addingIds.has(video.youtubeId)
                const thumbnailFailed = failedThumbnails[video.youtubeId]

                return (
                  <View key={video.youtubeId} style={styles.videoCard}>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => previewVideo(video)}>
                      <View style={styles.thumbnailWrap}>
                        {thumbnailFailed ? (
                          <View style={[styles.thumbnail, { backgroundColor: categoryMeta.accent }, styles.thumbnailFallback]}>
                            <MaterialCommunityIcons name={categoryMeta.icon as any} size={34} color={AppColors.white} />
                          </View>
                        ) : (
                          <Image
                            source={{ uri: getSuggestedVideoThumbnail(video) }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                            onError={() => setFailedThumbnails((prev) => ({ ...prev, [video.youtubeId]: true }))}
                          />
                        )}
                        <View style={styles.playBadge}>
                          <Feather name="play" size={16} color={AppColors.white} />
                        </View>
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationText}>{video.duration}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.videoBody}>
                      <Text style={styles.videoTitle} numberOfLines={2}>
                        {video.title}
                      </Text>

                      <View style={styles.metaRow}>
                        <View style={[styles.categoryPill, { borderColor: categoryMeta.accent }]}>
                          <Text style={[styles.categoryPillText, { color: categoryMeta.accent }]}>
                            {categoryMeta.label}
                          </Text>
                        </View>
                        <Text style={styles.sourceText} numberOfLines={1}>
                          {video.source}
                        </Text>
                      </View>

                      <Text style={styles.videoDescription}>{video.description}</Text>

                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.previewButton} onPress={() => previewVideo(video)}>
                          <Feather name="external-link" size={15} color={AppColors.blue} />
                          <Text style={styles.previewButtonText}>Preview</Text>
                        </TouchableOpacity>

                        {alreadyAdded ? (
                          <View style={styles.addedBadge}>
                            <Feather name="check" size={15} color="#166534" />
                            <Text style={styles.addedBadgeText}>In your library</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[styles.addButton, isBusy && styles.buttonDisabled]}
                            onPress={() => handleAddOne(video)}
                            disabled={isBusy}
                            activeOpacity={0.88}
                          >
                            {adding ? (
                              <ActivityIndicator color={AppColors.white} size="small" />
                            ) : (
                              <Feather name="plus" size={15} color={AppColors.white} />
                            )}
                            <Text style={styles.addButtonText}>{adding ? 'Adding...' : 'Add'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>

            <TouchableOpacity
              style={styles.manageLink}
              onPress={() => navigation.navigate('GymVideoManagementScreen')}
              activeOpacity={0.85}
            >
              <Feather name="video" size={16} color={AppColors.blue} />
              <Text style={styles.manageLinkText}>Go to Manage Videos</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default SuggestedGymVideosScreen

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
    paddingBottom: 32,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.primary,
  },
  accessDeniedText: {
    fontSize: 14,
    color: AppColors.primary,
    opacity: 0.75,
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: AppColors.white,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.primary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.primary,
    opacity: 0.72,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.grey,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: AppColors.blue,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.grey,
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentActive: {
    backgroundColor: AppColors.blue,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.primary,
  },
  segmentTextActive: {
    color: AppColors.white,
  },
  segmentHint: {
    marginTop: 8,
    fontSize: 12,
    color: AppColors.primary,
    opacity: 0.65,
  },
  filterScroll: {
    marginTop: 16,
  },
  filterRow: {
    gap: 10,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: AppColors.white,
  },
  filterChipActive: {
    backgroundColor: AppColors.blue,
    borderColor: AppColors.blue,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.primary,
  },
  filterChipTextActive: {
    color: AppColors.white,
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    color: AppColors.primary,
    opacity: 0.7,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#9a3412',
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: AppColors.blue,
  },
  addAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.white,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  videoList: {
    marginTop: 16,
    gap: 16,
  },
  videoCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#e5e7eb',
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  durationText: {
    color: AppColors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  videoBody: {
    padding: 14,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  categoryPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sourceText: {
    flexShrink: 1,
    fontSize: 12,
    color: AppColors.primary,
    opacity: 0.65,
  },
  videoDescription: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.primary,
    opacity: 0.8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: AppColors.grey,
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.blue,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: AppColors.blue,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.white,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
  },
  addedBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  manageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
  },
  manageLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.blue,
  },
})
