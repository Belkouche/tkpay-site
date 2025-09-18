// Simple rate limiter for Zoho API
class RateLimiter {
  private requestCount: number = 0
  private windowStart: number = Date.now()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 10, windowMs: number = 1000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async waitForToken(): Promise<void> {
    const now = Date.now()

    if (now - this.windowStart >= this.windowMs) {
      this.requestCount = 0
      this.windowStart = now
    }

    if (this.requestCount >= this.maxRequests) {
      const waitTime = this.windowMs - (now - this.windowStart)
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.waitForToken()
      }
    }

    this.requestCount++
  }
}

const rateLimit = parseInt(process.env.ZOHO_RATE_LIMIT || '10', 10)
const zohoRateLimiter = new RateLimiter(rateLimit, 1000)

interface ZohoLead {
  First_Name: string
  Last_Name: string
  Company: string
  Email: string
  Phone: string
  Lead_Source: string
  Description: string
  // Custom fields for TKPay
  Interest_Type?: 'POS' | 'Online_Payment' | 'Payment_Account'
  Language_Preference?: 'French' | 'Arabic' | 'English'
  Lead_Status?: string
}

interface ZohoResponse {
  data: Array<{
    code: string
    details: {
      Modified_Time: string
      Modified_By: {
        name: string
        id: string
      }
      Created_Time: string
      id: string
      Created_By: {
        name: string
        id: string
      }
    }
    message: string
    status: string
  }>
}

/**
 * ZohoCRMService Class
 *
 * A comprehensive service class for integrating with Zoho CRM API.
 * Handles OAuth authentication, lead management, and regional API support.
 *
 * Features:
 * - Automatic OAuth token management with refresh
 * - Lead creation and updating with duplicate detection
 * - Multi-regional Zoho API support (International, EU, India, etc.)
 * - Rate limiting protection (default: 10 requests/second, configurable via ZOHO_RATE_LIMIT)
 * - Error handling and logging
 * - TypeScript interfaces for type safety
 *
 * @class ZohoCRMService
 * @example
 * ```typescript
 * const zohoCRM = new ZohoCRMService();
 * const lead = await zohoCRM.createLead(leadData);
 * ```
 */
class ZohoCRMService {
  /** Base URL for Zoho CRM API (varies by region) */
  private baseUrl: string
  /** Current OAuth access token */
  private accessToken: string | null = null
  /** Token expiry timestamp */
  private tokenExpiry: number = 0

  /**
   * Creates a new ZohoCRMService instance.
   * Configures the appropriate Zoho API endpoint based on environment variables.
   *
   * @constructor
   */
  constructor() {
    // Use the appropriate Zoho domain based on your account
    // .com for International, .eu for Europe, .in for India
    this.baseUrl = process.env.ZOHO_CRM_BASE_URL || 'https://www.zohoapis.com/crm/v2'
  }

  /**
   * Get access token using refresh token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const refreshToken = process.env.ZOHO_CRM_REFRESH_TOKEN
    const clientId = process.env.ZOHO_CRM_CLIENT_ID
    const clientSecret = process.env.ZOHO_CRM_CLIENT_SECRET

    if (!refreshToken || !clientId || !clientSecret) {
      throw new Error('Missing Zoho CRM credentials in environment variables')
    }

    // Determine the correct accounts domain based on the CRM base URL
    const accountsDomain = this.getAccountsDomain()

    try {
      const response = await fetch(`${accountsDomain}/oauth/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OAuth error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          clientId: clientId?.substring(0, 10) + '...',
          accountsDomain
        })
        throw new Error(`Failed to get access token: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()

      if (data.error) {
        console.error('Zoho OAuth error details:', {
          error: data.error,
          errorDescription: data.error_description,
          clientId: clientId?.substring(0, 10) + '...',
          accountsDomain
        })
        throw new Error(`Zoho OAuth error: ${data.error}${data.error_description ? ` - ${data.error_description}` : ''}`)
      }

      if (!data.access_token) {
        throw new Error('No access token received from Zoho')
      }

      this.accessToken = data.access_token
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000

      return this.accessToken!
    } catch (error) {
      console.error('Error getting Zoho access token:', error)
      throw error
    }
  }

  /**
   * Get the correct accounts domain based on the CRM base URL
   */
  private getAccountsDomain(): string {
    const baseUrl = this.baseUrl

    if (baseUrl.includes('.eu')) {
      return 'https://accounts.zoho.eu'
    } else if (baseUrl.includes('.in')) {
      return 'https://accounts.zoho.in'
    } else if (baseUrl.includes('.com.au')) {
      return 'https://accounts.zoho.com.au'
    } else if (baseUrl.includes('.jp')) {
      return 'https://accounts.zoho.jp'
    } else {
      // Default to .com for international
      return 'https://accounts.zoho.com'
    }
  }

  /**
   * Create a lead in Zoho CRM
   */
  async createLead(leadData: Partial<ZohoLead>): Promise<ZohoResponse> {
    try {
      // Wait for rate limiter before making API call
      await zohoRateLimiter.waitForToken()

      const accessToken = await this.getAccessToken()

      const response = await fetch(`${this.baseUrl}/Leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [leadData],
          trigger: ['approval', 'workflow', 'blueprint'],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Zoho create lead error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          leadData: JSON.stringify(leadData, null, 2)
        })
        throw new Error(`Failed to create lead: ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error creating Zoho lead:', error)
      throw error
    }
  }

  /**
   * Search for existing leads by email to avoid duplicates
   */
  async searchLeadByEmail(email: string): Promise<any[]> {
    try {
      // Wait for rate limiter before making API call
      await zohoRateLimiter.waitForToken()

      const accessToken = await this.getAccessToken()
      const searchQuery = `(Email:equals:${email})`

      const response = await fetch(
        `${this.baseUrl}/Leads/search?criteria=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        }
      )

      if (response.status === 204) {
        // No content - no leads found
        return []
      }

      if (!response.ok) {
        throw new Error(`Failed to search leads: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error searching Zoho leads:', error)
      return [] // Return empty array on error to allow lead creation
    }
  }

  /**
   * Update an existing lead
   */
  async updateLead(leadId: string, leadData: Partial<ZohoLead>): Promise<ZohoResponse> {
    try {
      // Wait for rate limiter before making API call
      await zohoRateLimiter.waitForToken()

      const accessToken = await this.getAccessToken()

      const response = await fetch(`${this.baseUrl}/Leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [leadData],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update lead: ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error updating Zoho lead:', error)
      throw error
    }
  }
}

// Utility function to convert form data to Zoho lead format
export function formatFormDataForZoho(formData: {
  name: string
  company?: string
  email: string
  phone: string
  interest: string
}, locale: string = 'fr'): ZohoLead {
  // Split name into first and last name
  const nameParts = formData.name.trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || 'N/A'

  // Map interest to Zoho values
  const interestMapping = {
    'pos': 'POS' as const,
    'online': 'Online_Payment' as const,
    'account': 'Payment_Account' as const,
  }

  // Map locale to language preference
  const languageMapping = {
    'fr': 'French' as const,
    'ar': 'Arabic' as const,
    'en': 'English' as const,
  }

  // Ensure all required fields are present and not empty
  return {
    First_Name: firstName || 'Unknown',
    Last_Name: lastName || 'N/A',
    Company: formData.company || 'Not Specified',
    Email: formData.email,
    Phone: formData.phone,
    Lead_Source: 'Website Form',
    Description: `Lead submitted from TKPay landing page. Interest: ${formData.interest}. Language: ${locale}`,
    Interest_Type: interestMapping[formData.interest as keyof typeof interestMapping] || 'POS',
    Language_Preference: languageMapping[locale as keyof typeof languageMapping] || 'French',
    Lead_Status: 'Not Contacted',
  }
}

export default ZohoCRMService