import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';

import { UserCreateDto } from '@/user/dtos/user-create';
import { UserService } from '@/user/user.service';
import { RoundRobinService } from '@/user/round-robin.service';


@Injectable()
export class UserSyncCron {
  private readonly UAM_ENDPOINT: string;
  private readonly JOB_ID: number;
  private readonly LIMIT: number;
  constructor(
    protected readonly userService: UserService,
    protected readonly roundRobinService: RoundRobinService,
    private readonly httpService: HttpService,
  ) {
    this.UAM_ENDPOINT = process.env.UAM_ENDPOINT;
    this.JOB_ID = parseInt(process.env.JOB_ID, 10);
    this.LIMIT = parseInt(process.env.LIMIT || '50', 10);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    console.log('UserSyncCron starting');

    try {
      await this.upsertUsers();
    } catch (error) {
      console.error('Error in UserSyncCron:', error);
    } finally {
      console.log('UserSyncCron finished');
    }
  }

  async upsertUsers() {
    let offset = 0;
    let hasMore = true;


    // PLEASE UNCOMMENT POST UAM's GETALL USERS API IS DEPLOYED

    // while (hasMore) {
    //   try {
    //     const url = `${this.UAM_ENDPOINT}/users/getAll`;
    //     const response = await lastValueFrom(
    //       this.httpService.post(url, {
    //         limit: this.LIMIT,
    //         offset,
    //         jobId: this.JOB_ID,
    //       })
    //     );

    //     const users = (response.data?.users || []).map(user => ({
    //       ...user,
    //       projectIds: ['project-1', 'project-2'],
    //     }));

    //     if (users.length > 0) {
    //       await this.handleUsers(users);
    //     }

    //     if (users.length < this.LIMIT) {
    //       hasMore = false;
    //     } else {
    //       offset += this.LIMIT;
    //     }
    //   } catch (error) {
    //     console.error('Error fetching users', error);
    //     break;
    //   }
    // }


    // dummy users

    const users: UserCreateDto[] = [
      {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'securepassword123',
        roles: ['user', 'admin'],
        serialNumber: 1,
        projectIds: ['project-1', 'project-2'],
      },
      {
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'anothersecurepassword456',
        roles: ['user'],
        serialNumber: 2,
        projectIds: ['project-2'],
      },
      {
        email: 'mark.jones@example.com',
        firstName: 'Mark',
        lastName: 'Jones',
        password: 'yetanothersecurepassword789',
        roles: ['user', 'manager'],
        serialNumber: 3,
        projectIds: ['project-1'],
      },
      {
        email: 'priyanka.jones@example.com',
        firstName: 'Priyanka',
        lastName: 'Jones',
        password: 'yetanothersecurepassword101112',
        roles: ['user', 'manager'],
        serialNumber: 4,
        projectIds: ['project-1'],
      },
    ];
    this.handleUsers(users);

  }

  async handleUsers(users: UserCreateDto[]) {
    console.log('Processing fetched users:', users.length);

    const usersWithoutProjects = users.map(({ projectIds, ...userData }) => userData);

    await Promise.all(
      usersWithoutProjects.map(async (user) => {
        const { email, ...userData } = user;
        return this.userService.upsertByEmail(email, {
          create: {
            ...userData,
            email,
          },
          update: userData
        });
      })
    );

    const allUsers = await this.userService.listAll({
      where: {
        status: 'Active',
        serialNumber: {
          not: null,
        }
      }
    });

    const userListForRoundRobin = allUsers.map(user => ({
      userId: user.id,
      serialNumber: user.serialNumber!
    }));

    console.log('userListForRoundRobin: ', JSON.stringify(userListForRoundRobin))

    console.log('Updating roundRobin');
    await this.roundRobinService.updateUsersList('ticket', userListForRoundRobin);

    const roundRobins = await this.roundRobinService.getNextUser('ticket');
  }
}
