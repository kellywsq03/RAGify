import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import type { Request } from 'express';

interface UploadBody {
  userId?: string;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('pdf')
  @UseInterceptors(FileInterceptor('file')) // Expect 1 file upload
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const body = req.body as UploadBody;
    const userId = body.userId;

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }
    const result = await this.uploadService.uploadToSupabase(file, userId);
    return { ok: true, ...result };
  }

  @Post('getFiles')
  async getFiles(@Body() body: { userId: string }) {
    const { userId } = body;
    return this.uploadService.listUserFiles(userId);
  }
}
