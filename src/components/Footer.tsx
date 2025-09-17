import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

export function Footer() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const isRTL = router.locale === 'ar'

  return (
    <footer className="py-8 bg-white border-t border-gray-200" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}