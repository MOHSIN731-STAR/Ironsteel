import { prisma } from '../././././../lib/prisma'
import bcrypt from 'bcrypt'
import { NextResponse } from 'next/server'


export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    return NextResponse.json(user)

  } catch (error: any) {
    console.log("REGISTER ERROR:", error)

    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    )
  }
}