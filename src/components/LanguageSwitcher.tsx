import { useRouter } from 'next/router'
import { useState } from 'react'
import { Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇲🇦' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
]

export function LanguageSwitcher() {
  const router = useRouter()
  const { locale, asPath } = router
  const [isLoading, setIsLoading] = useState(false)

  const handleLanguageChange = async (newLocale: string) => {
    setIsLoading(true)
    await router.push(asPath, asPath, { locale: newLocale })
    setIsLoading(false)
  }

  const currentLanguage = languages.find(lang => lang.code === locale)

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select
        value={locale}
        onValueChange={handleLanguageChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[120px] border-0 bg-transparent focus:ring-0">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{currentLanguage?.flag}</span>
              <span className="hidden sm:inline">{currentLanguage?.name}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <span className="flex items-center gap-2">
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}