import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

// رفع الصور على شكل أجزاء (chunks) عشان نتفادى حد حجم الريكويست في Vercel
// الجسم: { id?, mime, chunkIndex, totalChunks, data } — data عبارة عن base64
// الرفع بيتم بالترتيب، وكل جزء بيتزود على اللي قبله في نفس الصف

// إنشاء ذاتي لجدول الصور لو مش موجود (ترميم ذاتي)
async function ensureMediaTable() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Media" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "mime" TEXT NOT NULL DEFAULT 'image/png',
      "size" INTEGER NOT NULL DEFAULT 0,
      "chunks" INTEGER NOT NULL DEFAULT 1,
      "received" INTEGER NOT NULL DEFAULT 0,
      "data" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    );
  `)
}

export async function POST(request: Request) {
  try {
    await ensureMediaTable()

    const body = await request.json()
    const { id, mime, chunkIndex, totalChunks, data } = body as {
      id?: string
      mime?: string
      chunkIndex?: number
      totalChunks?: number
      data?: string
    }

    if (
      typeof chunkIndex !== 'number' ||
      typeof totalChunks !== 'number' ||
      totalChunks < 1 ||
      chunkIndex < 0 ||
      chunkIndex >= totalChunks ||
      typeof data !== 'string' ||
      data.length === 0 ||
      data.length > 4_200_000
    ) {
      return NextResponse.json({ error: 'Invalid upload payload' }, { status: 400 })
    }

    const safeMime = typeof mime === 'string' && mime.startsWith('image/') ? mime : 'image/png'

    // أول جزء: نعمل صف جديد
    if (chunkIndex === 0) {
      const newId = randomUUID()
      const isDone = totalChunks === 1
      await db.$executeRawUnsafe(
        `INSERT INTO "Media" ("id", "mime", "size", "chunks", "received", "data", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        newId,
        safeMime,
        Math.round((data.length * 3) / 4),
        totalChunks,
        1,
        data
      )
      if (isDone) {
        return NextResponse.json({ id: newId, url: `/api/images/${newId}`, done: true })
      }
      return NextResponse.json({ id: newId, received: 1, totalChunks })
    }

    // باقي الأجزاء: لازم يكون فيه صف موجود والترتيب صحيح
    if (!id) {
      return NextResponse.json({ error: 'Missing upload id' }, { status: 400 })
    }

    const updated = await db.$executeRawUnsafe(
      `UPDATE "Media"
       SET "data" = "data" || $1,
           "received" = "received" + 1,
           "size" = "size" + $2,
           "updatedAt" = NOW()
       WHERE "id" = $3 AND "received" = $4`,
      data,
      Math.round((data.length * 3) / 4),
      id,
      chunkIndex
    )

    if (updated === 0) {
      return NextResponse.json({ error: 'Upload session not found or out of order' }, { status: 409 })
    }

    if (chunkIndex === totalChunks - 1) {
      return NextResponse.json({ id, url: `/api/images/${id}`, done: true })
    }

    return NextResponse.json({ id, received: chunkIndex + 1, totalChunks })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
