import type { NextApiRequest, NextApiResponse } from 'next'
import ZohoCRMService, { formatFormDataForZoho } from '@/lib/zoho-crm'
import DataSanitizer from '@/lib/sanitizer'

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
    // Validate request metadata for security
    DataSanitizer.validateRequestMetadata(req)

    // Sanitize and validate form data
    const sanitizedData = DataSanitizer.sanitizeFormData(req.body)

    // Initialize Zoho CRM service
    const zohoCRM = new ZohoCRMService()

    // Check if lead already exists
    const existingLeads = await zohoCRM.searchLeadByEmail(sanitizedData.email)

    if (existingLeads.length > 0) {
      // Update existing lead with new information
      const existingLead = existingLeads[0]
      const updatedLeadData = formatFormDataForZoho(sanitizedData, sanitizedData.locale || 'fr')

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
      const leadData = formatFormDataForZoho(sanitizedData, sanitizedData.locale || 'fr')
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