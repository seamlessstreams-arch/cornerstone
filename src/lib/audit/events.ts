export const AUDIT_EVENTS = {
  AUTH_SIGN_IN: "auth.sign_in",
  AUTH_SIGN_OUT: "auth.sign_out",
  RECORD_CREATE: "record.create",
  RECORD_UPDATE: "record.update",
  RECORD_DELETE: "record.delete",
  FILE_UPLOAD: "file.upload",
  FILE_VIEW: "file.view",
  FILE_VERIFY: "file.verify",
  REPORT_GENERATE: "report.generate",
  PROVIDER_SYNC: "provider.sync",
  ADMIN_CONFIG_CHANGE: "admin.config_change",
} as const;

export type AuditEvent = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];
