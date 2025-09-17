import type { NextApiRequest, NextApiResponse } from 'next'
import ZohoCRMService, { formatFormDataForZoho } from '@/lib/zoho-crm'

interface ContactFormData {
  name: string
  company?: string
  email: string
  phone: string
  interest: string
  locale?: string
}

interface ApiResponse {
  success: boolean
  message: string
  leadId?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.',
    })
  }

  try {
    const formData: ContactFormData = req.body

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'interest']
    const missingFields = requiredFields.filter(field => !formData[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      })
    }

    // Initialize Zoho CRM service
    const zohoCRM = new ZohoCRMService()

    // Check if lead already exists
    const existingLeads = await zohoCRM.searchLeadByEmail(formData.email)

    if (existingLeads.length > 0) {
      // Update existing lead with new information
      const existingLead = existingLeads[0]
      const updatedLeadData = formatFormDataForZoho(formData, formData.locale || 'fr')

      // Add update timestamp to description
      updatedLeadData.Description = `${updatedLeadData.Description}\n\nUpdated: ${new Date().toISOString()}`

      const result = await zohoCRM.updateLead(existingLead.id, updatedLeadData)

      if (result.data[0].status === 'success') {
        return res.status(200).json({
          success: true,
          message: 'Lead updated successfully',
          leadId: existingLead.id,
        })
      } else {
        throw new Error(`Failed to update lead: ${result.data[0].message}`)
      }
    } else {
      // Create new lead
      const leadData = formatFormDataForZoho(formData, formData.locale || 'fr')
      const result = await zohoCRM.createLead(leadData)

      if (result.data[0].status === 'success') {
        return res.status(201).json({
          success: true,
          message: 'Lead created successfully',
          leadId: result.data[0].details.id,
        })
      } else {
        throw new Error(`Failed to create lead: ${result.data[0].message}`)
      }
    }
  } catch (error) {
    console.error('Contact form submission error:', error)

    // Don't expose internal error details to client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return res.status(500).json({
      success: false,
      message: 'Failed to submit contact form',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    })
  }
}