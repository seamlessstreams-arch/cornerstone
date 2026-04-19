import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { resolveAuthenticatedActor } from '@/lib/auth/actor-server'
import { getRequestId, jsonWithRequestId, jsonWithRequestIdHeader } from '@/lib/http/request-id'

function validationError(message: string, requestId: string, status = 400) {
  return jsonWithRequestId({ error: message }, requestId, status)
}

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  try {
    const { actor, error } = await resolveAuthenticatedActor(request)

    if (!actor) {
      return validationError(error ?? 'Authentication required.', requestId, 401)
    }

    const body = await request.json()
    const { mode, style, content, recordType, recordId } = body

    let prompt = `You are Aria, a workflow-aware AI assistant for a children's residential home management system. Always comply with CHR 2015 regulations and the 9 quality standards for children's homes. `

    if (mode === 'Write') {
      prompt += `Write the following content in ${style} style, ensuring it meets regulatory requirements: ${content}`
    } else if (mode === 'Review') {
      prompt += `Review this ${recordType} for compliance with CHR 2015 and quality standards: ${content}. Identify missing details, weak wording, inconsistencies, safeguarding concerns.`
    } else if (mode === 'Oversee') {
      prompt += `Draft management oversight for this ${recordType}, grounded in real data, including strengths, concerns, actions, next steps, complying with regulations: ${content}`
    } else if (mode === 'Assist') {
      prompt += `Provide proactive support suggestions for this ${recordType}: ${content}`
    }

    if (!openai) {
      return validationError('AI service is not available.', requestId, 503)
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    })

    const suggestion = response.choices[0].message.content ?? ''

    await prisma.ariaSuggestion.create({
      data: {
        recordId,
        recordType,
        suggestion,
        style,
        accepted: false
      }
    })

    return jsonWithRequestIdHeader({ suggestion }, requestId)
  } catch (error) {
    console.error({ requestId, error })
    return jsonWithRequestId({ error: 'Failed to generate suggestion' }, requestId, 500)
  }
}