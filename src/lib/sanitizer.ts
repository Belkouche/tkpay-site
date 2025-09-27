import type { NextApiRequest } from 'next'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

interface SanitizedFormData {
  name: string
  company?: string
  email: string
  phone: string
  interest: string
  locale?: string
}

// Function to validate Moroccan phone numbers
const isValidMoroccanPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Moroccan phone numbers can be in these formats:
  // +212 XXXX XXXXX
  // 00212 XXXX XXXXX
  // 06XXXXXXXX or 07XXXXXXXX (10 digits starting with 06 or 07)
  // +212XXXXXXXX or 00212XXXXXXXX (12 digits starting with 212 after country code)
  
  // Check for 06 or 07 format (10 digits total)
  if (digitsOnly.length === 10 && (digitsOnly.startsWith('06') || digitsOnly.startsWith('07'))) {
    return true;
  }
  
  // Check for +212 or 00212 format (12 digits after country code removal)
  if ((phone.startsWith('+212') || phone.startsWith('00212')) && digitsOnly.length === 12) {
    const withoutPrefix = digitsOnly.substring(3); // Remove 212
    return withoutPrefix.startsWith('6') || withoutPrefix.startsWith('7');
  }
  
  return false;
}

class DataSanitizer {
  static validateRequestMetadata(req: NextApiRequest): void {
    const userAgent = req.headers['user-agent']
    const referer = req.headers.referer

    if (!userAgent || userAgent.length > 1000) {
      throw new Error('Invalid user agent')
    }

    if (referer && !validator.isURL(referer)) {
      throw new Error('Invalid referer')
    }
  }

  static sanitizeFormData(data: any): SanitizedFormData {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid form data')
    }

    const { name, company, email, phone, interest, locale } = data

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Name is required')
    }

    if (!email || typeof email !== 'string' || !validator.isEmail(email)) {
      throw new Error('Valid email is required')
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      throw new Error('Phone is required')
    }

    // Enhanced phone validation for Moroccan numbers
    if (!isValidMoroccanPhoneNumber(phone)) {
      throw new Error('Valid Moroccan phone number is required')
    }

    if (!interest || typeof interest !== 'string' || !['pos', 'online', 'account'].includes(interest)) {
      throw new Error('Valid interest type is required')
    }

    const sanitizedData: SanitizedFormData = {
      name: DOMPurify.sanitize(name.trim()),
      email: validator.normalizeEmail(email) || email.toLowerCase().trim(),
      phone: DOMPurify.sanitize(phone.trim()), // Keep original formatting with spaces, hyphens, etc.
      interest: interest.trim(),
    }

    if (company && typeof company === 'string' && company.trim().length > 0) {
      sanitizedData.company = DOMPurify.sanitize(company.trim())
    }

    if (locale && typeof locale === 'string' && ['fr', 'ar', 'en'].includes(locale)) {
      sanitizedData.locale = locale
    }

    return sanitizedData
  }
}

export default DataSanitizer