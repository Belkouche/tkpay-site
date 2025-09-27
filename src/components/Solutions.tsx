import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { CreditCard, Smartphone, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const solutionIcons = {
  pos: CreditCard,
  account: Smartphone,
  ecommerce: ShoppingCart,
}

export function Solutions() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const isRTL = router.locale === 'ar'

  const solutions = [
    {
      key: 'pos',
      icon: solutionIcons.pos,
      title: t('solutions.pos.title'),
      description: t('solutions.pos.description'),
    },
    {
      key: 'account',
      icon: solutionIcons.account,
      title: t('solutions.account.title'),
      description: t('solutions.account.description'),
    },
    {
      key: 'ecommerce',
      icon: solutionIcons.ecommerce,
      title: t('solutions.ecommerce.title'),
      description: t('solutions.ecommerce.description'),
    },
  ]

  return (
    <section id="solutions" className="py-20 bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t('solutions.title')}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Solutions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {solutions.map((solution, index) => {
            const Icon = solution.icon
            return (
              <Card
                key={solution.key}
                className="group hover:scale-105 transition-all duration-300 cursor-pointer backdrop-blur-md bg-white/80 border border-white/20 shadow-lg hover:bg-white/90"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <CardHeader className="text-center pb-4">
                  {/* Icon */}
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
                    {solution.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="text-center pt-0">
                  <CardDescription className="text-muted-foreground leading-relaxed text-base">
                    {solution.description}
                  </CardDescription>

                  {/* Hover indicator */}
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom section */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('solutions.description')}
          </p>
        </div>
      </div>
    </section>
  )
}