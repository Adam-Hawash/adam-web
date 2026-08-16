import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(projects)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { editId, title, titleAr, description, descriptionAr, url, imageUrl } = body

    if (!title || !description || !url) {
      return NextResponse.json(
        { error: 'Title, description, and URL are required' },
        { status: 400 }
      )
    }

    if (editId) {
      const project = await db.project.update({
        where: { id: editId },
        data: {
          title,
          titleAr: titleAr || '',
          description,
          descriptionAr: descriptionAr || '',
          url,
          imageUrl: imageUrl || '',
        },
      })
      return NextResponse.json(project)
    }

    const project = await db.project.create({
      data: {
        title,
        titleAr: titleAr || '',
        description,
        descriptionAr: descriptionAr || '',
        url,
        imageUrl: imageUrl || '',
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 })
  }
}
