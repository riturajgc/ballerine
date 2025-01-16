import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, RoundRobin, UserDetails } from '@prisma/client';

@Injectable()
export class RoundRobinRepository {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Create a new RoundRobin entry along with its related UserDetails.
   * @param args - The data to create the RoundRobin entry.
   */
  async create<T extends Prisma.RoundRobinCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.RoundRobinCreateArgs>,
  ): Promise<RoundRobin> {
    const { userList, ...roundRobinData } = args.data as any;
    // If userList is not provided, we ensure it's an empty array (similar to how userToProjects was handled)
    const userListCreateData = userList?.length
      ? userList.map((user: {userId: string, serialNumber: number}) => ({
          userId: user.userId,
          serialNumber: user.serialNumber,
        }))
      : [];

    const roundRobinCreateData: Prisma.RoundRobinCreateInput = {
      ...roundRobinData,
      userList: userListCreateData.length
        ? { create: userListCreateData } // If there are users to add, create them
        : undefined, // Else, don't include userList in the creation
    };

    // Perform the creation of the RoundRobin entry along with userList
    return this.prisma.roundRobin.create<T>({
      ...args,
      data: roundRobinCreateData,
    });
  }

  /**
   * List all RoundRobin entries with optional filtering.
   * @param args - The filter, pagination, and include options.
   */
  async list<T extends Prisma.RoundRobinFindManyArgs>(
    args?: Prisma.SelectSubset<T, Prisma.RoundRobinFindManyArgs>,
  ): Promise<RoundRobin[]> {
    return this.prisma.roundRobin.findMany<T>(args);
  }

  /**
   * List all RoundRobin entries of a specific type with associated user details.
   * @param type - The type of round-robin entries to fetch ('lead' or 'ticket').
   * @returns A promise that resolves with the list of round-robin entries and their associated user details.
   */
  async listByType<T extends Prisma.RoundRobinFindManyArgs>(
    type: 'lead' | 'ticket',
  ): Promise<(RoundRobin & { userList: UserDetails[] }) | null> {
    return this.prisma.roundRobin.findFirst({
      where: {
        type, // Filter by the type
      },
      include: {
        userList: true, // Include associated user details
      },
    });
  }

  /**
   * Update an existing RoundRobin entry along with its related UserDetails.
   * @param id - The ID of the RoundRobin entry to update.
   * @param data - The data to update the RoundRobin entry.
   */
  async update<T extends Prisma.RoundRobinUpdateArgs>(
    id: string,
    data: Prisma.RoundRobinUpdateInput,
  ): Promise<RoundRobin & { userList: UserDetails[] }> {
    const { userList, ...roundRobinData } = data as any;

    // Prepare the update data for userList
    const userListUpdateData = userList
      ? {
          deleteMany: {}, // Remove all existing UserDetails for this RoundRobin
          create: userList.map((user: { userId: string; serialNumber: number }) => ({
            userId: user.userId,
            serialNumber: user.serialNumber,
          })), // Recreate the UserDetails with the provided data
        }
      : undefined;

    // Update the RoundRobin entry
    return this.prisma.roundRobin.update({
      where: { id }, // Update by ID
      data: {
        ...roundRobinData,
        userList: userListUpdateData, // Include userList update if provided
      },
      include: {
        userList: true, // Include the associated user details in the response
      },
    });
  }

  async upsert(
    type: 'lead' | 'ticket',
    data: Prisma.RoundRobinUpdateInput,
  ): Promise<RoundRobin & { userList: UserDetails[] }> {
    const { userList, ...roundRobinData } = data as any;
  
    // Prepare the data for userList to be upserted
    const userListUpsertData = userList
      ? {
          deleteMany: {}, // Remove all existing UserDetails for this RoundRobin
          create: userList.map((user: { userId: string; serialNumber: number }) => ({
            userId: user.userId,
            serialNumber: user.serialNumber,
          })), // Recreate the UserDetails with the provided data
        }
      : undefined;
  
    // Perform the upsert on the RoundRobin entry
    return this.prisma.roundRobin.upsert({
      where: { type }, // Look for existing entry by Type
      create: { // If not found, create a new entry
        ...roundRobinData,
        userList: userListUpsertData ? { create: userListUpsertData.create } : undefined,
      },
      update: { // If found, update the existing entry
        ...roundRobinData,
        userList: userListUpsertData,
      },
      include: {
        userList: true, // Include the associated user details in the response
      },
    });
  }
  

    /**
   * Delete all RoundRobin entries of a specific type.
   * @param type - The type of round-robin entries to delete ('lead' or 'ticket').
   * @returns A promise that resolves to the count of deleted entries.
   */
    async deleteByType(type: 'lead' | 'ticket'): Promise<number> {
      const roundRobinData = await this.prisma.roundRobin.findFirst({
        where: {
          type, // Filter by the type
        },
      });
      if(!roundRobinData) return 0;
      // delete userDetails first
      await this.prisma.userDetails.deleteMany({
        where: {
          roundRobinId: roundRobinData.id, // Filter by the type
        },
      });
      // delete roundRobin
      const deletedRoundRobins = await this.prisma.roundRobin.deleteMany({
        where: {
          type, // Filter by the type
        },
      });
  
      return deletedRoundRobins.count; // Return the number of deleted entries
    }

}
