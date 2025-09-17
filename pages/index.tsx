import { GetStaticProps } from 'next'
import Head from 'next/head'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

import { Navigation } from '@/components/Navigation'
import { Hero } from '@/components/Hero'
import { Solutions } from '@/components/Solutions'
import { HowItWorks } from '@/components/HowItWorks'
import { ContactForm } from '@/components/ContactForm'
import { Footer } from '@/components/Footer'

export default function Home() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { locale } = router
  const isRTL = locale === 'ar'

  const seoTitle = locale === 'fr'
    ? 'TKPay - Solutions de paiement modernes pour le Maroc'
    : locale === 'ar'
    ? 'TKPay - حلول الدفع الحديثة للمغرب'
    : 'TKPay - Modern payment solutions for Morocco'

  const seoDescription = locale === 'fr'
    ? 'TKPay fournit une suite complète de solutions de paiement adaptées aux besoins des Marocains. TPE, comptes de paiement, et modules e-commerce.'
    : locale === 'ar'
    ? 'تقدم TKPay مجموعة كاملة من حلول الدفع المصممة لتلبية احتياجات المغاربة. أجهزة نقاط البيع وحسابات الدفع ووحدات التجارة الإلكترونية.'
    : 'TKPay provides a complete suite of payment solutions tailored to the needs of Moroccans. POS terminals, payment accounts, and e-commerce modules.'

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tkpay.ma/" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content="https://tkpay.ma/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://tkpay.ma/" />
        <meta property="twitter:title" content={seoTitle} />
        <meta property="twitter:description" content={seoDescription} />
        <meta property="twitter:image" content="https://tkpay.ma/og-image.jpg" />

        {/* Language and locale */}
        <meta property="og:locale" content={locale === 'ar' ? 'ar_MA' : locale === 'fr' ? 'fr_MA' : 'en_US'} />
        <link rel="canonical" href={`https://tkpay.ma${locale === 'fr' ? '' : '/' + locale}`} />

        {/* Alternate languages */}
        <link rel="alternate" hrefLang="fr" href="https://tkpay.ma" />
        <link rel="alternate" hrefLang="ar" href="https://tkpay.ma/ar" />
        <link rel="alternate" hrefLang="en" href="https://tkpay.ma/en" />
        <link rel="alternate" hrefLang="x-default" href="https://tkpay.ma" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme and mobile optimization */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Performance hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'TKPay',
              description: seoDescription,
              url: 'https://tkpay.ma',
              logo: 'https://tkpay.ma/logo.png',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                availableLanguage: ['French', 'Arabic', 'English']
              },
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'MA'
              }
            })
          }}
        />
      </Head>

      <div className={`font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <Navigation />
        <main>
          <Hero />
          <Solutions />
          <HowItWorks />
          <ContactForm />
        </main>
        <Footer />
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'fr', ['common'])),
    },
  }
}