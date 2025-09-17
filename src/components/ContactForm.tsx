import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useForm, Controller } from 'react-hook-form'
import { Send, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { PhoneInput } from '@/components/ui/phone-input'
import { EmailInput, useEmailValidation } from '@/components/ui/email-input'
import DataSanitizer from '@/lib/sanitizer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FormData {
  name: string
  company: string
  email: string
  phone: string
  interest: string
}

export function ContactForm() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const isRTL = router.locale === 'ar'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Email validation hook
  const {
    isValid: isEmailValid,
    error: emailError,
    handleValidationChange: handleEmailValidationChange
  } = useEmailValidation()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
    reset,
    clearErrors,
  } = useForm<FormData>({
    defaultValues: {
      interest: 'pos', // Default to POS
    },
  })

  // Create validation rules that update with language changes
  const getValidationRules = useCallback(() => ({
    name: {
      required: t('contact.form.errors.nameRequired'),
      minLength: { value: 2, message: t('contact.form.errors.nameMinLength') },
      maxLength: { value: 100, message: t('contact.form.errors.nameMaxLength') },
      pattern: {
        value: /^[a-zA-ZÀ-ÿ\s'-]+$/,
        message: t('contact.form.errors.namePattern')
      }
    },
    company: {
      required: t('contact.form.errors.companyRequired'),
      minLength: { value: 2, message: t('contact.form.errors.companyMinLength') },
      maxLength: { value: 100, message: t('contact.form.errors.companyMaxLength') }
    },
    email: {
      required: t('contact.form.errors.required'),
      validate: (value: string) => {
        if (!isEmailValid && value) {
          return emailError || t('contact.form.errors.emailInvalid')
        }
        return true
      }
    },
    phone: {
      required: t('contact.form.errors.required'),
    }
  }), [t, isEmailValid, emailError])

  // Update validation rules when language changes
  useEffect(() => {
    // Clear existing errors when language changes
    clearErrors()
  }, [router.locale, clearErrors])

  const watchedInterest = watch('interest')

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      // Client-side data sanitization before sending
      const sanitizedData = DataSanitizer.sanitizeFormData({
        ...data,
        locale: router.locale,
      })

      // Submit to Zoho CRM
      const response = await fetch('/api/submit-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      })

      const result = await response.json()

      if (result.success) {
        console.log('Lead created/updated in Zoho CRM:', result.leadId)
        setIsSubmitted(true)

        // Reset form after 5 seconds
        setTimeout(() => {
          setIsSubmitted(false)
          reset()
        }, 5000)
      } else {
        console.error('Form submission failed:', result.message)
        // You could show an error state here
        alert(t('contact.form.errors.submitError'))
      }
    } catch (error) {
      console.error('Network error:', error)
      alert(t('contact.form.errors.networkError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <section id="contact" className="py-20 bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {t('contact.form.success')}
                </h3>
                <p className="text-muted-foreground">
                  {t('contact.form.successMessage')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" className="py-20 bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              {t('contact.title')}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
          </div>

          {/* Form */}
          <Card className="backdrop-blur-md bg-white/80 border border-white/20 shadow-lg">
            <CardContent className="p-8 md:p-12">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name and Company row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {t('contact.form.name')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder={t('contact.form.placeholders.name')}
                      {...register('name', getValidationRules().name)}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">
                      {t('contact.form.company')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="company"
                      placeholder={t('contact.form.placeholders.company')}
                      {...register('company', getValidationRules().company)}
                      className={errors.company ? 'border-red-500' : ''}
                    />
                    {errors.company && (
                      <p className="text-sm text-red-500">{errors.company.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t('contact.form.email')}</Label>
                  <Controller
                    name="email"
                    control={control}
                    rules={getValidationRules().email}
                    render={({ field }) => (
                      <EmailInput
                        {...field}
                        id="email"
                        placeholder={t('contact.form.placeholders.email')}
                        onValidationChange={handleEmailValidationChange}
                        showValidationIcon={true}
                        realTimeValidation={true}
                        errorMessages={{
                          invalidFormat: t('contact.form.errors.emailFormat'),
                          invalidEmail: t('contact.form.errors.emailInvalidFormat'),
                          tooShort: t('contact.form.errors.emailTooShort'),
                          tooLong: t('contact.form.errors.emailTooLong'),
                          consecutiveDots: t('contact.form.errors.emailConsecutiveDots'),
                          localPartTooLong: t('contact.form.errors.emailLocalPartTooLong')
                        }}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                    )}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                  {!errors.email && emailError && watch('email') && (
                    <p className="text-sm text-amber-600">{emailError}</p>
                  )}
                </div>

                {/* Phone with country code */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {t('contact.form.phone')} <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="phone"
                    control={control}
                    rules={getValidationRules().phone}
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        defaultCountry="MA"
                        placeholder={t('contact.form.placeholders.phone')}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                    )}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                {/* Interest */}
                <div className="space-y-2">
                  <Label htmlFor="interest">{t('contact.form.interest')}</Label>
                  <Select
                    value={watchedInterest}
                    onValueChange={(value) => setValue('interest', value)}
                  >
                    <SelectTrigger className={errors.interest ? 'border-red-500' : ''}>
                      <SelectValue placeholder={t('contact.form.placeholders.interest')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pos">{t('contact.form.interestOptions.pos')}</SelectItem>
                      <SelectItem value="online">{t('contact.form.interestOptions.online')}</SelectItem>
                      <SelectItem value="account">{t('contact.form.interestOptions.account')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register('interest')}
                  />
                </div>

                {/* Submit button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-8 py-3 h-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('contact.form.errors.submitting')}
                      </>
                    ) : (
                      <>
                        {t('contact.form.submit')}
                        <Send className={`h-4 w-4 ml-2 ${isRTL ? 'rotate-180 mr-2 ml-0' : ''}`} />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}