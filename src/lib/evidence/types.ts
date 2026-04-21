/**
 * Evidence Upload and Verification Types for Phase 3
 */

export const EVIDENCE_TYPES = {
  // Recruitment Evidence
  CV: "cv",
  APPLICATION_FORM: "application_form",
  COVER_LETTER: "cover_letter",
  ID_DOCUMENT: "id_document",
  PROOF_OF_ADDRESS: "proof_of_address",
  RIGHT_TO_WORK: "right_to_work",
  DBS_CERTIFICATE: "dbs_certificate",
  REFERENCE: "reference",
  QUALIFICATION_CERTIFICATE: "qualification_certificate",
  INTERVIEW_NOTES: "interview_notes",
  INTERVIEW_SCORING_SHEET: "interview_scoring_sheet",
  OFFER_LETTER: "offer_letter",
  CONTRACT: "contract",
  TRAINING_CERTIFICATE: "training_certificate",
  RISK_ASSESSMENT: "risk_assessment",
  ADDITIONAL_EVIDENCE: "additional_evidence",

  // H&S Evidence
  PHOTO_EVIDENCE: "photo_evidence",
  INCIDENT_REPORT: "incident_report",
  INSPECTION_CERTIFICATE: "inspection_certificate",
  TEST_REPORT: "test_report",
  MAINTENANCE_RECORD: "maintenance_record",
  DEFECT_LOG: "defect_log",
  TRAINING_LOG: "training_log",
} as const;

export const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  [EVIDENCE_TYPES.CV]: "CV",
  [EVIDENCE_TYPES.APPLICATION_FORM]: "Application Form",
  [EVIDENCE_TYPES.COVER_LETTER]: "Cover Letter",
  [EVIDENCE_TYPES.ID_DOCUMENT]: "ID Document",
  [EVIDENCE_TYPES.PROOF_OF_ADDRESS]: "Proof of Address",
  [EVIDENCE_TYPES.RIGHT_TO_WORK]: "Right to Work",
  [EVIDENCE_TYPES.DBS_CERTIFICATE]: "DBS Certificate",
  [EVIDENCE_TYPES.REFERENCE]: "Reference",
  [EVIDENCE_TYPES.QUALIFICATION_CERTIFICATE]: "Qualification Certificate",
  [EVIDENCE_TYPES.INTERVIEW_NOTES]: "Interview Notes",
  [EVIDENCE_TYPES.INTERVIEW_SCORING_SHEET]: "Interview Scoring Sheet",
  [EVIDENCE_TYPES.OFFER_LETTER]: "Offer Letter",
  [EVIDENCE_TYPES.CONTRACT]: "Contract",
  [EVIDENCE_TYPES.TRAINING_CERTIFICATE]: "Training Certificate",
  [EVIDENCE_TYPES.RISK_ASSESSMENT]: "Risk Assessment",
  [EVIDENCE_TYPES.ADDITIONAL_EVIDENCE]: "Additional Evidence",
  [EVIDENCE_TYPES.PHOTO_EVIDENCE]: "Photo Evidence",
  [EVIDENCE_TYPES.INCIDENT_REPORT]: "Incident Report",
  [EVIDENCE_TYPES.INSPECTION_CERTIFICATE]: "Inspection Certificate",
  [EVIDENCE_TYPES.TEST_REPORT]: "Test Report",
  [EVIDENCE_TYPES.MAINTENANCE_RECORD]: "Maintenance Record",
  [EVIDENCE_TYPES.DEFECT_LOG]: "Defect Log",
  [EVIDENCE_TYPES.TRAINING_LOG]: "Training Log",
};

export const VERIFICATION_STATUS = {
  PENDING: "pending",
  VIEWED: "viewed",
  VERIFIED: "verified",
  REJECTED: "rejected",
  SUPERSEDED: "superseded",
  ARCHIVED: "archived",
} as const;

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  [VERIFICATION_STATUS.PENDING]: "Pending Verification",
  [VERIFICATION_STATUS.VIEWED]: "Viewed",
  [VERIFICATION_STATUS.VERIFIED]: "Verified",
  [VERIFICATION_STATUS.REJECTED]: "Rejected",
  [VERIFICATION_STATUS.SUPERSEDED]: "Superseded",
  [VERIFICATION_STATUS.ARCHIVED]: "Archived",
};

export const VERIFICATION_STATUS_COLORS: Record<string, string> = {
  [VERIFICATION_STATUS.PENDING]: "bg-yellow-100 text-yellow-800",
  [VERIFICATION_STATUS.VIEWED]: "bg-blue-100 text-blue-800",
  [VERIFICATION_STATUS.VERIFIED]: "bg-green-100 text-green-800",
  [VERIFICATION_STATUS.REJECTED]: "bg-red-100 text-red-800",
  [VERIFICATION_STATUS.SUPERSEDED]: "bg-gray-100 text-gray-800",
  [VERIFICATION_STATUS.ARCHIVED]: "bg-gray-200 text-gray-700",
};

export interface EvidenceUpload {
  id: string;
  formRecordId: string;
  evidenceType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: {
    id: string;
    email: string;
    name: string;
  };
  uploadedAt: string;
  linkedCandidateId?: string;
  linkedYoungPersonId?: string;
  currentStatus: string;
  verificationHistory: EvidenceVerificationRecord[];
}

export interface EvidenceVerificationRecord {
  id: string;
  action: "viewed" | "verified" | "rejected" | "superseded";
  takenBy: {
    id: string;
    email: string;
    name: string;
  };
  takenAt: string;
  verificationStatus: string;
  verificationNotes?: string;
  rejectionReason?: string;
}

export interface EvidenceRegisterFilter {
  status?: string;
  evidenceType?: string;
  candidateId?: string;
  youngPersonId?: string;
  uploadedAfter?: string;
  uploadedBefore?: string;
  verifiedBy?: string;
  search?: string;
}
