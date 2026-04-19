import { NextRequest, NextResponse } from 'next/server'

export function getRequestId(request: NextRequest): string {
  return request.headers.get('x-request-id') ?? crypto.randomUUID()
}

export function jsonWithRequestId(payload: Record<string, unknown>, requestId: string, status = 200) {
  return NextResponse.json(
    {
      ...payload,
      requestId
    },
    {
      status,
      headers: {
        'x-request-id': requestId
      }
    }
  )
}

export function jsonWithRequestIdHeader(payload: unknown, requestId: string, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      'x-request-id': requestId
    }
  })
}
