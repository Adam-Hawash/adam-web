import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// عرض الصور المرفوعة من الداتابيز — كاش دائم لأن محتوى الصورة ثابت
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const media = await db.$queryRawUnsafe<
      { mime: string; chunks: number; received: number; data: string }[]
    >(
      `SELECT "mime", "chunks", "received", "data" FROM "Media" WHERE "id" = $1 LIMIT 1`,
      id
    )

    const row = media?.[0]
    if (!row || row.received < row.chunks || !row.data) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const buffer = Buffer.from(row.data, 'base64')
    return new Response(buffer, {
      headers: {
        'Content-Type': row.mime || 'image/png',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
}
