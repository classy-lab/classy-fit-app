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

type TokenSnapshot = {
  access_token: string | null
  refresh_token: string | null
}

const refreshTokenRequestHeaders = {
  'Content-Type': 'application/json',
}

const tokenRefreshMessagePattern = /\b(?:token\s+has\s+expired|expired\s+(?:access\s+)?token|invalid\s+(?:access\s+)?token|token\s+is\s+invalid|jwt\s+expired|access\s+token\s+expired|authentication\s+token\s+expired)\b/i
const authRequestLogPrefix = '[authenticatedRequest]'

let refreshAccessTokenPromise: Promise<RefreshTokens | null> | null = null
let latestTokenSnapshot: TokenSnapshot | null = null

const normalizeToken = (value?: string | null) => String(value ?? '').trim()

const rememberLatestTokens = (tokens: RefreshTokens | null) => {
  if (!tokens?.access_token || !tokens?.refresh_token) {
    return
  }

  latestTokenSnapshot = {
    access_token: normalizeToken(tokens.access_token),
    refresh_token: normalizeToken(tokens.refresh_token),
  }
}

const resolveEffectiveTokens = (accessToken?: string | null, refreshToken?: string | null) => {
  const providedAccessToken = normalizeToken(accessToken)
  const providedRefreshToken = normalizeToken(refreshToken)
  const snapshotAccessToken = normalizeToken(latestTokenSnapshot?.access_token)
  const snapshotRefreshToken = normalizeToken(latestTokenSnapshot?.refresh_token)

  if (snapshotAccessToken && snapshotRefreshToken) {
    return {
      accessToken: snapshotAccessToken,
      refreshToken: snapshotRefreshToken,
    }
  }

  return {
    accessToken: providedAccessToken,
    refreshToken: providedRefreshToken,
  }
}

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

const classifyResponseBody = (responseText: string): string => {
  const candidates = extractMessageCandidates(responseText)
  if (candidates.length === 0) {
    return 'empty'
  }

  if (candidates.some((candidate) => tokenRefreshMessagePattern.test(candidate))) {
    return 'auth-token-expired'
  }

  return 'non-auth-error'
}

export const shouldRefreshAuthResponse = async (response: Response): Promise<boolean> => {
  if (!response || response.ok) {
    return false
  }

  if (response.status !== 400 && response.status !== 401 && response.status !== 403) {
    return false
  }

  const responseText = await extractResponseText(response)
  const candidates = extractMessageCandidates(responseText)
  const hasTokenRefreshMessage = candidates.some((candidate) => tokenRefreshMessagePattern.test(candidate))

  if (hasTokenRefreshMessage) {
    return true
  }

  return response.status === 401 && candidates.length === 0
}

export const refreshAccessToken = async ({
  refreshToken,
  webServer,
  setTokens,
}: RefreshAccessTokenOptions): Promise<string | null> => {
  const { refreshToken: effectiveRefreshToken } = resolveEffectiveTokens(undefined, refreshToken)
  console.log(`${authRequestLogPrefix} refresh requested`, {
    hasRefreshToken: Boolean(effectiveRefreshToken),
    hasQueuedRefresh: Boolean(refreshAccessTokenPromise),
  })
  if (!effectiveRefreshToken) {
    console.log(`${authRequestLogPrefix} refresh aborted`, {
      reason: 'missing-refresh-token',
    })
    return null
  }

  if (refreshAccessTokenPromise) {
    console.log(`${authRequestLogPrefix} reusing in-flight refresh`)
    const refreshedTokens = await refreshAccessTokenPromise
    console.log(`${authRequestLogPrefix} reused refresh result`, {
      hasNewAccessToken: Boolean(refreshedTokens?.access_token),
      hasNewRefreshToken: Boolean(refreshedTokens?.refresh_token),
    })
    return refreshedTokens?.access_token ?? null
  }

  console.log(`${authRequestLogPrefix} starting token refresh`)
  refreshAccessTokenPromise = (async (): Promise<RefreshTokens | null> => {
    console.log(`${authRequestLogPrefix} calling refresh endpoint`, {
      hasRefreshToken: Boolean(effectiveRefreshToken),
    })
    const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
      method: 'POST',
      headers: refreshTokenRequestHeaders,
      body: JSON.stringify({
        token: effectiveRefreshToken,
      }),
    })

    console.log(`${authRequestLogPrefix} refresh endpoint responded`, {
      status: refreshResponse.status,
      ok: refreshResponse.ok,
    })

    if (!refreshResponse.ok) {
      console.log(`${authRequestLogPrefix} refresh failed`, {
        status: refreshResponse.status,
        ok: refreshResponse.ok,
        reason: 'non-2xx refresh response',
      })
      return null
    }

    const refreshObj = (await refreshResponse.json()) as RefreshTokens | null
    if (!refreshObj?.access_token || !refreshObj?.refresh_token) {
      console.log(`${authRequestLogPrefix} refresh failed`, {
        status: refreshResponse.status,
        ok: refreshResponse.ok,
        reason: 'missing refreshed token pair',
        hasNewAccessToken: Boolean(refreshObj?.access_token),
        hasNewRefreshToken: Boolean(refreshObj?.refresh_token),
      })
      return null
    }

    const nextTokens: RefreshTokens = {
      access_token: refreshObj.access_token,
      refresh_token: refreshObj.refresh_token,
    }

    rememberLatestTokens(nextTokens)
    setTokens((prev) => ({
      ...(prev ?? {}),
      access_token: nextTokens.access_token,
      refresh_token: nextTokens.refresh_token,
    }))

    console.log(`${authRequestLogPrefix} refresh state updated`, {
      hasNewAccessToken: Boolean(nextTokens.access_token),
      hasNewRefreshToken: Boolean(nextTokens.refresh_token),
    })

    return nextTokens
  })().finally(() => {
    refreshAccessTokenPromise = null
  })

  const refreshedTokens = await refreshAccessTokenPromise
  if (!refreshedTokens) {
    console.log(`${authRequestLogPrefix} refresh failed`, {
      reason: 'no refreshed tokens returned',
    })
  }
  return refreshedTokens?.access_token ?? null
}

export const performAuthenticatedRequest = async ({
  endpoint,
  init = {},
  accessToken,
  refreshToken,
  webServer,
  setTokens,
}: PerformAuthenticatedRequestOptions): Promise<Response | null> => {
  const requestTokens = resolveEffectiveTokens(accessToken, refreshToken)
  if (!requestTokens.accessToken) {
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

  const makeRequest = async (): Promise<Response> => requestWithToken(requestTokens.accessToken)

  let response = await makeRequest()
  const responseText = await extractResponseText(response)
  const shouldRefresh = await shouldRefreshAuthResponse(response)
  console.log(`${authRequestLogPrefix} original response`, {
    status: response.status,
    ok: response.ok,
    authFailure: shouldRefresh,
    bodyClassification: classifyResponseBody(responseText),
  })
  if (response.ok) {
    return response
  }

  if (!shouldRefresh) {
    return response
  }

  console.log(`${authRequestLogPrefix} retry path engaged`, {
    status: response.status,
  })

  const refreshedAccessToken = await refreshAccessToken({
    refreshToken: requestTokens.refreshToken,
    webServer,
    setTokens,
  })

  if (!refreshedAccessToken) {
    console.log(`${authRequestLogPrefix} retry skipped`, {
      reason: 'refresh did not return a new access token',
    })
    return response
  }

  console.log(`${authRequestLogPrefix} retrying original request`, {
    hasNewAccessToken: Boolean(refreshedAccessToken),
  })

  const retryResponse = await requestWithToken(refreshedAccessToken)
  console.log(`${authRequestLogPrefix} retry response`, {
    status: retryResponse.status,
    ok: retryResponse.ok,
  })

  return retryResponse
}
