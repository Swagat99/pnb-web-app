const AUTH_CONFIG = {
    authorization_endpoint: import.meta.env.VITE_AUTH_AUTHORIZATION_ENDPOINT,
    token_endpoint: import.meta.env.VITE_AUTH_TOKEN_ENDPOINT,
    userinfo_endpoint: import.meta.env.VITE_AUTH_USERINFO_ENDPOINT,
    client_id: import.meta.env.VITE_AUTH_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_AUTH_REDIRECT_URI,
    scope: 'path openid profile email offline_access authorities privileges user_name created adminName bankCode goauthentik.io/api',
    response_type: 'code',
}

const generateRandom = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

const sha256 = async (plain) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return await window.crypto.subtle.digest('SHA-256', data)
}

const base64urlencode = (arrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export const login = async () => {
    try {
        const state = generateRandom(32)
        const codeVerifier = generateRandom(64)
        const hashed = await sha256(codeVerifier)
        const codeChallenge = base64urlencode(hashed)

        sessionStorage.setItem('oauth_state', state)
        sessionStorage.setItem('code_verifier', codeVerifier)

        const params = new URLSearchParams({
            response_type: AUTH_CONFIG.response_type,
            client_id: AUTH_CONFIG.client_id,
            redirect_uri: AUTH_CONFIG.redirect_uri,
            scope: AUTH_CONFIG.scope,
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        })

        window.location.href = `${AUTH_CONFIG.authorization_endpoint}?${params.toString()}`
    } catch (err) {
        console.error('Login error:', err)
    }
}

export const handleCallback = async () => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const savedState = sessionStorage.getItem('oauth_state')
    const codeVerifier = sessionStorage.getItem('code_verifier')

    if (!code) throw new Error('No code in callback')
    if (state !== savedState) throw new Error('State mismatch')

    const response = await fetch(AUTH_CONFIG.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: AUTH_CONFIG.client_id,
            redirect_uri: AUTH_CONFIG.redirect_uri,
            code: code,
            code_verifier: codeVerifier,
        }),
    })

    const tokens = await response.json()
    if (tokens.error) throw new Error(tokens.error_description || tokens.error)

    sessionStorage.setItem('access_token', tokens.access_token)
    sessionStorage.setItem('id_token', tokens.id_token)
    if (tokens.refresh_token) {
        sessionStorage.setItem('refresh_token', tokens.refresh_token)
    }

    const payload = tokens.id_token.split('.')[1]
    const user = JSON.parse(atob(payload))
    sessionStorage.setItem('user', JSON.stringify(user))

    return user
}

export const getUser = () => {
    const user = sessionStorage.getItem('user')
    return user ? JSON.parse(user) : null
}

/**
 * Checks if the current access token is valid and not expired.
 * Returns true if a valid, non-expired token exists.
 */
export const isTokenValid = () => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return false

    try {
        // JWT structure: header.payload.signature
        const payload = token.split('.')[1]
        if (!payload) return false

        const decoded = JSON.parse(atob(payload))
        if (!decoded.exp) return false

        // exp is in seconds, Date.now() is in milliseconds
        // Add 30-second buffer so we catch expiry slightly early
        const nowInSeconds = Math.floor(Date.now() / 1000)
        return decoded.exp > nowInSeconds + 30
    } catch (err) {
        return false
    }
}

export const logout = () => {
    sessionStorage.clear()
    window.location.href = import.meta.env.VITE_AUTH_LOGOUT_URL
}

/**
 * Silently redirects to home page without hitting the auth provider logout.
 * Used when a token expires passively (user left the window open).
 */
export const redirectToHome = () => {
    sessionStorage.clear()
    window.location.href = '/'
}

export const refreshTokens = async () => {
    const refreshToken = sessionStorage.getItem('refresh_token')
    if (!refreshToken) return null

    try {
        const response = await fetch(AUTH_CONFIG.token_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: AUTH_CONFIG.client_id,
                refresh_token: refreshToken,
            }),
        })

        const tokens = await response.json()
        if (tokens.error) throw new Error(tokens.error_description || tokens.error)

        sessionStorage.setItem('access_token', tokens.access_token)
        sessionStorage.setItem('id_token', tokens.id_token)
        if (tokens.refresh_token) {
            sessionStorage.setItem('refresh_token', tokens.refresh_token)
        }

        const payload = tokens.id_token.split('.')[1]
        const user = JSON.parse(atob(payload))
        sessionStorage.setItem('user', JSON.stringify(user))

        return tokens
    } catch (err) {
        console.error('Error refreshing token:', err)
        // If refresh fails (e.g. expired refresh token), redirect to home
        redirectToHome()
    }
}

let refreshInterval = null
let expiryCheckInterval = null

export const startTokenRefresh = () => {
    if (refreshInterval) clearInterval(refreshInterval)
    if (expiryCheckInterval) clearInterval(expiryCheckInterval)

    // Proactive refresh: run every 15 minutes
    refreshInterval = setInterval(() => {
        refreshTokens()
    }, 900000)

    // Expiry guard: check every 30 seconds if the token has expired.
    // If expired, attempt a refresh. If refresh also fails, redirectToHome().
    expiryCheckInterval = setInterval(async () => {
        if (!isTokenValid()) {
            try {
                const result = await refreshTokens()
                if (!result) {
                    // refresh returned null (no refresh_token) — session is dead
                    redirectToHome()
                }
            } catch {
                redirectToHome()
            }
        }
    }, 30000)
}

export const stopTokenRefresh = () => {
    if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null }
    if (expiryCheckInterval) { clearInterval(expiryCheckInterval); expiryCheckInterval = null }
}