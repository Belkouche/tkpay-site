import { useState } from 'react'
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
  } = useForm<FormData>({
    defaultValues: {
      interest: 'pos', // Default to POS
    },
  })

  const watchedInterest = watch('interest')

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      // Submit to Zoho CRM
      const response = await fetch('/api/submit-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          locale: router.locale,
        }),
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
        alert('Une erreur est survenue. Veuillez réessayer.')
      }
    } catch (error) {
      console.error('Network error:', error)
      alert('Erreur de connexion. Veuillez vérifier votre connexion internet.')
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
                  Notre équipe vous contactera dans les 24 heures.
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
                      placeholder="Jean Dupont"
                      {...register('name', {
                        required: 'Le nom complet est requis',
                        minLength: { value: 2, message: 'Minimum 2 caractères' },
                        maxLength: { value: 100, message: 'Maximum 100 caractères' },
                        pattern: {
                          value: /^[a-zA-ZÀ-ÿ\s'-]+$/,
                          message: 'Le nom ne peut contenir que des lettres et espaces'
                        }
                      })}
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
                      placeholder="Nom de votre entreprise"
                      {...register('company', {
                        required: 'Le nom de l\'entreprise est requis',
                        minLength: { value: 2, message: 'Minimum 2 caractères' },
                        maxLength: { value: 100, message: 'Maximum 100 caractères' }
                      })}
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
                    rules={{
                      required: 'Ce champ est requis',
                      validate: (value) => {
                        if (!isEmailValid && value) {
                          return emailError || 'Email invalide'
                        }
                        return true
                      }
                    }}
                    render={({ field }) => (
                      <EmailInput
                        {...field}
                        id="email"
                        placeholder="exemple@domaine.com"
                        onValidationChange={handleEmailValidationChange}
                        showValidationIcon={true}
                        realTimeValidation={true}
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
                    rules={{
                      required: 'Ce champ est requis',
                    }}
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        defaultCountry="MA"
                        placeholder="Enter phone number"
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
                      <SelectValue placeholder="Sélectionnez une option" />
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
                        Envoi en cours...
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