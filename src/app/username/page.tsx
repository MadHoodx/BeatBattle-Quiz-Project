import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function UsernameRedirect() {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get('lang')?.value || 'en';
  // Redirect to localized username page
  redirect(`/${langCookie}/username`);
}
