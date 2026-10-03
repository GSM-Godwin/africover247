import { IsObject, IsOptional } from 'class-validator';

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
  'calculatedPremium',
  'quotedPremium',
  'quoteId',
  'fromQuote',
];

export class UpdateApplicationDto {
  @IsObject()
  @IsOptional()
  formData?: Record<string, unknown>;
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
