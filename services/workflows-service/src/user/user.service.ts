import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import type { TProjectId, TProjectIds } from '@/types';
import { ProjectScopeService } from '@/project/project-scope.service';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { PasswordService } from '@/auth/password/password.service';
import { User, UserStatus, WorkflowRuntimeDataStatus } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    protected readonly repository: UserRepository,
    protected readonly scopeService: ProjectScopeService,
    protected readonly passwordService: PasswordService,
  ) {}

  async create(args: Parameters<UserRepository['create']>[0], projectId: TProjectId) {
    return await this.repository.create(args, projectId);
  }

  async list(args: Parameters<UserRepository['findMany']>[0], projectIds: TProjectIds) {
    return this.repository.findMany(args, projectIds);
  }

  async listAll(args: Parameters<UserRepository['findMany']>[0]) {
    return this.repository.list(args);
  }

  async getById(
    id: string,
    args: Parameters<UserRepository['findById']>[1],
    projectIds: TProjectIds,
  ) {
    return this.repository.findById(id, args, projectIds);
  }

  async getByIdUnscoped(id: string, args: Parameters<UserRepository['findByIdUnscoped']>[1]) {
    return this.repository.findByIdUnscoped(id, args);
  }

  async getByEmailUnscoped(
    email: string,
    args?: Parameters<UserRepository['findByEmailUnscoped']>[1],
  ) {
    return this.repository.findByEmailUnscoped(email, args);
  }

  async updateById(id: string, args: Parameters<UserRepository['updateByIdUnscoped']>[1]) {
    return this.repository.updateByIdUnscoped(id, args);
  }

  async upsertByEmail(email: string, args: Parameters<UserRepository['upsertByEmailUnscoped']>[1]) {
    return this.repository.upsertByEmailUnscoped(email, args);
  }

  async deleteById(
    id: string,
    args: Parameters<UserRepository['deleteById']>[1],
    projectIds?: TProjectIds,
  ) {
    return this.repository.deleteById(id, args, projectIds);
  }

  async changePassword(changePasswordInfo: ChangePasswordDto, user: any) {
    const { oldPassword, newPassword, confirmNewPassword } = changePasswordInfo;
    if (newPassword !== confirmNewPassword) {
      throw new Error('Passwords do not match');
    }
    const existingUser = await this.repository.findByIdUnscoped(user?.user?.id!, {
      select: { password: true },
    });
    if (!existingUser) {
      throw new Error('User not found');
    }
    const isPasswordValid = await this.passwordService.compare(oldPassword, existingUser.password);
    if (!isPasswordValid) {
      throw new Error('Old password is incorrect');
    }
    return this.repository.updateByIdUnscoped(user?.user?.id!, { data: { password: 'admin13' } });
  }

  async listMetrics(startDate: string, endDate: string) {
    const usersWithRuntimeDataCounts = (await this.repository.findManyUnscoped({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        lastActiveAt: true,
        status: true,
        workflowRuntimeData: {
          select: {
            status: true,
            resolutionTime: true,
          },
        },
      },
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: UserStatus.Active,
      },
    })) as (User & { workflowRuntimeData: { status: WorkflowRuntimeDataStatus, resolutionTime?: number }[] })[];

    if (!usersWithRuntimeDataCounts?.length) {
      return [];
    }

    const userCounts = usersWithRuntimeDataCounts.map(user => {
      const statusCounts = user.workflowRuntimeData.reduce(
        (acc, data) => {
          acc[data.status] = (acc[data.status] || 0) + 1;
          return acc;
        },
        { active: 0, completed: 0, failed: 0 },
      );

      const totalResolutionTime = user.workflowRuntimeData.reduce((acc, data) => {
        if (data.resolutionTime) {
          acc += data.resolutionTime;
        }
        return acc;
      }, 0);

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        lastActiveAt: user.lastActiveAt,
        status: user.status,
        statusCounts,
        totalRuntimeData: user.workflowRuntimeData.length,
        averageResolutionTime:
          statusCounts.completed > 0 ? totalResolutionTime / statusCounts.completed : undefined,
      };
    });

    return userCounts;
  }
}
