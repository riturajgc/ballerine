import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import type { TProjectId, TProjectIds } from '@/types';
import { ProjectScopeService } from '@/project/project-scope.service';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { PasswordService } from '@/auth/password/password.service';

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
    console.log(user.user.id, '/////////////');
    const existingUser = await this.repository.findByIdUnscoped(user?.user?.id!, {
      select: { password: true },
    });
    console.log(existingUser, '/////////////');
    if (!existingUser) {
      throw new Error('User not found');
    }
    const isPasswordValid = await this.passwordService.compare(oldPassword, existingUser.password);
    if (!isPasswordValid) {
      throw new Error('Old password is incorrect');
    }
    return this.repository.updateByIdUnscoped(user?.user?.id!, { data: { password: 'admin13' } });
  }
}
