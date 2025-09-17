# TKPay Landing Page

A modern, mobile-first landing page for TKPay built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components.

## 🚀 Features

- **Modern Design**: Glassmorphic cards with soft neumorphic shadows
- **Mobile-First**: Responsive design optimized for mobile devices
- **Internationalization**: Support for French, Arabic (RTL), and English
- **Accessibility**: WCAG-AA compliant with semantic HTML and proper ARIA labels
- **Performance**: Optimized for mobile Lighthouse scores ≥85
- **Contact Form**: Validation with country code selection and form handling
- **SEO Optimized**: Meta tags, structured data, and sitemap ready

## 🛠 Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **next-i18next** - Internationalization
- **react-hook-form** - Form handling and validation
- **Lucide React** - Beautiful icons

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌍 Language Support

The app supports three languages:

- **French** (default): `/`
- **Arabic** (RTL): `/ar`
- **English**: `/en`

Language switcher is available in the navigation bar.

## 📱 Sections

1. **Hero** - Modern headline with CTA button
2. **Solutions** - Three main services:
   - POS Terminals
   - Payment Account & Prepaid Card
   - E-commerce Payment Module
3. **How It Works** - Simple 3-step process
4. **Contact Form** - Lead capture with validation

## 🎨 Design Features

- **Glassmorphism**: Backdrop blur effects with transparency
- **Soft Neumorphism**: Gentle shadows and depth
- **Mobile-First**: Responsive grid layouts
- **RTL Support**: Complete right-to-left layout for Arabic
- **Smooth Animations**: Hover effects and transitions

## 🏗 Project Structure

```
├── pages/
│   ├── _app.tsx          # App wrapper with i18n
│   ├── _document.tsx     # HTML document structure
│   └── index.tsx         # Main landing page
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui base components
│   │   ├── Hero.tsx     # Hero section
│   │   ├── Solutions.tsx # Solutions cards
│   │   ├── HowItWorks.tsx # Process steps
│   │   ├── ContactForm.tsx # Contact form
│   │   ├── Navigation.tsx # Header navigation
│   │   ├── LanguageSwitcher.tsx # Language selector
│   │   └── Footer.tsx   # Footer
│   ├── lib/
│   │   └── utils.ts     # Utility functions
│   └── styles/
│       └── globals.css  # Global styles
├── public/
│   └── locales/         # Translation files
│       ├── fr/common.json
│       ├── ar/common.json
│       └── en/common.json
└── package.json
```

## 🚀 Build & Deploy

### Build for production:
```bash
npm run build
```

### Start production server:
```bash
npm run start
```

### Type checking:
```bash
npm run type-check
```

### Linting:
```bash
npm run lint
```

## 📈 Performance

The app is optimized for:

- **Mobile Lighthouse Score**: ≥85
- **Core Web Vitals**: Optimized LCP, FID, CLS
- **SEO**: Structured data and meta tags
- **Accessibility**: WCAG-AA compliance

## 🌐 SEO Features

- Multi-language meta tags
- Open Graph and Twitter cards
- Canonical URLs
- Structured data (JSON-LD)
- Sitemap ready
- Proper hreflang attributes

## 📞 Contact Form Features

- Form validation with react-hook-form
- Country code selection for phone numbers
- Interest dropdown (POS/Online/Payment Account)
- Success message handling
- Mobile-optimized inputs

## 🎯 Customization

### Colors
Modify colors in `tailwind.config.js` and `src/styles/globals.css`.

### Content
Update translations in `public/locales/{locale}/common.json`.

### Components
All components are in `src/components/` and use TypeScript with proper props.

## 📄 License

© 2025 TKPay. All rights reserved.