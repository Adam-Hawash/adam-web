'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Phone, Mail, ExternalLink, Menu, X, Globe, Sun, Moon, Loader2, Ruler, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTheme } from 'next-themes'
import { useLang } from '@/lib/language-context'

const AdminPanel = dynamic(() => import('@/components/admin-panel'))

interface Project {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  url: string
  imageUrl: string
}

interface SiteSettings {
  brand_name_en: string
  brand_name_ar: string
  brand_sub_en: string
  brand_sub_ar: string
  hero_subtitle_en: string
  hero_subtitle_ar: string
  projects_title_en: string
  projects_title_ar: string
  projects_subtitle_en: string
  projects_subtitle_ar: string
  profile_image_url: string
  whatsapp_link: string
  email_address: string
  footer_en: string
  footer_ar: string
}

const FALLBACK: SiteSettings = {
  brand_name_en: 'Prime Developer',
  brand_name_ar: 'Prime Developer',
  brand_sub_en: 'Built & Managed by Adam Hawash',
  brand_sub_ar: 'صمم وأدار بواسطة آدم حواش',
  hero_subtitle_en: 'Crafting digital experiences with precision and passion. Building solutions that make a difference.',
  hero_subtitle_ar: 'صناعة تجارب رقمية بدقة وشغف. بناء حلول تصنع الفرق.',
  projects_title_en: 'Projects',
  projects_title_ar: 'المشاريع',
  projects_subtitle_en: 'A curated collection of work, showcasing innovative solutions and creative digital products.',
  projects_subtitle_ar: 'مجموعة منتقاة من الأعمال، تعرض حلولاً مبتكرة ومنتجات رقمية إبداعية.',
  profile_image_url: '/profile.png',
  whatsapp_link: 'https://wa.me/201285055402',
  email_address: 'adam7awash@gmail.com',
  footer_en: '© 2026 Adam Hawash. All rights reserved.',
  footer_ar: '© 2026 آدم حواش. جميع الحقوق محفوظة.',
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  // الدخول السري للوحة الأدمن
  const [showLogin, setShowLogin] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const tapCountRef = useRef(0)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { lang, toggleLang, t, dir } = useLang()
  const { theme, setTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  useEffect(() => {
    const controller = new AbortController()
    setDataLoading(true)

    // Wake up the database first
    fetch('/api/settings', { signal: controller.signal })
      .then(r => r.json())
      .then(s => { setSettings(prev => ({ ...prev, ...s })) })
      .catch(() => {})

    // Then load everything
    Promise.all([
      fetch('/api/settings', { signal: controller.signal }).then(r => r.json()),
      fetch('/api/projects', { signal: controller.signal }).then(r => r.json()),
    ]).then(([s, p]) => {
      setSettings(prev => ({ ...prev, ...s }))
      setProjects(Array.isArray(p) ? p : [])
    }).catch(() => {}).finally(() => setDataLoading(false))

    return () => controller.abort()
  }, [])

  const sv = useCallback((en: keyof SiteSettings, ar: keyof SiteSettings) => {
    return lang === 'ar' ? (settings[ar] || '') : (settings[en] || '')
  }, [lang, settings])

  const pTitle = useCallback((p: Project) => lang === 'ar' && p.titleAr ? p.titleAr : p.title, [lang])
  const pDesc = useCallback((p: Project) => lang === 'ar' && p.descriptionAr ? p.descriptionAr : p.description, [lang])

  const wa = settings.whatsapp_link || FALLBACK.whatsapp_link
  const em = settings.email_address || FALLBACK.email_address
  const img = settings.profile_image_url || FALLBACK.profile_image_url

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  // الطريقة السرية: 7 ضغطات على زرار المسطرة أو 7 تابات على الشاشة تفتح لوحة الدخول
  const triggerSecret = useCallback(() => {
    tapCountRef.current += 1
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0 }, 3500)
    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0
      if (tapTimerRef.current) { clearTimeout(tapTimerRef.current); tapTimerRef.current = null }
      setLoginError('')
      setShowLogin(true)
    }
  }, [])

  useEffect(() => {
    if (showLogin || showAdmin) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target && target.closest('a, button, input, textarea, select, label, form, nav, [role="button"]')) return
      triggerSecret()
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showLogin, showAdmin, triggerSecret])

  const handleSecretLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        setShowLogin(false)
        setEmail('')
        setPassword('')
        setShowAdmin(true)
      } else {
        setLoginError(t('admin.wrongPassword'))
      }
    } catch {
      setLoginError(t('admin.wrongPassword'))
    } finally {
      setLoginLoading(false)
    }
  }

  if (!mounted) { return <div className="min-h-screen bg-background" /> }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#" className="gold-text-gradient text-xl font-bold tracking-tight">{sv('brand_name_en', 'brand_name_ar')}</a>
          <div className="hidden md:flex items-center gap-5">
            <a href="#projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.projects')}</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.contact')}</a>
            <button onClick={toggleLang} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-surface">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
            <button onClick={toggleTheme} className="text-muted-foreground hover:text-gold transition-colors cursor-pointer p-1.5 rounded-md hover:bg-surface" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
            <div className="px-4 py-4 flex flex-col gap-3">
              <a href="#projects" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-2">{t('nav.projects')}</a>
              <a href="#contact" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-2">{t('nav.contact')}</a>
              <button onClick={() => { toggleLang(); setMobileOpen(false) }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold py-2 cursor-pointer">
                <Globe className="w-3.5 h-3.5" />{lang === 'en' ? 'العربية' : 'English'}
              </button>
              <button onClick={() => { toggleTheme(); setMobileOpen(false) }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold py-2 cursor-pointer">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? (lang === 'ar' ? 'وضع نهاري' : 'Light Mode') : (lang === 'ar' ? 'وضع ليلي' : 'Dark Mode')}
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="hero-bg pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden gold-border gold-glow">
                <Image
                  src={img}
                  alt="Adam Hawash"
                  width={160}
                  height={160}
                  priority
                  loading="eager"
                  className="w-full h-full object-cover"
                  unoptimized={img.startsWith('http')}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                <span className="text-background text-xs font-bold">AH</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3">
              <span className="gold-text-gradient">{sv('brand_name_en', 'brand_name_ar')}</span>
            </h1>
            <p className="text-base sm:text-lg text-gold/70 font-medium mb-4">{sv('brand_sub_en', 'brand_sub_ar')}</p>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">{sv('hero_subtitle_en', 'hero_subtitle_ar')}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} id="contact" className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 bg-gold hover:bg-gold-dark text-background font-semibold px-8 py-6 text-base cursor-pointer transition-all hover:shadow-[0_0_30px_oklch(0.75_0.18_85/30%)]">
                <Phone className="w-5 h-5" />{t('hero.whatsapp')}
              </Button>
            </a>
            <a href={`mailto:${em}`}>
              <Button size="lg" variant="outline" className="gap-2 gold-border text-foreground hover:bg-surface hover:text-gold font-semibold px-8 py-6 text-base cursor-pointer transition-all">
                <Mail className="w-5 h-5" />{t('hero.email')}
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6"><div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" /></div>

      {/* Projects */}
      <section id="projects" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4"><span className="gold-text-gradient">{sv('projects_title_en', 'projects_title_ar')}</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{sv('projects_subtitle_en', 'projects_subtitle_ar')}</p>
          </motion.div>

          {/* Loading State */}
          {dataLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
              <p className="text-muted-foreground text-sm">Loading projects...</p>
            </div>
          )}

          {/* Projects Grid */}
          {!dataLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                  <Card className="project-card gold-border bg-surface overflow-hidden group h-full flex flex-col">
                    {p.imageUrl ? (
                      <div className="relative">
                        {/* الصورة بمقاسها الحقيقي — بدون قص ولا تكبير */}
                        <img
                          src={p.imageUrl}
                          alt={pTitle(p)}
                          loading={i < 3 ? 'eager' : 'lazy'}
                          className="block w-full h-auto"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface to-transparent opacity-40 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-gold/10 to-transparent flex items-center justify-center">
                        <span className="text-3xl font-bold gold-text-gradient">{pTitle(p).charAt(0)}</span>
                      </div>
                    )}
                    <CardContent className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-gold transition-colors">{pTitle(p)}</h3>
                      <p className="text-muted-foreground text-sm mb-4 flex-1 leading-relaxed">{pDesc(p)}</p>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-light transition-colors font-medium">
                        {t('projects.viewProject')}<ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {!dataLoading && projects.length === 0 && <div className="text-center py-16 text-muted-foreground"><p className="text-lg">{t('projects.empty')}</p></div>}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{sv('footer_en', 'footer_ar')}</p>
            <div className="flex items-center gap-4">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-gold transition-colors" aria-label="WhatsApp"><Phone className="w-4 h-4" /></a>
              <a href={`mailto:${em}`} className="text-muted-foreground hover:text-gold transition-colors" aria-label="Email"><Mail className="w-4 h-4" /></a>
              {/* زرار المسطرة — 7 ضغطات عليه يفتح لوحة الدخول */}
              <button onClick={triggerSecret} aria-hidden="true" tabIndex={-1} className="text-muted-foreground/50 hover:text-gold transition-colors p-1 cursor-pointer">
                <Ruler className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* لوحة دخول الأدمن السرية */}
      {showLogin && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogin(false) }}
        >
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <Card className="gold-border bg-surface">
              <CardContent className="p-8 relative">
                <button
                  onClick={() => setShowLogin(false)}
                  className="absolute top-4 end-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full gold-border gold-glow mx-auto mb-4 overflow-hidden">
                    <Image src="/profile.png" alt="Admin" width={56} height={56} priority className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-2xl font-bold gold-text-gradient mb-1">{t('admin.loginTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{t('brand')}</p>
                </div>
                <form onSubmit={handleSecretLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="em">{t('admin.email')}</Label>
                    <Input id="em" type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 bg-background gold-border" autoComplete="username" required />
                  </div>
                  <div>
                    <Label htmlFor="pw">{t('admin.password')}</Label>
                    <div className="relative mt-1.5">
                      <Input id="pw" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="bg-background gold-border pr-10" autoComplete="current-password" required />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginError && <p className="text-destructive text-xs mt-1.5">{loginError}</p>}
                  </div>
                  <Button type="submit" disabled={loginLoading} className="w-full bg-gold hover:bg-gold-dark text-background font-semibold cursor-pointer">
                    {loginLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t('admin.loginBtn')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* لوحة الأدمن بعد نجاح الدخول */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  )
}
