import { useCallback, useContext, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import { useFocusEffect } from '@react-navigation/native'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import {
  deleteGymVideo,
  fetchGymVideos,
  getGymVideoCategoryLabel,
  getGymVideoThumbnailUri,
  type GymVideoRecord,
  type GymVideoStatus,
  updateGymVideoStatus,
} from '../../utils/gymVideosApi'

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

type FilterValue = 'all' | GymVideoStatus

const filterOptions: Array<{ key: FilterValue; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'published', label: 'Published' },
]

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Unknown'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

const GymVideoManagementScreen = ({ navigation }: { navigation: any }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [videos, setVideos] = useState<GymVideoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')
  const [actionVideoUid, setActionVideoUid] = useState<number | string | null>(null)

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'
  const gymId = user?.gym_id ?? null

  const performFetch = useCallback(async () => {
    if (!gymId || !tokens?.access_token) {
      setVideos([])
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
        const failure = result as { ok: false; message: string }
        setVideos([])
        setErrorMessage(failure.message)
        setLoading(false)
        setRefreshing(false)
        return
      }

      setVideos(result.videos)
      setErrorMessage('')
      setLoading(false)
      setRefreshing(false)
    } catch {
      setVideos([])
      setErrorMessage('Unable to load gym videos right now.')
      setLoading(false)
      setRefreshing(false)
    }
  }, [gymId, setTokens, tokens?.access_token, tokens?.refresh_token, webServer])

  useFocusEffect(
    useCallback(() => {
      if (!isOwner) {
        setLoading(false)
        return undefined
      }

      setLoading(true)
      void performFetch()
      return undefined
    }, [isOwner, performFetch])
  )

  const filteredVideos = useMemo(() => {
    if (activeFilter === 'all') {
      return videos
    }

    return videos.filter((video) => String(video.status ?? '').toLowerCase() === activeFilter)
  }, [activeFilter, videos])

  const emptyStateCopy = useMemo(() => {
    if (errorMessage) {
      return null
    }

    if (videos.length === 0) {
      return {
        title: 'No videos yet',
        description: 'Add workout, equipment, or safety videos for your members and trainers.',
      }
    }

    if (activeFilter === 'draft') {
      return {
        title: 'No draft videos',
        description: 'All of your videos are currently published.',
      }
    }

    if (activeFilter === 'published') {
      return {
        title: 'No published videos',
        description: 'Publish a draft video to make it visible to members and trainers.',
      }
    }

    return {
      title: 'No matching videos',
      description: 'Try a different filter to see more videos.',
    }
  }, [activeFilter, errorMessage, videos.length])

  const onRefresh = useCallback(() => {
    if (!isOwner) {
      return
    }

    setRefreshing(true)
    void performFetch()
  }, [isOwner, performFetch])

  const handleStatusChange = useCallback(async (video: GymVideoRecord, nextStatus: GymVideoStatus) => {
    if (!gymId || !tokens?.access_token || actionVideoUid) {
      return
    }

    setActionVideoUid(video.uid ?? null)
    try {
      const result = await updateGymVideoStatus({
        webServer,
        gymId,
        videoUid: video.uid ?? '',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        setTokens,
        status: nextStatus,
      })

      if (!result.ok) {
        showMessage({
          message: 'Update failed',
          description: result.message,
          type: 'danger',
        })
        return
      }

      setVideos((current) => current.map((item) => (String(item.uid) === String(result.video.uid) ? result.video : item)))
      showMessage({
        message: nextStatus === 'published' ? 'Video published' : 'Video moved to draft',
        description: result.message || 'The gym video was updated successfully.',
        type: 'success',
      })
    } finally {
      setActionVideoUid(null)
    }
  }, [actionVideoUid, gymId, setTokens, tokens?.access_token, tokens?.refresh_token, webServer])

  const handleDelete = useCallback((video: GymVideoRecord) => {
    if (!gymId || !tokens?.access_token || actionVideoUid) {
      return
    }

    Alert.alert(
      'Delete gym video',
      `Delete "${video.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionVideoUid(video.uid ?? null)
            try {
              const result = await deleteGymVideo({
                webServer,
                gymId,
                videoUid: video.uid ?? '',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                setTokens,
              })

              if (!result.ok) {
                showMessage({
                  message: 'Delete failed',
                  description: result.message,
                  type: 'danger',
                })
                return
              }

              setVideos((current) => current.filter((item) => String(item.uid) !== String(video.uid)))
              showMessage({
                message: 'Video deleted',
                description: result.message || 'The gym video was deleted successfully.',
                type: 'success',
              })
            } finally {
              setActionVideoUid(null)
            }
          },
        },
      ]
    )
  }, [actionVideoUid, gymId, setTokens, tokens?.access_token, tokens?.refresh_token, webServer])

  const renderVideo = ({ item }: { item: GymVideoRecord }) => {
    const thumbnailUri = getGymVideoThumbnailUri(item)
    const status = String(item.status ?? '').toLowerCase() as GymVideoStatus
    const isPublished = status === 'published'
    const isBusy = String(actionVideoUid ?? '') === String(item.uid ?? '')
    const categoryLabel = getGymVideoCategoryLabel(item.category)
    const typeLabel = String(item.video_type ?? '').trim().toLowerCase() === 'youtube' ? 'YouTube' : 'External'

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.thumbnailWrap}>
            {thumbnailUri ? (
              <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} resizeMode="cover" />
            ) : (
              <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                <Feather name="video" size={24} color={AppColors.blue} />
              </View>
            )}
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={[styles.statusBadge, isPublished ? styles.publishedBadge : styles.draftBadge]}>
                <Text style={styles.statusText}>{isPublished ? 'Published' : 'Draft'}</Text>
              </View>
            </View>

            <Text style={styles.metaText}>{categoryLabel} • {typeLabel}</Text>
            <Text style={styles.metaText}>Created {formatDateTime(item.created_at)}</Text>
            <Text style={styles.metaText}>Updated {formatDateTime(item.updated_at)}</Text>

            {item.description ? (
              <Text style={styles.cardDescription} numberOfLines={3}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, isBusy && styles.disabledButton]}
            disabled={isBusy}
            onPress={() => navigation.navigate('AddEditGymVideoScreen', { videoUid: item.uid })}
          >
            <Feather name="edit-3" size={16} color={AppColors.blue} />
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isBusy && styles.disabledButton]}
            disabled={isBusy}
            onPress={() => handleStatusChange(item, isPublished ? 'draft' : 'published')}
          >
            <Feather name={isPublished ? 'eye-off' : 'eye'} size={16} color={AppColors.blue} />
            <Text style={styles.secondaryButtonText}>{isPublished ? 'Unpublish' : 'Publish'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerButton, isBusy && styles.disabledButton]}
            disabled={isBusy}
            onPress={() => handleDelete(item)}
          >
            <Feather name="trash-2" size={16} color="#fff" />
            <Text style={styles.dangerButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.accessDeniedContainer}>
          <Feather name="lock" size={34} color={AppColors.blue} />
          <Text style={styles.accessDeniedTitle}>Owner access required</Text>
          <Text style={styles.accessDeniedText}>
            Only gym owners can manage the video library.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Gym Videos</Text>
            <Text style={styles.subtitle}>Create, publish, and manage your gym&apos;s video library.</Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddEditGymVideoScreen')}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add Video</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.key
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                onPress={() => setActiveFilter(option.key)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <FlatList
          data={filteredVideos}
          keyExtractor={(item) => String(item.uid)}
          renderItem={renderVideo}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.blue} />}
          contentContainerStyle={[
            styles.listContent,
            filteredVideos.length === 0 && !loading ? styles.emptyListContent : null,
          ]}
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={AppColors.blue} />
              </View>
            ) : errorMessage ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-triangle" size={28} color="#c2410c" />
                <Text style={styles.errorTitle}>Unable to load gym videos</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={performFetch}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : emptyStateCopy ? (
              <View style={styles.emptyContainer}>
                <Feather name="video" size={30} color={AppColors.blue} />
                <Text style={styles.emptyTitle}>{emptyStateCopy.title}</Text>
                <Text style={styles.emptyText}>
                  {emptyStateCopy.description}
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  )
}

export default GymVideoManagementScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: AppColors.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: AppColors.primary,
    opacity: 0.75,
    maxWidth: 260,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipInactive: {
    backgroundColor: '#f8fafc',
    borderColor: '#d1d5db',
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
    color: '#fff',
  },
  listContent: {
    paddingBottom: 24,
    gap: 14,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.primary,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.primary,
    textAlign: 'center',
    opacity: 0.75,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.primary,
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    color: AppColors.primary,
    opacity: 0.75,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 14,
  },
  thumbnailWrap: {
    width: 96,
  },
  thumbnail: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
  },
  placeholderThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  publishedBadge: {
    backgroundColor: '#dcfce7',
  },
  draftBadge: {
    backgroundColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  metaText: {
    marginTop: 6,
    fontSize: 13,
    color: AppColors.primary,
    opacity: 0.7,
  },
  cardDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.blue,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: AppColors.blue,
    fontWeight: '700',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  accessDeniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  accessDeniedTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.primary,
  },
  accessDeniedText: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    color: AppColors.primary,
    opacity: 0.75,
  },
})
