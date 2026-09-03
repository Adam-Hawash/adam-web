import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const SETUP_TOKEN = '7awash@)!!'

const defaultSettings = [
  { key: 'brand_name_en', value: 'Prime Developer' },
  { key: 'brand_name_ar', value: 'Prime Developer' },
  { key: 'brand_sub_en', value: 'Built & Managed by Adam Hawash' },
  { key: 'brand_sub_ar', value: 'صمم وأدار بواسطة آدم حواش' },
  { key: 'hero_subtitle_en', value: 'Crafting digital experiences with precision and passion. Building solutions that make a difference.' },
  { key: 'hero_subtitle_ar', value: 'صناعة تجارب رقمية بدقة وشغف. بناء حلول تصنع الفرق.' },
  { key: 'projects_title_en', value: 'Projects' },
  { key: 'projects_title_ar', value: 'المشاريع' },
  { key: 'projects_subtitle_en', value: 'A curated collection of work, showcasing innovative solutions and creative digital products.' },
  { key: 'projects_subtitle_ar', value: 'مجموعة منتقاة من الأعمال، تعرض حلولاً مبتكرة ومنتجات رقمية إبداعية.' },
  { key: 'profile_image_url', value: '/profile.png' },
  { key: 'whatsapp_link', value: 'https://wa.me/201285055402' },
  { key: 'email_address', value: 'adam7awash@gmail.com' },
  { key: 'footer_en', value: '© 2026 Adam Hawash. All rights reserved.' },
  { key: 'footer_ar', value: '© 2026 آدم حواش. جميع الحقوق محفوظة.' },
]

async function runSetup() {
  // Create tables using raw SQL (CREATE TABLE IF NOT EXISTS)
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SiteSetting" (
      "key" TEXT NOT NULL PRIMARY KEY,
      "value" TEXT NOT NULL DEFAULT ''
    );
  `)

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Project" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "titleAr" TEXT NOT NULL DEFAULT '',
      "description" TEXT NOT NULL,
      "descriptionAr" TEXT NOT NULL DEFAULT '',
      "url" TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    );
  `)

  // Seed settings
  for (const setting of defaultSettings) {
    await db.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  // Seed sample project
  const existing = await db.project.findFirst({ where: { url: 'https://emy-medical-tourism.com' } })
  if (!existing) {
    await db.project.create({
      data: {
        title: 'Emy Medical Tourism',
        titleAr: 'إيمي للسياحة العلاجية',
        description: 'A specialized medical tourism platform connecting patients with world-class healthcare providers.',
        descriptionAr: 'منصة متخصصة في السياحة العلاجية تربط المرضى بأفضل مقدمي الرعاية الصحية.',
        url: 'https://emy-medical-tourism.com',
        imageUrl: '',
      },
    })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (token !== SETUP_TOKEN) {
      return new NextResponse(
        'Setup endpoint. Use POST or add ?token=YOUR_TOKEN',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    await runSetup()
    return new NextResponse(
      '<h2>✅ Database setup complete!</h2><p>You can close this tab now.</p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Setup failed'
    return new NextResponse(
      `<h2>❌ Error: ${message}</h2>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token } = body

    if (token !== SETUP_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    await runSetup()
    return NextResponse.json({ success: true, message: 'Database setup complete!' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Setup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
