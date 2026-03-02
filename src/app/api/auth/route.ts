// NextAuth handles /api/auth/* via [...nextauth]. This file exists so Next.js type validator sees a module.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Use /api/auth/signin or other NextAuth routes" }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: "Use /api/auth/signin or other NextAuth routes" }, { status: 404 });
}
