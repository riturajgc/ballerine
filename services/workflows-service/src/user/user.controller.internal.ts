import * as common from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserModel } from './user.model';
import { UserCreateDto } from '@/user/dtos/user-create';
import { AdminAuthGuard } from '@/common/guards/admin-auth.guard';
import { ProjectIds } from '@/common/decorators/project-ids.decorator';
import type { TProjectId, TProjectIds } from '@/types';
import { CurrentProject } from '@/common/decorators/current-project.decorator';
import { UserStatus } from '@prisma/client';
import { ChangePasswordDto } from './dtos/change-password.dto';
import type { Request } from 'express';
import { UserUpdateDto } from './dtos/user-update';

@swagger.ApiExcludeController()
@common.Controller('internal/users')
@swagger.ApiExcludeController()
export class UserControllerInternal {
  constructor(protected readonly service: UserService) {}

  @common.Get()
  @swagger.ApiQuery({ name: 'projectId', type: String })
  @swagger.ApiOkResponse({ type: [UserModel] })
  @swagger.ApiForbiddenResponse()
  async list(
    @ProjectIds() projectIds: TProjectIds,
    @common.Query('projectId') projectId: string,
  ): Promise<UserModel[]> {
    return this.service.list(
      {
        where: { status: UserStatus.Active },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          updatedAt: true,
          createdAt: true,
        },
      },
      projectId ? [projectId] : projectIds,
    );
  }

  @common.Get('/list-metrics')
  @swagger.ApiForbiddenResponse()
  async listMetrics(
    @common.Query('startDate') startDate: string,
    @common.Query('endDate') endDate: string,
    @common.Query('search') search?: string,
  ): Promise<
    (Partial<UserModel> & {
      statusCounts: {
        active: number;
        completed: number;
        failed: number;
      };
      totalRuntimeData: number;
    })[]
  > {
    return this.service.listMetrics(startDate, endDate, search);
  }

  @common.Patch(':id')
  @swagger.ApiOkResponse({ type: UserModel })
  @swagger.ApiForbiddenResponse()
  async update(
    @common.Param('id') id: string,
    @common.Body() userUpdateInfo: UserUpdateDto,
  ): Promise<UserModel> {
    return this.service.updateById(id, {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        roles: true,
      },
      data: userUpdateInfo,
    });
  }

  @common.Post()
  @swagger.ApiCreatedResponse({ type: [UserModel] })
  @UseGuards(AdminAuthGuard)
  @swagger.ApiForbiddenResponse()
  async create(
    @common.Body() userCreatInfo: UserCreateDto,
    @CurrentProject() currentProjectId: TProjectId,
  ) {
    const { projectIds, ...userInfo } = userCreatInfo;

    return this.service.create(
      {
        data: userInfo,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          roles: true,
          workflowRuntimeData: true,
        },
      },
      projectIds?.[0] || currentProjectId,
    );
  }

  @common.Post('/change-password')
  async changePassword(
    @common.Body() changePasswordInfo: ChangePasswordDto,
    @common.Request() req: Request,
  ) {
    return this.service.changePassword(changePasswordInfo, req.user);
  }
}
