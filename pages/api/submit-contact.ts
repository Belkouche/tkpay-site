import type { NextApiRequest, NextApiResponse } from 'next'
import ZohoCRMService, { formatFormDataForZoho } from '@/lib/zoho-crm'
import DataSanitizer from '@/lib/sanitizer'

/**
 * Interface defining the structure of contact form data received from the client
 * @interface ContactFormData
 */
interface ContactFormData {
  /** Full name of the contact person */
  name: string
  /** Company or organization name (optional for backward compatibility) */
  company?: string
  /** Email address for contact */
  email: string
  /** Phone number with international format */
  phone: string
  /** Type of interest: 'pos', 'online', or 'account' */
  interest: string
  /** User's locale preference (fr, ar, en) */
  locale?: string
}

/**
 * Interface defining the structure of API response
 * @interface ApiResponse
 */
interface ApiResponse {
  /** Whether the operation was successful */
  success: boolean
  /** Human-readable message describing the result */
  message: string
  /** Zoho CRM lead ID if operation was successful */
  leadId?: string
  /** Error details if operation failed */
  error?: string
}

/**
 * Contact Form Submission API Handler
 *
 * Handles contact form submissions with comprehensive security and validation:
 * - Data sanitization and validation
 * - Integration with Zoho CRM for lead management
 * - Duplicate detection and lead updating
 * - Multi-language support
 * - Security headers and request validation
 *
 * @swagger
 * /api/submit-contact:
 *   post:
 *     tags:
 *       - Contact
 *     summary: Submit contact form
 *     description: |
 *       Processes contact form submissions with comprehensive security validation.
 *       Creates or updates leads in Zoho CRM with automatic duplicate detection.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactFormData'
 *           examples:
 *             french_user:
 *               summary: French user submission
 *               value:
 *                 name: "Jean Dupont"
 *                 company: "ACME SARL"
 *                 email: "jean.dupont@acme.fr"
 *                 phone: "+33 1 23 45 67 89"
 *                 interest: "pos"
 *                 locale: "fr"
 *             arabic_user:
 *               summary: Arabic user submission
 *               value:
 *                 name: "أحمد محمد"
 *                 company: "شركة التقنية"
 *                 email: "ahmed@tech.ma"
 *                 phone: "+212 6 12 34 56 78"
 *                 interest: "online"
 *                 locale: "ar"
 *             english_user:
 *               summary: English user submission
 *               value:
 *                 name: "John Smith"
 *                 company: "Tech Corp"
 *                 email: "john@techcorp.com"
 *                 phone: "+1 555 123 4567"
 *                 interest: "account"
 *                 locale: "en"
 *     responses:
 *       '200':
 *         $ref: '#/components/responses/SuccessResponse'
 *       '201':
 *         description: Lead created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     success:
 *                       example: true
 *                     message:
 *                       example: "Lead created successfully"
 *                     leadId:
 *                       example: "5847372000000123456"
 *       '400':
 *         $ref: '#/components/responses/ValidationErrorResponse'
 *       '405':
 *         $ref: '#/components/responses/MethodNotAllowedResponse'
 *       '500':
 *         $ref: '#/components/responses/ServerErrorResponse'
 *     security: []
 *
 * @route POST /api/submit-contact
 * @param {NextApiRequest} req - The API request object
 * @param {NextApiResponse<ApiResponse>} res - The API response object
 * @returns {Promise<void>} JSON response with operation result
 */
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