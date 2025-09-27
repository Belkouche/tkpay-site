import type { NextApiRequest, NextApiResponse } from 'next'
import ZohoCRMService, { formatFormDataForZoho } from '@/lib/zoho-crm'
import DataSanitizer from '@/lib/sanitizer'
import { withContactFormRateLimit } from '@/lib/api-middleware'
import { verifyCSRFTokenFromBody } from '@/lib/csrf-protection'
import Logger from '@/lib/logger'
import { submissionCache } from '@/lib/submission-cache'

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
 *                       example: \"Lead created successfully\"
 *                     leadId:
 *                       example: \"5847372000000123456\"
 *       '400':
 *         $ref: '#/components/responses/ValidationErrorResponse'
 *       '405':
 *         $ref: '#/components/responses/MethodNotAllowedResponse'
 *       '429':
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: false
 *               message: \"Rate limit exceeded. Please try again later.\"
 *       '500':
 *         $ref: '#/components/responses/ServerErrorResponse'
 *     security: []
 *
 * @route POST /api/submit-contact
 * @param {NextApiRequest} req - The API request object
 * @param {NextApiResponse<ApiResponse>} res - The API response object
 * @returns {Promise<void>} JSON response with operation result
 */
async function contactHandler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    Logger.logSecurityEvent('unauthorized_access', req, { 
      reason: 'method_not_allowed',
      allowed_method: 'POST'
    });
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.',
    })
  }

  // Validate CSRF token
  if (!verifyCSRFTokenFromBody(req)) {
    Logger.logCSRFTokenInvalid(req);
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token'
    });
  }

  try {
    // Apply security headers
    import('@/lib/security-headers').then(({ applySecurityHeaders }) => {
      applySecurityHeaders(res);
    }).catch(console.error);

    // Validate request metadata for security
    DataSanitizer.validateRequestMetadata(req)

    // Sanitize and validate form data
    const sanitizedData = DataSanitizer.sanitizeFormData(req.body)

    // Check for duplicate submission
    const cacheKey = submissionCache.generateKey(sanitizedData);
    if (submissionCache.isDuplicate(cacheKey)) {
      Logger.info('Duplicate submission blocked', {
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        email: sanitizedData.email
      });
      
      return res.status(200).json({
        success: true,
        message: 'Lead already submitted recently',
        leadId: undefined, // No lead was actually created/updated
      });
    }

    // Log successful form submission (without sensitive data)
    Logger.logContactFormSubmission(req, {
      name: sanitizedData.name,
      interest: sanitizedData.interest,
      locale: sanitizedData.locale
    });

    // Initialize Zoho CRM service
    const zohoCRM = new ZohoCRMService()

    // Check if lead already exists
    const existingLeads = await zohoCRM.searchLeadByEmail(sanitizedData.email)

    if (existingLeads.length > 0) {
      // Update existing lead with new information
      const existingLead = existingLeads[0]
      const updatedLeadData = formatFormDataForZoho(sanitizedData, sanitizedData.locale || 'fr')

      // Add update timestamp to description
      updatedLeadData.Description = `${updatedLeadData.Description}\\n\\nUpdated: ${new Date().toISOString()}`

      const result = await zohoCRM.updateLead(existingLead.id, updatedLeadData)

      if (result.data[0].status === 'success') {
        // Add to cache to prevent duplicate submissions
        submissionCache.add(cacheKey, sanitizedData);
        
        Logger.info('Lead updated successfully', {
          leadId: existingLead.id,
          email: sanitizedData.email,
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        });
        
        return res.status(200).json({
          success: true,
          message: 'Lead updated successfully',
          leadId: existingLead.id,
        })
      } else {
        Logger.logSecurityEvent('zoho_api_error', req, {
          action: 'update_lead',
          error: result.data[0].message,
          leadId: existingLead.id
        });
        throw new Error(`Failed to update lead: ${result.data[0].message}`)
      }
    } else {
      // Create new lead
      const leadData = formatFormDataForZoho(sanitizedData, sanitizedData.locale || 'fr')
      const result = await zohoCRM.createLead(leadData)

      if (result.data[0].status === 'success') {
        // Add to cache to prevent duplicate submissions
        submissionCache.add(cacheKey, sanitizedData);
        
        Logger.info('Lead created successfully', {
          leadId: result.data[0].details.id,
          email: sanitizedData.email,
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        });
        
        return res.status(201).json({
          success: true,
          message: 'Lead created successfully',
          leadId: result.data[0].details.id,
        })
      } else {
        Logger.logSecurityEvent('zoho_api_error', req, {
          action: 'create_lead',
          error: result.data[0].message
        });
        throw new Error(`Failed to create lead: ${result.data[0].message}`)
      }
    }
  } catch (error) {
    console.error('Contact form submission error:', error)

    // Don't expose internal error details to client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log the error
    Logger.error('Contact form submission error', {
      error: errorMessage,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    // Return appropriate status code based on error type
    if (errorMessage.includes('Rate limit')) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
      });
    }

    if (errorMessage.includes('CSRF token')) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token'
      });
    }

    if (errorMessage.includes('Moroccan phone number')) {
      Logger.logInvalidInput(req, [errorMessage]);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Moroccan phone number',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to submit contact form',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    })
  }
}

// Export the handler wrapped with rate limiting
export default withContactFormRateLimit()(contactHandler)