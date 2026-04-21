import type { FormField, FormFieldValidationRule, FormFieldConditionalRule } from "@/lib/forms/types";

export function validateFieldValue(
  value: unknown,
  field: FormField
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (field.required && (value === null || value === undefined || value === "")) {
    errors.push(`${field.label} is required`);
    return { valid: false, errors };
  }

  if (!field.validation_rules) {
    return { valid: errors.length === 0, errors };
  }

  for (const rule of field.validation_rules) {
    const result = validateRule(value, field, rule);
    if (!result.valid) {
      errors.push(result.message);
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateRule(
  value: unknown,
  field: FormField,
  rule: FormFieldValidationRule
): { valid: boolean; message: string } {
  const message = rule.message || `${field.label} is invalid`;

  if (value === null || value === undefined) {
    return { valid: true, message };
  }

  const stringValue = String(value);
  const numValue = Number(value);

  switch (rule.type) {
    case "required":
      return { valid: !!value, message };

    case "min":
      if (Number.isNaN(numValue)) {
        return { valid: true, message };
      }
      return { valid: numValue >= (rule.value as number), message };

    case "max":
      if (Number.isNaN(numValue)) {
        return { valid: true, message };
      }
      return { valid: numValue <= (rule.value as number), message };

    case "pattern":
      return { valid: new RegExp(rule.value as string).test(stringValue), message };

    case "email":
      return {
        valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue),
        message,
      };

    case "url":
      try {
        new URL(stringValue);
        return { valid: true, message };
      } catch {
        return { valid: false, message };
      }

    case "custom":
      return { valid: true, message };

    default:
      return { valid: true, message };
  }
}

export function evaluateConditional(
  condition: FormFieldConditionalRule["when"],
  formValues: Record<string, unknown>
): boolean {
  const fieldValue = formValues[condition.fieldKey];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;

    case "not_equals":
      return fieldValue !== condition.value;

    case "contains":
      return String(fieldValue).includes(String(condition.value));

    case "gt":
      return Number(fieldValue) > Number(condition.value);

    case "lt":
      return Number(fieldValue) < Number(condition.value);

    case "is_empty":
      return fieldValue === null || fieldValue === undefined || fieldValue === "";

    case "is_not_empty":
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";

    default:
      return true;
  }
}

export function evaluateFieldRules(
  field: FormField,
  formValues: Record<string, unknown>
): {
  visible: boolean;
  required: boolean;
  disabled: boolean;
} {
  let visible = true;
  let required = field.required ?? false;
  let disabled = false;

  if (field.conditional_rules) {
    for (const rule of field.conditional_rules) {
      const conditionMet = evaluateConditional(rule.when, formValues);

      if (!conditionMet) continue;

      switch (rule.type) {
        case "show":
          visible = true;
          break;
        case "hide":
          visible = false;
          break;
        case "require":
          required = true;
          break;
        case "disable":
          disabled = true;
          break;
      }
    }
  }

  return { visible, required, disabled };
}
