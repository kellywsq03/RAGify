import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    const url = process.env.SUPABASE_URL ?? '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    this.supabase = createClient(url, key);
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) {
      throw new InternalServerErrorException(
        'No user data returned from Supabase',
      );
    }
    return { userId: data.user.id, email: data.user.email };
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new InternalServerErrorException(error.message);
    return { accessToken: data.session?.access_token, user: data.user };
  }
}
