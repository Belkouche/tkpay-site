import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Menu, X, ExternalLink } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Navigation() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const isRTL = router.locale === 'ar'

  // Using environment variable for the API docs URL, defaulting to localhost for development
  const apiDocsUrl = process.env.NEXT_PUBLIC_API_DOCS_URL || 'http://localhost:8080/api-docs'

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsOpen(false)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-foreground">
              {t('nav.logo')}
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('solutions')}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              {t('nav.solutions')}
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              {t('nav.howItWorks')}
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              {t('nav.contact')}
            </button>
            <Link 
              href={apiDocsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span>{t('nav.apiDocs')}</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
            <LanguageSwitcher />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => scrollToSection('solutions')}
                className="block px-3 py-2 text-foreground/80 hover:text-foreground transition-colors w-full text-left"
              >
                {t('nav.solutions')}
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="block px-3 py-2 text-foreground/80 hover:text-foreground transition-colors w-full text-left"
              >
                {t('nav.howItWorks')}
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="block px-3 py-2 text-foreground/80 hover:text-foreground transition-colors w-full text-left"
              >
                {t('nav.contact')}
              </button>
              <Link 
                href={apiDocsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block px-3 py-2 text-foreground/80 hover:text-foreground transition-colors w-full text-left flex items-center gap-1"
              >
                <span>{t('nav.apiDocs')}</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}