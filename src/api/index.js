import axios from 'axios'
import { BASE_URL } from '../utils'


export const ENDPOINTS = {
  AUTH_WITH_GOOGLE: `${BASE_URL}/api/login/google`,
  MANUAL_LOGIN: `${BASE_URL}/api/login`,
  SIGN_UP: `${BASE_URL}/api/signup`,
  SEND_EMAIL_RESET_CODES: `${BASE_URL}/api/send_email_reset_codes`,
  VERIFY_CODES: `${BASE_URL}/api/verify_reset_codes`,
  RESET_PASSWORD: `${BASE_URL}/api/reset_email_password`,
  REFRESH_TOKEN: `${BASE_URL}/api/auth/refresh`,
  USER_PROFILE: (id) => `${BASE_URL}/api/user/${id}`
}


/**
 * Refresh the user token and update the user state.
 * @param {Object} payload - The payload to send for refreshing the token
 */
export const refreshToken = async (payload) => {
  try {
    const response = await axios.post(ENDPOINTS.REFRESH_TOKEN, payload)

    if (response.status === 200 && response.data) {
      return response.data
    } else {
      throw new Error('Failed to refresh token: Invalid response')
    }
  } catch (error) {
    console.error('refreshToken error:', error)
    throw error
  }
}
