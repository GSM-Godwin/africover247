import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateApplicationDto, sanitizeFormData } from './update-application.dto';

describe('UpdateApplicationDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  function validate(body: unknown) {
    return pipe.transform(body, { type: 'body', metatype: UpdateApplicationDto });
  }

  async function validationMessages(body: unknown): Promise<string[]> {
    try {
      await validate(body);
      return [];
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      const response = (err as BadRequestException).getResponse() as { message: string[] };
      return response.message;
    }
  }

  it.each([1, 2, 3, 4])('accepts stepCompleted %i alongside formData', async (step) => {
    const dto = await validate({ formData: { firstName: 'Ada' }, stepCompleted: step });

    expect(dto).toBeInstanceOf(UpdateApplicationDto);
    expect(dto.stepCompleted).toBe(step);
  });

  it('accepts stepCompleted on its own, as the KYC and review steps send it', async () => {
    const dto = await validate({ stepCompleted: 3 });

    expect(dto.stepCompleted).toBe(3);
    expect(dto.formData).toBeUndefined();
  });

  it('accepts formData without stepCompleted', async () => {
    const dto = await validate({ formData: { city: 'Lagos' } });

    expect(dto.stepCompleted).toBeUndefined();
  });

  it.each([0, 5, -1, 100])('rejects stepCompleted %i outside the 4 wizard steps', async (step) => {
    const messages = await validationMessages({ stepCompleted: step });

    expect(messages.some((m) => m.startsWith('stepCompleted'))).toBe(true);
  });

  it.each([2.5, '2', true])('rejects a non-integer stepCompleted (%p)', async (step) => {
    const messages = await validationMessages({ stepCompleted: step });

    expect(messages).toContain('stepCompleted must be an integer number');
  });

  it('still rejects unknown top-level properties', async () => {
    const messages = await validationMessages({ stepCompleted: 1, status: 'active' });

    expect(messages).toContain('property status should not exist');
  });

  it('accepts every formData key the web and mobile wizards send', () => {
    const wizardFormData = {
      firstName: 'Ada',
      lastName: 'Okafor',
      dateOfBirth: '1990-01-01',
      gender: 'Female',
      nationality: 'Nigerian',
      maritalStatus: 'Single',
      email: 'ada@example.com',
      phone: '08012345678',
      alternativePhone: '08087654321',
      address: '1 Marina Road',
      streetAddress: '1 Marina Road',
      city: 'Lagos',
      state: 'Lagos',
      lga: 'Lagos Island',
      employmentStatus: 'Employed',
      employer: 'Acme',
      employerName: 'Acme',
      jobTitle: 'Engineer',
      monthlyIncomeRange: '₦150,000–₦500,000',
    };

    expect(sanitizeFormData(wizardFormData)).toEqual(wizardFormData);
  });

  it('drops unknown formData keys such as a nested stepCompleted', () => {
    expect(sanitizeFormData({ city: 'Lagos', stepCompleted: 4, status: 'active' })).toEqual({
      city: 'Lagos',
    });
  });
});
