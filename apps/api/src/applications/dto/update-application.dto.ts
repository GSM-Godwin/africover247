import { IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';

export const APPLICATION_WIZARD_STEPS = 4;

const ALLOWED_FORM_DATA_KEYS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'dateOfBirth',
  'gender',
  'nationality',
  'maritalStatus',
  'streetAddress',
  'address',
  'city',
  'state',
  'lga',
  'alternativePhone',
  'employmentStatus',
  'employer',
  'employerName',
  'jobTitle',
  'occupation',
  'monthlyIncomeRange',
  'annualIncome',
  'assetDetails',
];

export class UpdateApplicationDto {
  @IsObject()
  @IsOptional()
  formData?: Record<string, unknown>;

  @IsInt()
  @Min(1)
  @Max(APPLICATION_WIZARD_STEPS)
  @IsOptional()
  stepCompleted?: number;
}

export function sanitizeFormData(
  formData: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(formData).filter(([key]) =>
      ALLOWED_FORM_DATA_KEYS.includes(key),
    ),
  );
}
