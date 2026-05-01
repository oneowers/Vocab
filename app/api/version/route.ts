import { NextResponse } from "next/server"

// In a real production build, this would be injected by CI/CD
// For now, we use a simple timestamp or a hash
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || "v1.0.0-initial"

export async function GET() {
  return NextResponse.json({ 
    version: BUILD_ID,
    timestamp: new Date().toISOString()
  })
}
