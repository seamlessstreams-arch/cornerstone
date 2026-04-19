import { ensurePlatformContext, Phase3Actor, writeAuditLog } from '@/lib/phase3/platform-context'

// Simple UUID-like ID generator
function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export interface RecruitmentCandidateSummary {
  id: string
  name: string
  email: string
  status: string
  roleApplied: string
  applicationStatus: string
  createdAt: string
}

export interface RecruitmentEvidenceItem {
  id: string
  candidateName: string
  documentType: string
  verificationStatus: string
  verifiedAt: string | null
  verifierMethod: string | null
  notes: string | null
}

export interface RecruitmentDashboard {
  candidates: RecruitmentCandidateSummary[]
  evidence: RecruitmentEvidenceItem[]
  pendingVerifications: number
}

export interface CreateCandidateInput {
  firstName: string
  lastName: string
  email: string
  roleApplied: string
}

export interface AddEvidenceInput {
  applicationId: string
  documentType: string
  fileName: string
  path: string
  checklist: Array<{ key: string; passed: boolean }>
  notes?: string
}

export interface VerifyEvidenceInput {
  documentId: string
  outcome: 'verified' | 'rejected' | 'needs_review'
  method: 'manual' | 'cross-check' | 'third-party'
  notes?: string
}

// Mock data storage (persists during session)
const mockCandidates: Array<{ id: string; firstName: string; lastName: string; email: string; status: string; roleApplied: string; applicationStatus: string; createdAt: string }> = []
const mockApplications: Array<{ id: string; candidateId: string; createdAt: string }> = []
const mockEvidenceItems: Array<{ id: string; candidateName: string; candidateId: string; applicationId: string; documentType: string; verificationStatus: string; verifiedAt: string | null; verifierMethod: string | null; notes: string | null }> = []

export async function listRecruitmentDashboard(actor: Phase3Actor): Promise<RecruitmentDashboard> {
  await ensurePlatformContext(actor)

  const candidates: RecruitmentCandidateSummary[] = mockCandidates.map((candidate) => ({
    id: candidate.id,
    name: `${candidate.firstName} ${candidate.lastName}`,
    email: candidate.email,
    status: candidate.status,
    roleApplied: candidate.roleApplied,
    applicationStatus: candidate.applicationStatus,
    createdAt: candidate.createdAt
  }))

  const evidence: RecruitmentEvidenceItem[] = mockEvidenceItems.map((item) => ({
    id: item.id,
    candidateName: item.candidateName,
    documentType: item.documentType,
    verificationStatus: item.verificationStatus,
    verifiedAt: item.verifiedAt,
    verifierMethod: item.verifierMethod,
    notes: item.notes
  }))

  return {
    candidates,
    evidence,
    pendingVerifications: evidence.filter((item) => item.verificationStatus === 'pending' || item.verificationStatus === 'needs_review').length
  }
}

export async function createCandidate(input: CreateCandidateInput, actor: Phase3Actor) {
  const context = await ensurePlatformContext(actor)

  const candidateId = generateId()
  const applicationId = generateId()
  const now = new Date().toISOString()

  mockCandidates.push({
    id: candidateId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    status: 'new',
    roleApplied: input.roleApplied,
    applicationStatus: 'application_received',
    createdAt: now
  })

  mockApplications.push({
    id: applicationId,
    candidateId,
    createdAt: now
  })

  await writeAuditLog({
    organisationId: context.organisationId,
    homeId: context.homeId,
    platformUserId: context.platformUserId,
    action: 'RECRUITMENT_CANDIDATE_CREATED',
    entityType: 'recruitment_application',
    entityId: applicationId,
    payload: {
      candidateId,
      roleApplied: input.roleApplied
    }
  })

  return {
    candidateId,
    applicationId
  }
}

export async function addEvidence(input: AddEvidenceInput, actor: Phase3Actor) {
  const context = await ensurePlatformContext(actor)

  const documentId = generateId()
  const application = mockApplications.find((item) => item.id === input.applicationId)
  if (!application) {
    throw new Error(`Application with ID ${input.applicationId} not found`)
  }

  const candidate = mockCandidates.find((item) => item.id === application.candidateId)
  if (!candidate) {
    throw new Error(`Candidate linked to application ${input.applicationId} not found`)
  }

  const candidateName = `${candidate.firstName} ${candidate.lastName}`

  mockEvidenceItems.push({
    id: documentId,
    candidateName,
    candidateId: candidate.id,
    applicationId: application.id,
    documentType: input.documentType,
    verificationStatus: 'pending',
    verifiedAt: null,
    verifierMethod: null,
    notes: input.notes ?? null
  })

  await writeAuditLog({
    organisationId: context.organisationId,
    homeId: context.homeId,
    platformUserId: context.platformUserId,
    action: 'RECRUITMENT_EVIDENCE_ADDED',
    entityType: 'recruitment_document',
    entityId: documentId,
    payload: {
      applicationId: input.applicationId,
      documentType: input.documentType
    }
  })

  return {
    documentId,
    verificationTaskId: null
  }
}

export async function verifyEvidence(input: VerifyEvidenceInput, actor: Phase3Actor) {
  const context = await ensurePlatformContext(actor)

  const now = new Date().toISOString()

  // Find and update the evidence item
  const evidenceIndex = mockEvidenceItems.findIndex((item) => item.id === input.documentId)
  if (evidenceIndex === -1) {
    throw new Error(`Evidence with ID ${input.documentId} not found`)
  }

  mockEvidenceItems[evidenceIndex] = {
    ...mockEvidenceItems[evidenceIndex],
    verificationStatus: input.outcome,
    verifiedAt: now,
    verifierMethod: input.method,
    notes: input.notes ?? null
  }

  await writeAuditLog({
    organisationId: context.organisationId,
    homeId: context.homeId,
    platformUserId: context.platformUserId,
    action: 'RECRUITMENT_EVIDENCE_VERIFIED',
    entityType: 'recruitment_document',
    entityId: input.documentId,
    payload: {
      outcome: input.outcome,
      method: input.method
    }
  })

  return {
    verified: true,
    outcome: input.outcome
  }
}

