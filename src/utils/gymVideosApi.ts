import { performAuthenticatedRequest } from './authenticatedRequest'

export type GymVideoCategory =
  | 'workout_suggestions'
  | 'proper_machine_usage'
  | 'safety_precautions'
  | 'warm_ups_and_recovery'
  | 'other'

export type GymVideoRecord = {
  uid: number
  gym_id: number
  title: string
  description: string | null
  category: GymVideoCategory
  video_type: 'youtube' | 'external' | string
  video_url: string
  thumbnail_url: string | null
  status: 'draft' | 'published' | string
  created_by: number
  created_at: string | null
  updated_at: string | null
}

export type GymVideoStatus = 'draft' | 'published'
export type GymVideoType = 'youtube' | 'external'

type RefreshTokens = {
  access_token?: string | null
  refresh_token?: string | null
}

type SetTokens = (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void

type FetchPublishedGymVideosParams = {
  webServer: string
  gymId: number | string
  accessToken?: string | null
  refreshToken?: string | null
  setTokens: SetTokens
}

type FetchGymVideosResult =
  | { ok: true; videos: GymVideoRecord[] }
  | { ok: false; message: string }

type GymVideoMutationResult =
  | { ok: true; video: GymVideoRecord; message?: string }
  | { ok: false; message: string; errors?: string[] }

type GymVideoListResponse = {
  status?: string
  data?: GymVideoRecord[]
  message?: string
  error?: string
  errors?: string[]
}

type GymVideoDetailResponse = {
  status?: string
  video?: GymVideoRecord
  message?: string
  error?: string
  errors?: string[]
}

export const gymVideoCategories: Array<{
  key: GymVideoCategory
  label: string
  accent: string
  icon: string
}> = [
  {
    key: 'workout_suggestions',
    label: 'Workout Suggestions',
    accent: '#DB2777',
    icon: 'dumbbell',
  },
  {
    key: 'proper_machine_usage',
    label: 'Proper Machine Usage',
    accent: '#2563EB',
    icon: 'weight-lifter',
  },
  {
    key: 'safety_precautions',
    label: 'Safety Precautions',
    accent: '#0F766E',
    icon: 'shield-check',
  },
  {
    key: 'warm_ups_and_recovery',
    label: 'Warm-ups & Recovery',
    accent: '#7C3AED',
    icon: 'run',
  },
  {
    key: 'other',
    label: 'Other',
    accent: '#64748B',
    icon: 'dots-horizontal',
  },
]

export const gymVideoTypeOptions: Array<{ key: GymVideoType; value: string }> = [
  { key: 'youtube', value: 'YouTube' },
  { key: 'external', value: 'External HTTPS URL' },
]

export const gymVideoStatusOptions: Array<{ key: GymVideoStatus; value: string }> = [
  { key: 'draft', value: 'Draft' },
  { key: 'published', value: 'Published' },
]

export const getGymVideoCategoryMeta = (category?: string | null) => {
  return gymVideoCategories.find((item) => item.key === category) ?? gymVideoCategories[gymVideoCategories.length - 1]
}

export const getGymVideoCategoryLabel = (category?: string | null) => {
  return getGymVideoCategoryMeta(category).label
}

export const normalizeGymVideoCategory = (value?: string | null): GymVideoCategory => {
  return gymVideoCategories.some((item) => item.key === value) ? (value as GymVideoCategory) : 'other'
}

export const normalizeGymVideoType = (value?: string | null): GymVideoType => {
  return value === 'external' ? 'external' : 'youtube'
}

export const normalizeGymVideoStatus = (value?: string | null): GymVideoStatus => {
  return value === 'published' ? 'published' : 'draft'
}

const requestGymVideoEndpoint = async ({
  webServer,
  gymId,
  accessToken,
  refreshToken,
  setTokens,
  path,
  method = 'GET',
  body,
}: FetchPublishedGymVideosParams & { path: string; method?: string; body?: Record<string, unknown> }): Promise<Response | null> => {
  const normalizedGymId = String(gymId ?? '').trim()
  if (!normalizedGymId || !accessToken) {
    return null
  }

  return performAuthenticatedRequest({
    endpoint: `${webServer}/api/v1/gyms/${normalizedGymId}${path}`,
    init: {
      method,
      body: body ? JSON.stringify(body) : undefined,
    },
    accessToken,
    refreshToken,
    webServer,
    setTokens,
  })
}

const parseResponse = async <T extends GymVideoListResponse | GymVideoDetailResponse>(response: Response): Promise<T> => {
  const responseText = await response.text()

  if (!responseText) {
    return {} as T
  }

  try {
    return JSON.parse(responseText) as T
  } catch {
    return { message: responseText } as T
  }
}

const getResponseMessage = (parsed: { message?: string; error?: string; errors?: string[] }) => {
  if (parsed.message) {
    return parsed.message
  }

  if (parsed.error) {
    return parsed.error
  }

  if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
    return parsed.errors[0]
  }

  return ''
}

export const fetchGymVideos = async ({
  webServer,
  gymId,
  accessToken,
  refreshToken,
  setTokens,
}: FetchPublishedGymVideosParams): Promise<FetchGymVideosResult> => {
  const response = await requestGymVideoEndpoint({
    webServer,
    gymId,
    accessToken,
    refreshToken,
    setTokens,
    path: '/videos',
  })

  if (!response) {
    return { ok: false, message: 'Please sign in again to view gym videos.' }
  }

  const parsed = await parseResponse<GymVideoListResponse>(response)

  if (response.status !== 200) {
    return {
      ok: false,
      message: getResponseMessage(parsed) || 'Unable to load gym videos.',
    }
  }

  return {
    ok: true,
    videos: Array.isArray(parsed.data) ? parsed.data : [],
  }
}

export const fetchPublishedGymVideos = fetchGymVideos

export const fetchGymVideoByUid = async ({
  webServer,
  gymId,
  videoUid,
  accessToken,
  refreshToken,
  setTokens,
}: FetchPublishedGymVideosParams & { videoUid: number | string }): Promise<{ ok: true; video: GymVideoRecord } | { ok: false; message: string }> => {
  const response = await requestGymVideoEndpoint({
    webServer,
    gymId,
    accessToken,
    refreshToken,
    setTokens,
    path: `/videos/${String(videoUid).trim()}`,
  })

  if (!response) {
    return { ok: false, message: 'Please sign in again to view gym videos.' }
  }

  const parsed = await parseResponse<GymVideoDetailResponse>(response)

  if (response.status !== 200) {
    return {
      ok: false,
      message: getResponseMessage(parsed) || 'Unable to load gym video.',
    }
  }

  if (!parsed.video) {
    return { ok: false, message: 'Unable to load gym video.' }
  }

  return { ok: true, video: parsed.video }
}

export const createGymVideo = async ({
  webServer,
  gymId,
  accessToken,
  refreshToken,
  setTokens,
  payload,
}: FetchPublishedGymVideosParams & { payload: Record<string, unknown> }): Promise<GymVideoMutationResult> => {
  const response = await requestGymVideoEndpoint({
    webServer,
    gymId,
    accessToken,
    refreshToken,
    setTokens,
    path: '/videos',
    method: 'POST',
    body: payload,
  })

  if (!response) {
    return { ok: false, message: 'Please sign in again to create gym videos.' }
  }

  const parsed = await parseResponse<GymVideoDetailResponse>(response)

  if (response.status !== 201) {
    return {
      ok: false,
      message: getResponseMessage(parsed) || 'Unable to create gym video.',
      errors: parsed.errors,
    }
  }

  if (!parsed.video) {
    return { ok: false, message: 'Unable to create gym video.' }
  }

  return { ok: true, video: parsed.video, message: parsed.message }
}

export const updateGymVideo = async ({
  webServer,
  gymId,
  videoUid,
  accessToken,
  refreshToken,
  setTokens,
  payload,
}: FetchPublishedGymVideosParams & { videoUid: number | string; payload: Record<string, unknown> }): Promise<GymVideoMutationResult> => {
  const response = await requestGymVideoEndpoint({
    webServer,
    gymId,
    accessToken,
    refreshToken,
    setTokens,
    path: `/videos/${String(videoUid).trim()}`,
    method: 'PUT',
    body: payload,
  })

  if (!response) {
    return { ok: false, message: 'Please sign in again to update gym videos.' }
  }

  const parsed = await parseResponse<GymVideoDetailResponse>(response)

  if (response.status !== 200) {
    return {
      ok: false,
      message: getResponseMessage(parsed) || 'Unable to update gym video.',
      errors: parsed.errors,
    }
  }

  if (!parsed.video) {
    return { ok: false, message: 'Unable to update gym video.' }
  }

  return { ok: true, video: parsed.video, message: parsed.message }
}

export const updateGymVideoStatus = async ({
  webServer,
  gymId,
  videoUid,
  accessToken,
  refreshToken,
  setTokens,
  status,
}: FetchPublishedGymVideosParams & { videoUid: number | string; status: GymVideoStatus }): Promise<GymVideoMutationResult> => {
  const response = await requestGymVideoEndpoint({
    webServer,
    gymId,
    accessToken,
    refreshToken,
    setTokens,
    path: `/videos/${String(videoUid).trim()}/status`,
    method: 'PATCH',
    body: { status },
  })

  if (!response) {
    return { ok: false, message: 'Please sign in again to update gym videos.' }
  }

  const parsed = await parseResponse<GymVideoDetailResponse>(response)

  if (response.status !== 200) {
    return {
      ok: false,
      message: getResponseMessage(parsed) || 'Unable to update gym video status.',
      errors: parsed.errors,
    }
  }

  if (!parsed.video) {
    return { ok: false, message: 'Unable to update gym video status.' }
  }

  return { ok: true, video: parsed.video, message: parsed.message }
}

export const deleteGymVideo = async ({
  webServer,
  gymId,
  videoUid,
  accessToken,
  refreshToken,
  setTokens,
}: FetchPublishedGymVideosParams & { videoUid: number | string }): Promise<{ ok: true; message?: string } | { ok: false; message: string }> => {
  const response = await requestGymVideoEndpoint({
    webServer,
    gymId,
    accessToken,
    refreshToken,
    setTokens,
    path: `/videos/${String(videoUid).trim()}`,
    method: 'DELETE',
  })

  if (!response) {
    return { ok: false, message: 'Please sign in again to delete gym videos.' }
  }

  const parsed = await parseResponse<GymVideoDetailResponse>(response)

  if (response.status !== 200) {
    return {
      ok: false,
      message: getResponseMessage(parsed) || 'Unable to delete gym video.',
    }
  }

  return { ok: true, message: parsed.message }
}

const extractYouTubeVideoId = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url)
    const host = parsedUrl.hostname.toLowerCase()

    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
      const candidate = parsedUrl.pathname.split('/').filter(Boolean)[0] ?? ''
      return /^[a-zA-Z0-9_-]{6,}$/.test(candidate) ? candidate : null
    }

    if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com')) {
      const searchVideoId = parsedUrl.searchParams.get('v')
      if (searchVideoId && /^[a-zA-Z0-9_-]{6,}$/.test(searchVideoId)) {
        return searchVideoId
      }

      const pathParts = parsedUrl.pathname.split('/').filter(Boolean)
      const pathCandidateIndex = pathParts.findIndex((part) => ['shorts', 'embed', 'live'].includes(part))
      if (pathCandidateIndex >= 0 && pathParts[pathCandidateIndex + 1] && /^[a-zA-Z0-9_-]{6,}$/.test(pathParts[pathCandidateIndex + 1])) {
        return pathParts[pathCandidateIndex + 1]
      }
    }
  } catch {
    return null
  }

  return null
}

const isValidHttpsUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

export const getGymVideoThumbnailUri = (video: GymVideoRecord): string | null => {
  const thumbnailUrl = String(video?.thumbnail_url ?? '').trim()
  if (thumbnailUrl && isValidHttpsUrl(thumbnailUrl)) {
    return thumbnailUrl
  }

  if (String(video?.video_type ?? '').toLowerCase() !== 'youtube') {
    return null
  }

  const youtubeId = extractYouTubeVideoId(String(video?.video_url ?? '').trim())
  if (!youtubeId) {
    return null
  }

  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
}

export const isValidGymVideoHttpsUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

export const isValidGymVideoUrl = (url: string, videoType?: string) => {
  if (!isValidGymVideoHttpsUrl(url)) {
    return false
  }

  const normalizedType = String(videoType ?? '').trim().toLowerCase()
  if (normalizedType === 'youtube') {
    return extractYouTubeVideoId(url) !== null
  }

  if (normalizedType === 'external') {
    return true
  }

  return false
}

export const extractGymVideoYouTubeId = extractYouTubeVideoId
