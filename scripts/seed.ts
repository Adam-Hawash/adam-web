import { db } from '../src/lib/db'

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

async function seed() {
  console.log('Seeding site settings...')
  for (const setting of defaultSettings) {
    await db.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log('✓ Site settings seeded')

  console.log('Seeding sample project...')
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
    console.log('✓ Emy Medical Tourism project seeded')
  } else {
    console.log('✓ Emy Medical Tourism project already exists')
  }

  console.log('\n✅ All done!')
}

seed().catch(console.error)
