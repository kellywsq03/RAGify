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

  async uploadToSupabase(
    file: Express.Multer.File,
    userId: string | undefined,
  ) {
    try {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      const filename = `${file.originalname}-${month}${day}${hours}${minutes}`;
      let path = '';
      if (userId) {
        path = `uploads/${userId}/${filename}`;
      } else {
        path = `uploads/${filename}`;
      }

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

      return {
        bucket: this.bucketName,
        path,
        filename,
        signedUrl: signed?.signedUrl,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      throw new InternalServerErrorException(message);
    }
  }

  async listUserFiles(userId: string) {
    try {
      if (!userId) {
        return [];
      }

      const prefix = `uploads/${userId}/`;

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(prefix, { limit: 100, offset: 0 });

      if (error) throw error;

      const filesWithUrls = await Promise.all(
        data.map(async (file) => {
          const { data: signed } = await this.supabase.storage
            .from(this.bucketName)
            .createSignedUrl(`${prefix}${file.name}`, 60 * 60); // valid 1 hour
          return {
            name: file.name,
            path: `${prefix}${file.name}`,
            signedUrl: signed?.signedUrl,
          };
        }),
      );

      return filesWithUrls;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to list user files';
      throw new InternalServerErrorException(message);
    }
  }
}
