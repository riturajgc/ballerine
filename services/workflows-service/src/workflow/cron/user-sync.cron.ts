import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserCreateDto } from '@/user/dtos/user-create';
import { UserService } from '@/user/user.service';
import { RoundRobinService } from '@/user/round-robin.service';

@Injectable()
export class UserSyncCron {
    constructor(
        protected readonly userService: UserService,
        protected readonly roundRobinService: RoundRobinService,
     ) {}
    // Define the cron job to run every hour
    @Cron(CronExpression.EVERY_HOUR) // Adjusted frequency
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
        // TODO: fetch users from linked system's API
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

        console.log('Sample Users:', users);

        const usersWithoutProjects = users.map((user) => {
            const { projectIds, ...userData } = user;

            return {
              ...userData
            };
          });

        // syncing users
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

          const allUsers = await this.userService.listAll({where: {
            status: 'Active', 
            serialNumber: {
              not: null, // Ensure serialNumber is not null
            }
          }});

          const userListForRoundRobin = allUsers.map(user => ({
            userId: user.id,
            serialNumber: user.serialNumber!
          }));

          console.log('userListForRoundRobin: ', JSON.stringify(userListForRoundRobin))

          console.log('Updating roundRobin');
          await this.roundRobinService.updateUsersList('ticket', userListForRoundRobin);

          const roundRobins = await this.roundRobinService.getNextUser('ticket');

        // Round robin sample usages
        // const roundRobins = await this.roundRobinService.getNextUser('ticket');
        // console.log('roundRobinData: ', roundRobins);
        // console.log('going to reset next user: ');
        // await this.roundRobinService.resetNextUser('ticket');
        // console.log('Done resetting next user: ');

    }
}
