import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserCreateDto } from '@/user/dtos/user-create';
import { UserService } from '@/user/user.service';

@Injectable()
export class UserSyncCron {
    constructor(
        protected readonly userService: UserService,
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
            projectIds: ['project-1', 'project-2'],
        },
        {
            email: 'jane.smith@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            password: 'anothersecurepassword456',
            roles: ['user'],
            projectIds: ['project-2'],
        },
        {
            email: 'mark.jones@example.com',
            firstName: 'Mark',
            lastName: 'Jones',
            password: 'yetanothersecurepassword789',
            roles: ['user', 'manager'],
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
        
        return Promise.all(
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
          )
    }
}
