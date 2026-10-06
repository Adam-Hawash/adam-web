'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2, Globe, Loader2, Settings, FolderOpen, Sun, Moon, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useLang } from '@/lib/language-context'
import { useTheme } from 'next-themes'

interface Project {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  url: string
  imageUrl: string
}

// رفع الصور على أجزاء — كل جزء قصاد بعضه لحد ما الصورة تكتمل على السيرفر
const CHUNK_SIZE = 2_400_000 // عدد حروف base64 في الريكويست الواحد

async function uploadImageFile(file: File, onProgress: (pct: number) => void): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
  const b64 = dataUrl.split(',')[1] || ''
  const totalChunks = Math.max(1, Math.ceil(b64.length / CHUNK_SIZE))
  let uploadId = ''
  let finalUrl = ''
  for (let i = 0; i < totalChunks; i++) {
    const piece = b64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: uploadId || undefined,
        mime: file.type || 'image/png',
        chunkIndex: i,
        totalChunks,
        data: piece,
      }),
    })
    if (!res.ok) throw new Error('upload failed')
    const json = await res.json()
    uploadId = json.id
    finalUrl = json.url
    onProgress(Math.round(((i + 1) / totalChunks) * 100))
  }
  return finalUrl
}

const DEFAULT_SETTINGS: Record<string, string> = {
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

// حقل صورة موحّد: رفع من الجهاز + معاينة بالمقاس الحقيقي + رابط اختياري
function ImageUploadField({ value, onChange, label, onError }: {
  value: string
  onChange: (url: string) => void
  label: string
  onError: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [pct, setPct] = useState(0)
  const { t } = useLang()

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return
    setBusy(true)
    setPct(0)
    try {
      const url = await uploadImageFile(file, setPct)
      onChange(url)
    } catch {
      onError()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.currentTarget.value = ''
        }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="gold-border cursor-pointer gap-2 min-h-[44px]"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? `${t('admin.uploading')} ${pct}%` : value ? t('admin.changeImage') : t('admin.uploadImage')}
        </Button>
        {value && !busy && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange('')}
            className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
          >
            {t('admin.cancel')}
          </Button>
        )}
      </div>
      {busy && (
        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
          <div className="h-full bg-gold transition-all duration-200" style={{ width: `${pct}%` }} />
        </div>
      )}
      {value && !busy && (
        <div className="border border-border rounded-lg bg-background/40 p-3 flex justify-center">
          <img src={value} alt={label} className="max-w-full max-h-48 w-auto h-auto object-contain" />
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t('admin.imageHint')}</p>
      <div>
        <Label className="text-xs text-muted-foreground">{t('admin.orImageLink')}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 bg-background gold-border"
          placeholder="https://…"
        />
      </div>
    </div>
  )
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'settings' | 'projects'>('settings')
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', titleAr: '', description: '', descriptionAr: '', url: '', imageUrl: '' })
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({ ...DEFAULT_SETTINGS })
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { lang, toggleLang, t, dir } = useLang()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  useEffect(() => { setMounted(true) }, [])

  // قفل سكرول الصفحة اللي ورا اللوحة
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const fetchData = useCallback(() => {
    Promise.all([
      fetch('/api/settings').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([s, p]) => {
      setSiteSettings(prev => ({ ...prev, ...s }))
      setProjects(Array.isArray(p) ? p : [])
    }).catch(() => {})
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const saveSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings),
      })
      if (res.ok) toast({ title: t('admin.settingsSaved') })
    } catch { /* silent */ } finally { setLoading(false) }
  }

  const resetForm = () => {
    setForm({ title: '', titleAr: '', description: '', descriptionAr: '', url: '', imageUrl: '' })
    setEditId(null)
    setShowForm(false)
  }

  const editProject = (p: Project) => {
    setForm({ title: p.title, titleAr: p.titleAr, description: p.description, descriptionAr: p.descriptionAr, url: p.url, imageUrl: p.imageUrl })
    setEditId(p.id)
    setShowForm(true)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submitProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, editId }),
      })
      if (res.ok) {
        toast({ title: t('admin.saved') })
        fetchData()
        resetForm()
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }

  const deleteProject = async (id: string) => {
    if (!window.confirm(t('admin.deleteConfirm'))) return
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: t('admin.deleted') })
        fetchData()
      }
    } catch { /* silent */ }
  }

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const us = useCallback((key: string, val: string) => {
    setSiteSettings(prev => ({ ...prev, [key]: val }))
  }, [])

  if (!mounted) return null

  const uploadError = () => toast({ title: t('admin.uploadFailed') })

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto" dir={dir}>
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors cursor-pointer">
            <X className="w-4 h-4" />{t('admin.backToSite')}
          </button>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-surface">
              <Globe className="w-3.5 h-3.5" />{lang === 'en' ? 'العربية' : 'English'}
            </button>
            <button onClick={toggleTheme} className="text-muted-foreground hover:text-gold transition-colors cursor-pointer p-1.5 rounded-md hover:bg-surface">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-8 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8">
            <Button variant={tab === 'settings' ? 'default' : 'outline'} onClick={() => setTab('settings')} className={`gap-2 cursor-pointer ${tab === 'settings' ? 'bg-gold hover:bg-gold-dark text-background' : 'gold-border'}`}>
              <Settings className="w-4 h-4" />{t('admin.settingsTab')}
            </Button>
            <Button variant={tab === 'projects' ? 'default' : 'outline'} onClick={() => setTab('projects')} className={`gap-2 cursor-pointer ${tab === 'projects' ? 'bg-gold hover:bg-gold-dark text-background' : 'gold-border'}`}>
              <FolderOpen className="w-4 h-4" />{t('admin.projectsTab')}
            </Button>
          </div>

          {/* ===== SETTINGS TAB ===== */}
          {tab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Brand */}
              <Card className="gold-border bg-surface"><CardContent className="p-6 space-y-4">
                <h3 className="text-base font-semibold text-foreground">{t('admin.brandNameEn')} / {t('admin.brandNameAr')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>{t('admin.brandNameEn')}</Label><Input value={siteSettings.brand_name_en || ''} onChange={e => us('brand_name_en', e.target.value)} className="mt-1.5 bg-background gold-border" /></div>
                  <div><Label>{t('admin.brandNameAr')}</Label><Input value={siteSettings.brand_name_ar || ''} onChange={e => us('brand_name_ar', e.target.value)} className="mt-1.5 bg-background gold-border" dir="rtl" /></div>
                </div>
              </CardContent></Card>

              {/* Brand Sub */}
              <Card className="gold-border bg-surface"><CardContent className="p-6 space-y-4">
                <h3 className="text-base font-semibold text-foreground">{t('admin.brandSubEn')} / {t('admin.brandSubAr')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>{t('admin.brandSubEn')}</Label><Input value={siteSettings.brand_sub_en || ''} onChange={e => us('brand_sub_en', e.target.value)} className="mt-1.5 bg-background gold-border" /></div>
                  <div><Label>{t('admin.brandSubAr')}</Label><Input value={siteSettings.brand_sub_ar || ''} onChange={e => us('brand_sub_ar', e.target.value)} className="mt-1.5 bg-background gold-border" dir="rtl" /></div>
                </div>
              </CardContent></Card>

              {/* Hero Subtitle */}
              <Card className="gold-border bg-surface"><CardContent className="p-6 space-y-4">
                <h3 className="text-base font-semibold text-foreground">{t('admin.heroSubtitleEn')} / {t('admin.heroSubtitleAr')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>{t('admin.heroSubtitleEn')}</Label><Textarea value={siteSettings.hero_subtitle_en || ''} onChange={e => us('hero_subtitle_en', e.target.value)} className="mt-1.5 bg-background gold-border min-h-[80px]" /></div>
                  <div><Label>{t('admin.heroSubtitleAr')}</Label><Textarea value={siteSettings.hero_subtitle_ar || ''} onChange={e => us('hero_subtitle_ar', e.target.value)} className="mt-1.5 bg-background gold-border min-h-[80px]" dir="rtl" /></div>
                </div>
              </CardContent></Card>

              {/* Projects Section Text */}
              <Card className="gold-border bg-surface"><CardContent className="p-6 space-y-4">
                <h3 className="text-base font-semibold text-foreground">{t('admin.projTitleEn')} / {t('admin.projTitleAr')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>{t('admin.projTitleEn')}</Label><Input value={siteSettings.projects_title_en || ''} onChange={e => us('projects_title_en', e.target.value)} className="mt-1.5 bg-background gold-border" /></div>
                  <div><Label>{t('admin.projTitleAr')}</Label><Input value={siteSettings.projects_title_ar || ''} onChange={e => us('projects_title_ar', e.target.value)} className="mt-1.5 bg-background gold-border" dir="rtl" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>{t('admin.projSubEn')}</Label><Textarea value={siteSettings.projects_subtitle_en || ''} onChange={e => us('projects_subtitle_en', e.target.value)} className="mt-1.5 bg-background gold-border min-h-[80px]" /></div>
                  <div><Label>{t('admin.projSubAr')}</Label><Textarea value={siteSettings.projects_subtitle_ar || ''} onChange={e => us('projects_subtitle_ar', e.target.value)} className="mt-1.5 bg-background gold-border min-h-[80px]" dir="rtl" /></div>
                </div>
              </CardContent></Card>

              {/* Footer */}
              <Card className="gold-border bg-surface"><CardContent className="p-6 space-y-4">
                <h3 className="text-base font-semibold text-foreground">Footer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Footer (English)</Label><Input value={siteSettings.footer_en || ''} onChange={e => us('footer_en', e.target.value)} className="mt-1.5 bg-background gold-border" /></div>
                  <div><Label>Footer (Arabic)</Label><Input value={siteSettings.footer_ar || ''} onChange={e => us('footer_ar', e.target.value)} className="mt-1.5 bg-background gold-border" dir="rtl" /></div>
                </div>
              </CardContent></Card>

              {/* Profile Image & Contact */}
              <Card className="gold-border bg-surface"><CardContent className="p-6 space-y-4">
                <h3 className="text-base font-semibold text-foreground">{t('admin.profileImage')} & Contact</h3>
                <ImageUploadField
                  label={t('admin.profileImage')}
                  value={siteSettings.profile_image_url || ''}
                  onChange={(v) => us('profile_image_url', v)}
                  onError={uploadError}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>{t('admin.whatsappLink')}</Label><Input value={siteSettings.whatsapp_link || ''} onChange={e => us('whatsapp_link', e.target.value)} className="mt-1.5 bg-background gold-border" /></div>
                  <div><Label>{t('admin.emailAddr')}</Label><Input value={siteSettings.email_address || ''} onChange={e => us('email_address', e.target.value)} className="mt-1.5 bg-background gold-border" /></div>
                </div>
              </CardContent></Card>

              <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={loading} className="bg-gold hover:bg-gold-dark text-background font-semibold cursor-pointer px-8">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{t('admin.save')}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ===== PROJECTS TAB ===== */}
          {tab === 'projects' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gold-text-gradient">{t('admin.projectsTab')}</h2>
                <Button onClick={() => { resetForm(); setShowForm(true) }} className="gap-2 bg-gold hover:bg-gold-dark text-background font-semibold cursor-pointer">
                  <Plus className="w-4 h-4" />{t('admin.addProject')}
                </Button>
              </div>

              {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                  <Card className="gold-border bg-surface">
                    <CardContent className="p-6">
                      <h3 className="text-base font-semibold mb-6 text-foreground">{editId ? t('admin.editProject') : t('admin.addProject')}</h3>
                      <form onSubmit={submitProject} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div><Label>{t('admin.projectTitle')} *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1.5 bg-background gold-border" required /></div>
                          <div><Label>{t('admin.projectTitleAr')}</Label><Input value={form.titleAr} onChange={e => setForm({ ...form, titleAr: e.target.value })} className="mt-1.5 bg-background gold-border" dir="rtl" /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div><Label>{t('admin.projectDesc')} *</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1.5 bg-background gold-border min-h-[80px]" required /></div>
                          <div><Label>{t('admin.projectDescAr')}</Label><Textarea value={form.descriptionAr} onChange={e => setForm({ ...form, descriptionAr: e.target.value })} className="mt-1.5 bg-background gold-border min-h-[80px]" dir="rtl" /></div>
                        </div>
                        <div><Label>{t('admin.projectUrl')} *</Label><Input type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="mt-1.5 bg-background gold-border" required /></div>
                        <div>
                          <Label>{t('admin.projectImage')}</Label>
                          <div className="mt-2">
                            <ImageUploadField
                              label={t('admin.projectImage')}
                              value={form.imageUrl}
                              onChange={(v) => setForm({ ...form, imageUrl: v })}
                              onError={uploadError}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <Button type="submit" disabled={loading} className="bg-gold hover:bg-gold-dark text-background font-semibold cursor-pointer">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{t('admin.save')}
                          </Button>
                          <Button type="button" variant="outline" onClick={resetForm} className="gold-border cursor-pointer">{t('admin.cancel')}</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {projects.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground"><p className="text-lg">{t('admin.noProjects')}</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map(p => (
                    <Card key={p.id} className="gold-border bg-surface overflow-hidden">
                      {p.imageUrl && (
                        <div className="bg-background/40 border-b border-border/50 p-2 flex justify-center">
                          <img src={p.imageUrl} alt={p.title} loading="lazy" className="max-w-full max-h-40 w-auto h-auto object-contain" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                        {p.titleAr && <p className="text-sm text-muted-foreground mb-1" dir="rtl">{p.titleAr}</p>}
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => editProject(p)} className="flex-1 text-xs cursor-pointer gold-border">{t('admin.editProject')}</Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteProject(p.id)} className="text-xs text-destructive hover:text-destructive cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
