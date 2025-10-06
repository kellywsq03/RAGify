import { Body, Controller, Post } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('index')
  async index(@Body() body: { bucket: string; path: string }) {
    const { bucket, path } = body;
    return this.ragService.indexFromSupabase(bucket, path);
  }

  @Post('query')
  async query(@Body() body: { question: string }) {
    const { question } = body;
    return this.ragService.query(question);
  }
}
