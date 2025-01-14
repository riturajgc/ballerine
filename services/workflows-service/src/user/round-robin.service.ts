import { Injectable } from '@nestjs/common';
import { RoundRobinRepository } from './round-robin.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoundRobinService {
  constructor(
    protected readonly repository: RoundRobinRepository,
  ) {}

  async create(args: Parameters<RoundRobinRepository['create']>[0]) {
    const { userList, ...roundRobinData } = args.data;

    // Pass the modified data to the repository for creation
    return await this.repository.create(args);
  }

  async getNextUser(args: Parameters<RoundRobinRepository['listByType']>[0]):
    Promise<{userId: string, serialNumber: number, previousUserId: string|null}> {
    const details =  await this.repository.listByType(args);
    if (!details || !details.userList || details.userList.length === 0) {
      throw new Error(`Userpool not available for type ${args}`);
    }
    const currentUserId = details.userId || null;
    const allUsers = details.userList;
    let serialNumbers = allUsers.map(u => u.serialNumber);
    serialNumbers = serialNumbers.sort((a, b) => { return a - b });

    let currIndex = -1;
    if(details.serialNumber){
        currIndex = serialNumbers.indexOf(details.serialNumber);
    }
    let nextIndex = currIndex+1;

    if(currIndex === (allUsers.length -1)){
        nextIndex = 0;
    }
    const nextSerial = serialNumbers[nextIndex];

    const nextUser = allUsers.find(u => {
        return u.serialNumber === nextSerial
    })!;
    await this.repository.update(details.id, {userId: nextUser?.userId, serialNumber:nextUser?.serialNumber});
    return {
      userId: nextUser?.userId,
      serialNumber: nextUser?.serialNumber,
      previousUserId: currentUserId
    };
  }

  async resetNextUser(args: Parameters<RoundRobinRepository['listByType']>[0]):Promise<void> {
    const details =  await this.repository.listByType(args);
    if (!details || !details.userList || details.userList.length === 0) {
      throw new Error(`Userpool not available for type ${args}`);
    }
    const allUsers = details.userList;
    let serialNumbers = allUsers.map(u => u.serialNumber);
    serialNumbers = serialNumbers.sort((a, b) => { return a - b });

    let currIndex = -1;
    if(details.serialNumber){
        currIndex = serialNumbers.indexOf(details.serialNumber);
    }
    let nextIndex = currIndex-1;

    if(currIndex === 0){
        nextIndex = allUsers.length -1;
    }
    const nextSerial = serialNumbers[nextIndex];

    const nextUser = allUsers.find(u => {
        return u.serialNumber === nextSerial
    });
    await this.repository.update(details.id, {userId: nextUser?.userId, serialNumber:nextUser?.serialNumber});
  }

  getPreviousUserSerialNumber(list: number[], serialNumber: number): number {
    let previousNumber = -1;
    for (let i = 0; i < list.length; i++) {
        if (list[i]! <= serialNumber) {
            previousNumber = list[i]!;
        } else {
            break;
        }
    }
    console.log('RoundRobin: previousUserSerialNumber: ', previousNumber, 'serialNumber:', serialNumber, 'list: ', list)
    return previousNumber;
  }

  async updateUsersList(args: Parameters<RoundRobinRepository['listByType']>[0], userList: {userId: string, serialNumber: number}[]):Promise<void> {
    const currentState =  await this.repository.listByType(args);
    console.log('RoundRobin before update: ', JSON.stringify(currentState));
    
    const currentUserId = currentState ? currentState.userId : null;
    let newCurrentUser:any = { userId: null, serialNumber: null };

    let updateObj = {
        type: args,
        total: userList.length,
        userList: userList,
        userId: '',
        serialNumber: -1
    }

    if(currentState && currentUserId){
      const isCurrentUserActive = userList.find(u=>{
          return u.userId.toString() === currentUserId.toString();
      });
      console.log('isCurrentUserActive', isCurrentUserActive)

      if(isCurrentUserActive){
          newCurrentUser.userId = currentUserId;
          newCurrentUser.serialNumber = currentState.serialNumber;
      }else{
          let newSerialNumbers = userList.map(u => u.serialNumber);
          newSerialNumbers = newSerialNumbers.sort((a, b) => { return a - b });

          const newSerialNumber = this.getPreviousUserSerialNumber(newSerialNumbers, currentState.serialNumber);

          const newUser = userList.find(u => {
              return u.serialNumber === newSerialNumber;
          });
          if(newUser){
              newCurrentUser.userId = newUser.userId;
              newCurrentUser.serialNumber = newUser.serialNumber;
          }

      }
      updateObj.userId = newCurrentUser.userId;
      updateObj.serialNumber = newCurrentUser.serialNumber;
  }
  const resp = await this.repository.upsert(args, updateObj as any);
  }

  async deleteByType(args: Parameters<RoundRobinRepository['deleteByType']>[0]): Promise<void> {
    this.repository.deleteByType(args);
  }
}
