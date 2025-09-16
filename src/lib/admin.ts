import { NextRequest } from 'next/server';
import { requireServiceRole } from './supabase';

export async function verifyAdminFromRequest(req: Request | NextRequest) {
  // Read Authorization header
  const authHeader = (req as any).headers?.get ? (req as any).headers.get('authorization') : undefined;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err: any = new Error('Missing Authorization bearer token');
    err.status = 401;
    throw err;
  }

  const token = authHeader.replace('Bearer ', '').trim();

  const supabaseAdmin = requireServiceRole();

  // Verify token using Supabase Admin client
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token as string);
    if (error || !data?.user) {
      const e: any = new Error('Invalid auth token');
      e.status = 401;
      throw e;
    }

    const user = data.user;

    const adminUserId = process.env.ADMIN_USER_ID || process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    // If no admin configured on server, reject
    if (!adminUserId && !adminEmail) {
      const e: any = new Error('Admin not configured on server');
      e.status = 403;
      throw e;
    }

    if (adminUserId && user.id === adminUserId) return user;
    if (adminEmail && user.email === adminEmail) return user;

    const e: any = new Error('Forbidden — not admin');
    e.status = 403;
    throw e;
  } catch (err: any) {
    if (!err.status) err.status = 401;
    throw err;
  }
}

export default verifyAdminFromRequest;
