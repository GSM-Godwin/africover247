import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { KycService } from '../kyc/kyc.service';

const USER_ID = 'user-1';
const APPLICATION_ID = 'application-1';

function buildApplication(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: APPLICATION_ID,
    userId: USER_ID,
    status: 'draft',
    stepCompleted: 1,
    formData: { firstName: 'Ada' },
    product: { id: 'product-1' },
    kycDocuments: [],
    policy: null,
    ...overrides,
  };
}

describe('ApplicationsService.update', () => {
  let service: ApplicationsService;
  let prisma: { application: { findUnique: jest.Mock; update: jest.Mock } };
  let redisService: { saveDraft: jest.Mock };

  beforeEach(async () => {
    prisma = {
      application: {
        findUnique: jest.fn().mockResolvedValue(buildApplication()),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...buildApplication(), ...data }),
        ),
      },
    };
    redisService = { saveDraft: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redisService },
        { provide: KycService, useValue: {} },
      ],
    }).compile();

    service = module.get(ApplicationsService);
  });

  function updateData() {
    return prisma.application.update.mock.calls[0][0].data;
  }

  it('stores stepCompleted together with the merged form data', async () => {
    await service.update(APPLICATION_ID, USER_ID, {
      formData: { city: 'Lagos' },
      stepCompleted: 2,
    });

    expect(updateData()).toEqual({
      formData: { firstName: 'Ada', city: 'Lagos' },
      stepCompleted: 2,
    });
    expect(redisService.saveDraft).toHaveBeenCalledWith(APPLICATION_ID, {
      firstName: 'Ada',
      city: 'Lagos',
    });
  });

  it('stores stepCompleted on its own without touching form data or the draft cache', async () => {
    await service.update(APPLICATION_ID, USER_ID, { stepCompleted: 3 });

    expect(updateData()).toEqual({ stepCompleted: 3 });
    expect(redisService.saveDraft).not.toHaveBeenCalled();
  });

  it('never moves stepCompleted backwards when the user edits an earlier step', async () => {
    prisma.application.findUnique.mockResolvedValue(buildApplication({ stepCompleted: 3 }));

    await service.update(APPLICATION_ID, USER_ID, {
      formData: { firstName: 'Adaeze' },
      stepCompleted: 1,
    });

    expect(updateData()).not.toHaveProperty('stepCompleted');
    expect(updateData().formData).toEqual({ firstName: 'Adaeze' });
  });

  it('leaves stepCompleted unchanged when it is not sent', async () => {
    await service.update(APPLICATION_ID, USER_ID, { formData: { city: 'Abuja' } });

    expect(updateData()).not.toHaveProperty('stepCompleted');
  });

  it('refuses to update another user\'s application', async () => {
    prisma.application.findUnique.mockResolvedValue(buildApplication({ userId: 'someone-else' }));

    await expect(
      service.update(APPLICATION_ID, USER_ID, { stepCompleted: 2 }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.application.update).not.toHaveBeenCalled();
  });
});
