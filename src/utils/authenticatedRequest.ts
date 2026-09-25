type RefreshTokens = {
  access_token?: string | null
  refresh_token?: string | null
}

type SetTokens = (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void

type PerformAuthenticatedRequestOptions = {
  endpoint: string
  init?: RequestInit
  accessToken?: string | null
  refreshToken?: string | null
  webServer: string
  setTokens: SetTokens
}

type RefreshAccessTokenOptions = {
  refreshToken?: string | null
  webServer: string
  setTokens: SetTokens
}

const refreshTokenRequestHeaders = {
  'Content-Type': 'application/json',
}

const tokenRefreshMessagePattern = /\b(?:token\s+has\s+expired|expired\s+(?:access\s+)?token|invalid\s+(?:access\s+)?token|token\s+is\s+invalid|jwt\s+expired|access\s+token\s+expired|authentication\s+token\s+expired)\b/i

let refreshAccessTokenPromise: Promise<string | null> | null = null

const extractResponseText = async (response: Response): Promise<string> => {
  try {
    return await response.clone().text()
  } catch {
    return ''
  }
}

const extractMessageCandidates = (responseText: string): string[] => {
  const trimmed = String(responseText ?? '').trim()
  if (!trimmed) {
    return []
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (typeof parsed === 'string') {
      return [parsed]
    }

    if (parsed && typeof parsed === 'object') {
      const payload = parsed as Record<string, unknown>
      const candidates: string[] = []

      if (typeof payload.message === 'string') {
        candidates.push(payload.message)
      }

      if (typeof payload.error === 'string') {
        candidates.push(payload.error)
      }

      if (Array.isArray(payload.errors)) {
        for (const error of payload.errors) {
          if (typeof error === 'string') {
            candidates.push(error)
          }
        }
      }

      if (candidates.length > 0) {
        return candidates
      }
    }
  } catch {
    // Fall through to the raw text below.
  }

  return [trimmed]
}

export const shouldRefreshAuthResponse = async (response: Response): Promise<boolean> => {
  if (response.status === 401 || response.status === 403) {
    return true
  }

  if (response.status !== 400) {
    return false
  }

  const responseText = await extractResponseText(response)
  return extractMessageCandidates(responseText).some((candidate) => tokenRefreshMessagePattern.test(candidate))
}

export const refreshAccessToken = async ({
  refreshToken,
  webServer,
  setTokens,
}: RefreshAccessTokenOptions): Promise<string | null> => {
  if (!refreshToken) {
    return null
  }

  if (refreshAccessTokenPromise) {
    return refreshAccessTokenPromise
  }

  refreshAccessTokenPromise = (async () => {
    const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
      method: 'POST',
      headers: refreshTokenRequestHeaders,
      body: JSON.stringify({
        token: refreshToken,
      }),
    })

    if (refreshResponse.status !== 200) {
      return null
    }

    const refreshObj = (await refreshResponse.json()) as RefreshTokens | null
    if (!refreshObj?.access_token || !refreshObj?.refresh_token) {
      return null
    }

    setTokens((prev) => ({
      ...(prev ?? {}),
      access_token: refreshObj.access_token,
      refresh_token: refreshObj.refresh_token,
    }))

    return refreshObj.access_token
  })().finally(() => {
    refreshAccessTokenPromise = null
  })

  return refreshAccessTokenPromise
}

export const performAuthenticatedRequest = async ({
  endpoint,
  init = {},
  accessToken,
  refreshToken,
  webServer,
  setTokens,
}: PerformAuthenticatedRequestOptions): Promise<Response | null> => {
  if (!accessToken) {
    return null
  }

  const requestWithToken = async (token: string) => {
    const headers = new Headers(init.headers ?? undefined)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    headers.set('Authorization', `Bearer ${token}`)

    return fetch(endpoint, {
      ...init,
      headers,
    })
  }

  let response = await requestWithToken(accessToken)

  if (await shouldRefreshAuthResponse(response)) {
    const refreshedAccessToken = await refreshAccessToken({
      refreshToken,
      webServer,
      setTokens,
    })

    if (!refreshedAccessToken) {
      return response
    }

    response = await requestWithToken(refreshedAccessToken)
  }

  return response
}
