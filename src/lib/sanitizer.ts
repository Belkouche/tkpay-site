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

    if (!interest || typeof interest !== 'string' || !['pos', 'online', 'account'].includes(interest)) {
      throw new Error('Valid interest type is required')
    }

    const sanitizedData: SanitizedFormData = {
      name: DOMPurify.sanitize(name.trim()),
      email: validator.normalizeEmail(email) || email.toLowerCase().trim(),
      phone: DOMPurify.sanitize(phone.trim()),
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