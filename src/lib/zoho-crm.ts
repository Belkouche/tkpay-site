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

class ZohoCRMService {
  private baseUrl: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0

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

    try {
      const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
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
        throw new Error(`Failed to get access token: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`Zoho OAuth error: ${data.error}`)
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
   * Create a lead in Zoho CRM
   */
  async createLead(leadData: Partial<ZohoLead>): Promise<ZohoResponse> {
    try {
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
  const lastName = nameParts.slice(1).join(' ') || ''

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

  return {
    First_Name: firstName,
    Last_Name: lastName,
    Company: formData.company || '',
    Email: formData.email,
    Phone: formData.phone,
    Lead_Source: 'Website Form',
    Description: `Lead submitted from TKPay landing page. Interest: ${formData.interest}. Language: ${locale}`,
    Interest_Type: interestMapping[formData.interest as keyof typeof interestMapping],
    Language_Preference: languageMapping[locale as keyof typeof languageMapping],
    Lead_Status: 'New',
  }
}

export default ZohoCRMService