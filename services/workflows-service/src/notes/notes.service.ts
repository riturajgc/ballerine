import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Note } from '@prisma/client';
import { CreateNoteDto } from './dto/create-notes-dto';
import { QueryNoteDto } from './dto/query-note-dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNoteDto): Promise<Note> {
    await this.prisma.workflowRuntimeData.findFirstOrThrow({
        where: {
            id: data.workflowRunTimeId,
        }
    });
    return this.prisma.note.create({
      data,
    });
  }

  async findAll(filter: QueryNoteDto) {
    const [notes, count] = await Promise.all([
        this.prisma.note.findMany({where: filter}),
        this.prisma.note.count({where: filter}),
    ]);
    return { notes, count };

  }

  async findOne(id: string): Promise<Note | null> {
    return this.prisma.note.findUniqueOrThrow({
      where: { id },
    });
  }

  async update(id: string, data: { text?: string }): Promise<Note> {
    return this.prisma.note.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Note> {
    return this.prisma.note.delete({
      where: { id },
    });
  }
}
