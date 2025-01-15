import { Injectable } from '@nestjs/common';
import { EndUserRepository } from './end-user.repository';
import { EndUserCreateDto } from '@/end-user/dtos/end-user-create';
import type { TProjectId, TProjectIds } from '@/types';
import { ProjectScopeService } from '@/project/project-scope.service';
import { Business, BusinessPosition, EndUser, Prisma } from '@prisma/client';
import { EndUserActiveMonitoringsSchema, EndUserAmlHitsSchema } from '@/end-user/end-user.schema';

@Injectable()
export class EndUserService {
  constructor(
    protected readonly repository: EndUserRepository,
    protected readonly scopeService: ProjectScopeService,
  ) {}

  async create(args: Parameters<EndUserRepository['create']>[0]) {
    return await this.repository.create(args);
  }

  async list(args: Parameters<EndUserRepository['findMany']>[0], projectIds: TProjectIds) {
    return await this.repository.findMany(args, projectIds);
  }

  async find(id: string, projectIds: TProjectIds) {
    return await this.repository.find({ where: { id } }, projectIds);
  }

  async getById(
    id: string,
    args: Parameters<EndUserRepository['findById']>[1],
    projectIds: TProjectIds,
  ) {
    return await this.repository.findById(id, args, projectIds);
  }

  async createWithBusiness(
    {
      endUser,
      business,
      position,
    }: {
      endUser: Omit<EndUserCreateDto, 'companyName' | 'correlationId'>;
      business: Prisma.BusinessUncheckedCreateWithoutEndUsersInput;
      position?: BusinessPosition;
    },
    projectId: TProjectId,
    businessId?: string,
  ): Promise<EndUser & { businesses: Business[] }> {
    const user = await this.repository.create({
      data: {
        ...endUser,
        businesses: {
          connectOrCreate: {
            where: {
              id: businessId,
            },
            create: business,
          },
        },
        ...(position
          ? {
              endUsersOnBusinesses: {
                create: {
                  businessId: businessId ?? '',
                  position,
                },
              },
            }
          : {}),
        projectId,
      },
      include: {
        businesses: true,
      },
    });

    return user as any;
  }

  async getByEmail(
    email: string,
    projectIds: TProjectIds,
  ): Promise<(EndUser & { businesses?: Business[] }) | null> {
    return await this.repository.find(
      {
        where: {
          email,
        },
        include: {
          businesses: true,
        },
      },
      projectIds,
    );
  }

  async updateById(id: string, endUser: Omit<Prisma.EndUserUpdateArgs, 'where'>) {
    let activeMonitorings;

    if (endUser.data.activeMonitorings !== undefined) {
      activeMonitorings = EndUserActiveMonitoringsSchema.parse(endUser.data.activeMonitorings);
    }

    let amlHits;

    if (endUser.data.amlHits !== undefined) {
      amlHits = EndUserAmlHitsSchema.parse(endUser.data.amlHits);
    }

    return await this.repository.updateById(id, {
      ...endUser,
      data: {
        ...endUser.data,
        activeMonitorings,
        amlHits,
      },
    });
  }

  async getExternalEndUsers(body: any) {
    return {
        total: 10,
        endUsers: [
            {
                id: '1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@gmail.com',
                phoneNumber: '123456789'
            },
            {
                id: '2',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'janesmith@gmail.com',
                phoneNumber: '987654321'
            },
            {
                id: '3',
                firstName: 'Michael',
                lastName: 'Brown',
                email: 'michaelbrown@gmail.com',
                phoneNumber: '456789123'
            },
            {
                id: '4',
                firstName: 'Emily',
                lastName: 'Johnson',
                email: 'emilyjohnson@gmail.com',
                phoneNumber: '789123456'
            },
            {
                id: '5',
                firstName: 'Daniel',
                lastName: 'Wilson',
                email: 'danielwilson@gmail.com',
                phoneNumber: '321654987'
            },
            {
                id: '6',
                firstName: 'Olivia',
                lastName: 'Davis',
                email: 'oliviadavis@gmail.com',
                phoneNumber: '654987321'
            },
            {
                id: '7',
                firstName: 'William',
                lastName: 'Martinez',
                email: 'williammartinez@gmail.com',
                phoneNumber: '987321654'
            },
            {
                id: '8',
                firstName: 'Sophia',
                lastName: 'Taylor',
                email: 'sophiataylor@gmail.com',
                phoneNumber: '123789456'
            },
            {
                id: '9',
                firstName: 'James',
                lastName: 'Anderson',
                email: 'jamesanderson@gmail.com',
                phoneNumber: '789456123'
            },
            {
                id: '10',
                firstName: 'Isabella',
                lastName: 'Thomas',
                email: 'isabellathomas@gmail.com',
                phoneNumber: '456123789'
            }
        ]        
    }
  }
}
