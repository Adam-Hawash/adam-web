import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const FALLBACK_SETTINGS: Record<string, string> = {
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

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany()
    const map: Record<string, string> = { ...FALLBACK_SETTINGS }
    for (const s of settings) {
      map[s.key] = s.value
    }
    return NextResponse.json(map)
  } catch {
    return NextResponse.json(FALLBACK_SETTINGS)
  }
}

export async function PUT(request: Request) {
  try {
    const body: Record<string, string> = await request.json()

    for (const [key, value] of Object.entries(body)) {
      await db.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }

    const settings = await db.siteSetting.findMany()
    const map: Record<string, string> = { ...FALLBACK_SETTINGS }
    for (const s of settings) {
      map[s.key] = s.value
    }
    return NextResponse.json(map)
  } catch {
    return NextResponse.json(FALLBACK_SETTINGS)
  }
}
