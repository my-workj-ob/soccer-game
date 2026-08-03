import { auth } from '@/lib/server/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import { NextRequest, NextResponse } from 'next/server'

const { GET: AuthGET, POST: AuthPOST } = toNextJsHandler(auth.handler)

// Wrap handlers to add CORS headers
export async function GET(request: NextRequest) {
  const response = await AuthGET(request)
  
  // Add CORS headers for localhost
  const origin = request.headers.get('origin')
  if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  
  return response
}

export async function POST(request: NextRequest) {
  const response = await AuthPOST(request)
  
  // Add CORS headers for localhost
  const origin = request.headers.get('origin')
  if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  
  return response
}
