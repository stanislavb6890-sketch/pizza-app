import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authService } from '@/core/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    redirect('/login?redirect=/admin/dashboard');
  }

  try {
    const payload = authService.verifyAccessTokenSync(token);
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      redirect('/');
    }
  } catch {
    redirect('/login?redirect=/admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-xl font-bold text-gray-900">
                Админ-панель
              </Link>
              <div className="ml-10 flex space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Главная
                </Link>
                <Link
                  href="/admin/products"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Товары
                </Link>
                <Link
                  href="/admin/orders"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Заказы
                </Link>
                <Link
                  href="/admin/categories"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Категории
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/">
                <Button variant="outline" size="sm">
                  На сайт
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
