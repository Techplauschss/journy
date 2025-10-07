'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { addMovie, subscribeToMovies, deleteMovie, updateMovie, Movie } from '../../lib/journeyService';

// Star-Rating-Komponente
const StarRating = ({ rating, setRating }: { rating: number, setRating: (rating: number) => void }) => {
  return (
    <div className="flex items-center">
      {[...Array(10)].map((_, index) => {
        const starValue = index + 1;
        return (
          <svg
            key={starValue}
            onClick={() => setRating(starValue)}
            className={`w-6 h-6 cursor-pointer ${starValue <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      })}
    </div>
  );
};

export default function MoviesPage() {
  const today = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [rating, setRating] = useState(0);
  const [moviesByYear, setMoviesByYear] = useState<{[year: string]: Movie[]}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Edit State
  const [editEntry, setEditEntry] = useState<{ isOpen: boolean; entryId: string | null; title: string; date: string; rating: number; }>({ isOpen: false, entryId: null, title: '', date: '', rating: 0 });

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; entryId: string | null; entryText: string; }>({ isOpen: false, entryId: null, entryText: '' });

  useEffect(() => {
    const unsubscribe = subscribeToMovies((movies) => {
      const sortedMovies = movies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const groupedMovies = sortedMovies.reduce((acc, movie) => {
        const year = new Date(movie.date).getFullYear().toString();
        if (!acc[year]) {
          acc[year] = [];
        }
        acc[year].push(movie);
        return acc;
      }, {} as {[year: string]: Movie[]});
      setMoviesByYear(groupedMovies);
    });
    return () => unsubscribe();
  }, []);

  const handleAddMovie = async () => {
    if (!title.trim() || !date || rating === 0) {
      alert('Bitte fülle alle Felder aus und gib eine Bewertung ab.');
      return;
    }

    try {
      setIsLoading(true);
      await addMovie({ title: title.trim(), date, rating });
      setTitle('');
      setDate(today);
      setRating(0);
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Films:', error);
      alert('Fehler beim Hinzufügen des Films.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMovie = (movie: Movie) => {
    setEditEntry({ isOpen: true, entryId: movie.id!, title: movie.title, date: movie.date, rating: movie.rating });
  };

  const handleUpdateMovie = async () => {
    if (!editEntry.entryId || !editEntry.title.trim() || !editEntry.date || editEntry.rating === 0) return;

    try {
      setIsLoading(true);
      await updateMovie(editEntry.entryId, { title: editEntry.title.trim(), date: editEntry.date, rating: editEntry.rating });
      cancelEdit();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Films:', error);
      alert('Fehler beim Aktualisieren des Films.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMovie = (movieId: string, movieTitle: string) => {
    setDeleteConfirmation({ isOpen: true, entryId: movieId, entryText: movieTitle });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.entryId) return;

    try {
      await deleteMovie(deleteConfirmation.entryId);
      cancelDelete();
    } catch (error) {
      console.error('Fehler beim Löschen des Films:', error);
      alert('Fehler beim Löschen des Films.');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, entryId: null, entryText: '' });
  };

  const cancelEdit = () => {
    setEditEntry({ isOpen: false, entryId: null, title: '', date: '', rating: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Neuen Film hinzufügen</h1>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Filmtitel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                <StarRating rating={rating} setRating={setRating} />
              </div>
            </div>
            <button
              onClick={handleAddMovie}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-md"
            >
              {isLoading ? 'Wird hinzugefügt...' : 'Film hinzufügen'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gesehene Filme</h2>
          {Object.keys(moviesByYear).length > 0 ? (
            Object.keys(moviesByYear).sort((a, b) => Number(b) - Number(a)).map(year => (
              <div key={year}>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 my-4">{year}</h3>
                <div className="space-y-4">
                  {moviesByYear[year].map(movie => (
                    <div key={movie.id} className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex-grow">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">{movie.title}</h3>
                        <div className="flex items-center mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <span>{new Date(movie.date).toLocaleDateString('de-DE')}</span>
                          <span className="mx-2">|</span>
                          <div className="flex items-center">
                            {[...Array(10)].map((_, i) => (
                              <svg key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i < movie.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col sm:space-y-1 ml-2 sm:ml-4">
                        <button onClick={() => handleEditMovie(movie)} className="text-indigo-500 hover:text-indigo-700 p-1" title="Film bearbeiten">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteMovie(movie.id!, movie.title)} className="text-red-500 hover:text-red-700 p-1" title="Film löschen">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <p className="text-gray-500 dark:text-gray-400">Noch keine Filme hinzugefügt.</p>
            </div>
          )}
        </div>
        <div className="mt-6 text-center">
            <Link href="/" className="text-indigo-600 hover:underline">
                Zurück zur Startseite
            </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Film löschen</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Möchtest du diesen Film wirklich löschen?</p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">&quot;{deleteConfirmation.entryText}&quot;</p>
            </div>
            <div className="flex gap-3">
              <button onClick={cancelDelete} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Abbrechen</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Löschen</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editEntry.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Film bearbeiten</h3>
            <div className="space-y-4">
              <input type="text" value={editEntry.title} onChange={(e) => setEditEntry({...editEntry, title: e.target.value})} className="w-full p-3 border rounded-lg" />
              <input type="date" value={editEntry.date} onChange={(e) => setEditEntry({...editEntry, date: e.target.value})} className="w-full p-3 border rounded-lg" />
              <StarRating rating={editEntry.rating} setRating={(r) => setEditEntry({...editEntry, rating: r})} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={cancelEdit} className="flex-1 px-4 py-2 border rounded-lg">Abbrechen</button>
              <button onClick={handleUpdateMovie} disabled={isLoading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">{isLoading ? 'Speichern...' : 'Speichern'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
