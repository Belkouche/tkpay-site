import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { UserPlus, Settings, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const stepIcons = [UserPlus, Settings, CheckCircle]

export function HowItWorks() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const isRTL = router.locale === 'ar'

  const steps = [
    {
      icon: stepIcons[0],
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
    },
    {
      icon: stepIcons[1],
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
    },
    {
      icon: stepIcons[2],
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
    },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t('howItWorks.title')}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto rounded-full"></div>
        </div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isLastStep = index === steps.length - 1

              return (
                <div key={index} className="relative">
                  {/* Step card */}
                  <Card className="relative z-10 hover:scale-105 transition-all duration-300 backdrop-blur-md bg-white/80 border border-white/20 shadow-lg hover:bg-white/90">
                    {/* Step number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>

                    <CardHeader className="text-center pb-4 pt-8">
                      {/* Icon */}
                      <div className="mb-4">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <CardTitle className="text-xl md:text-2xl font-semibold text-foreground">
                        {step.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="text-center pt-0">
                      <CardDescription className="text-muted-foreground leading-relaxed text-base">
                        {step.description}
                      </CardDescription>
                    </CardContent>
                  </Card>

                  {/* Connector arrow (desktop only) */}
                  {!isLastStep && (
                    <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-0">
                      <div className={`w-4 h-4 rotate-45 bg-gradient-to-br from-green-500 to-blue-500 ${isRTL ? 'rotate-225' : ''}`}></div>
                    </div>
                  )}

                  {/* Mobile connector */}
                  {!isLastStep && (
                    <div className="md:hidden flex justify-center py-4">
                      <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Commencez votre transformation numérique dès aujourd'hui.
            Notre équipe vous accompagne à chaque étape.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Processus simplifié</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Support dédié</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Mise en service rapide</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}