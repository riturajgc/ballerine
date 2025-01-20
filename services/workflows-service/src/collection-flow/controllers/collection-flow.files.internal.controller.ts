import { CurrentProject } from '@/common/decorators/current-project.decorator';
import { RemoveTempFileInterceptor } from '@/common/interceptors/remove-temp-file.interceptor';
import { FILE_MAX_SIZE_IN_BYTE, FILE_SIZE_EXCEEDED_MSG, fileFilter } from '@/storage/file-filter';
import { getDiskStorage } from '@/storage/get-file-storage-manager';
import { StorageService } from '@/storage/storage.service';
import type { TProjectId } from '@/types';
import {
    Body,
  Controller,
  ForbiddenException,
  HttpCode,
  ParseFilePipeBuilder,
  Post,
  UnprocessableEntityException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiForbiddenResponse, ApiOkResponse } from '@nestjs/swagger';
import { CollectionFlowService } from '../collection-flow.service';
import { getFileMetadata } from '@/common/get-file-metadata/get-file-metadata';

@Controller('/internal/collection-flow/files')
export class CollectionFlowFilesInternalController {
  constructor(
    protected storageService: StorageService,
    protected collectionFlowService: CollectionFlowService
  ) {}

  @UseInterceptors(
    FileInterceptor('file', {
      storage: getDiskStorage(),
      limits: {
        files: 1,
      },
      fileFilter,
    }),
    RemoveTempFileInterceptor,
  )
  @Post()
  @ApiOkResponse()
  @HttpCode(200)
  @ApiForbiddenResponse({ type: ForbiddenException })
  async createCase(
    @UploadedFile(
      new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: FILE_MAX_SIZE_IN_BYTE }).build({
        fileIsRequired: true,
        exceptionFactory: (error: string) => {
          if (error.includes('expected size')) {
            throw new UnprocessableEntityException(FILE_SIZE_EXCEEDED_MSG);
          }

          throw new UnprocessableEntityException(error);
        },
      }),
    )
    file: Express.Multer.File,
    @Body() { workflowRunTimeId }: { workflowRunTimeId: string },
    @CurrentProject() currentProjectId: TProjectId,
  ) {
    return this.collectionFlowService.uploadNewFile(
        currentProjectId,
        workflowRunTimeId,
        {
          ...file,
          mimetype:
            file.mimetype ||
            (
              await getFileMetadata({
                file: file.originalname || '',
                fileName: file.originalname || '',
              })
            )?.mimeType ||
            '',
        },
      );
  }
}
