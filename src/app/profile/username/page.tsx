import React from 'react';
import UsernameForm from '@/components/UsernameForm';
import { I18nProvider } from '@/context/I18nContext';
import { cookies } from 'next/headers';

export default async function ProfileUsernamePage(){
  // Server component: read lang cookie and wrap client component with I18nProvider
  const cookieStore = await cookies();
  const lang = cookieStore.get('lang')?.value || 'en';
  return (
    <I18nProvider lang={lang}>
      <UsernameForm />
    </I18nProvider>
  );
}
