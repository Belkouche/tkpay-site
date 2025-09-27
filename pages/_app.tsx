import type { AppProps } from 'next/app'
import { appWithTranslation } from 'next-i18next'
import '@/styles/globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'

function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  )
}

export default appWithTranslation(App)