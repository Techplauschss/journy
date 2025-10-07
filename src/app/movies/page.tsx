'use client';

import Link from 'next/link';

export default function MoviesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Filmübersicht</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Hier kannst du deine geschauten Filme und Serien tracken.</p>
        <Link href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg">
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}
