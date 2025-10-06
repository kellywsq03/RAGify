import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  private supabase: ReturnType<typeof createClient>;
  private bucketName: string;

  constructor() {
    const url = process.env.SUPABASE_URL ?? '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    this.bucketName = process.env.SUPABASE_BUCKET ?? 'pdfs';
    this.supabase = createClient(url, key);
  }

  async uploadToSupabase(file: Express.Multer.File) {
    try {
      const filename = `${Date.now()}-${file.originalname}`;
      const path = `uploads/${filename}`;

      await this.supabase.storage
        .createBucket(this.bucketName, { public: false })
        .catch(() => undefined);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      if (error) throw error;

      const { data: signed } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(path, 60 * 60); // 1 hour

      return { bucket: this.bucketName, path, signedUrl: signed?.signedUrl };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      throw new InternalServerErrorException(message);
    }
  }
}
