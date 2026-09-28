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

export const getGymVideoCategoryMeta = (category?: string | null) => {
  return gymVideoCategories.find((item) => item.key === category) ?? gymVideoCategories[gymVideoCategories.length - 1]
}

export const getGymVideoCategoryLabel = (category?: string | null) => {
  return getGymVideoCategoryMeta(category).label
}

export const fetchPublishedGymVideos = async ({
  webServer,
  gymId,
  accessToken,
  refreshToken,
  setTokens,
}: FetchPublishedGymVideosParams): Promise<FetchGymVideosResult> => {
  const normalizedGymId = String(gymId ?? '').trim()
  if (!normalizedGymId || !accessToken) {
    return { ok: false, message: 'Please sign in again to view gym videos.' }
  }

  const response = await performAuthenticatedRequest({
    endpoint: `${webServer}/api/v1/gyms/${normalizedGymId}/videos`,
    accessToken,
    refreshToken,
    webServer,
    setTokens,
  })

  if (!response) {
    return { ok: false, message: 'Please sign in again to view gym videos.' }
  }

  const responseText = await response.text()
  let parsed: { status?: string; data?: GymVideoRecord[]; message?: string; error?: string } = {}

  if (responseText) {
    try {
      parsed = JSON.parse(responseText)
    } catch {
      parsed = { message: responseText }
    }
  }

  if (response.status !== 200) {
    return {
      ok: false,
      message: parsed.message || parsed.error || 'Unable to load gym videos.',
    }
  }

  return {
    ok: true,
    videos: Array.isArray(parsed.data) ? parsed.data : [],
  }
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
