import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'adam7awash@gmail.com'
const ADMIN_PASSWORD = '7awash@)!!'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true })
    }

    if (email !== ADMIN_EMAIL && password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid email and password' }, { status: 401 })
    }

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
