import * as React from "react"
import { Mail, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface EmailInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onValidationChange?: (isValid: boolean, error?: string) => void
  showValidationIcon?: boolean
  realTimeValidation?: boolean
}

// Comprehensive email validation
const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' }
  }

  // Basic format check
  const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!basicEmailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email format' }
  }

  // More comprehensive validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Email format is invalid' }
  }

  // Check for common typos in domains
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'live.com', 'msn.com', 'aol.com', 'icloud.com'
  ]

  const domain = email.split('@')[1]?.toLowerCase()

  // Check for common typos
  const typoMap: { [key: string]: string } = {
    'gmai.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'hotmai.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
  }

  if (domain && typoMap[domain]) {
    return {
      isValid: false,
      error: `Did you mean ${email.replace(domain, typoMap[domain])}?`
    }
  }

  // Check minimum length
  if (email.length < 5) {
    return { isValid: false, error: 'Email is too short' }
  }

  // Check maximum length
  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long' }
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    return { isValid: false, error: 'Email cannot contain consecutive dots' }
  }

  // Check local part length (before @)
  const localPart = email.split('@')[0]
  if (localPart.length > 64) {
    return { isValid: false, error: 'Email local part is too long' }
  }

  return { isValid: true }
}

const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({
    className,
    onValidationChange,
    showValidationIcon = true,
    realTimeValidation = true,
    onChange,
    onBlur,
    ...props
  }, ref) => {
    const [validationState, setValidationState] = React.useState<{
      isValid: boolean
      error?: string
      hasBeenValidated: boolean
    }>({
      isValid: false,
      hasBeenValidated: false
    })

    const [value, setValue] = React.useState('')

    const performValidation = React.useCallback((email: string, hasBlurred: boolean = false) => {
      const validation = validateEmail(email)
      const newState = {
        ...validation,
        hasBeenValidated: hasBlurred || validation.isValid || email.length > 0
      }

      setValidationState(newState)
      onValidationChange?.(validation.isValid, validation.error)

      return validation
    }, [onValidationChange])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)

      if (realTimeValidation) {
        performValidation(newValue)
      }

      onChange?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      performValidation(e.target.value, true)
      onBlur?.(e)
    }

    const getValidationIcon = () => {
      if (!showValidationIcon || !validationState.hasBeenValidated) {
        return <Mail className="h-4 w-4 text-muted-foreground" />
      }

      if (validationState.isValid) {
        return <CheckCircle className="h-4 w-4 text-green-500" />
      }

      return <AlertCircle className="h-4 w-4 text-red-500" />
    }

    const getInputClasses = () => {
      let classes = "pl-10 pr-4"

      if (validationState.hasBeenValidated) {
        if (validationState.isValid) {
          classes += " border-green-500 focus:border-green-500 focus:ring-green-500"
        } else {
          classes += " border-red-500 focus:border-red-500 focus:ring-red-500"
        }
      }

      return classes
    }

    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {getValidationIcon()}
        </div>
        <Input
          ref={ref}
          type="email"
          autoComplete="email"
          spellCheck="false"
          autoCapitalize="none"
          className={cn(getInputClasses(), className)}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
        {validationState.hasBeenValidated && validationState.error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="text-xs text-red-500 bg-white px-1 rounded shadow-sm border max-w-[200px] truncate">
              {validationState.error}
            </div>
          </div>
        )}
      </div>
    )
  }
)

EmailInput.displayName = "EmailInput"

// Hook for email validation
export const useEmailValidation = () => {
  const [isValid, setIsValid] = React.useState(false)
  const [error, setError] = React.useState<string>()

  const handleValidationChange = React.useCallback((valid: boolean, errorMessage?: string) => {
    setIsValid(valid)
    setError(errorMessage)
  }, [])

  return {
    isValid,
    error,
    handleValidationChange,
  }
}

export { EmailInput, validateEmail }