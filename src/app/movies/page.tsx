'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { addMovie, subscribeToMovies, deleteMovie, updateMovie, Movie, MovieFolder, addMovieFolder, subscribeToMovieFolders, updateMovieFolder, deleteMovieFolder } from '../../lib/journeyService';

// Must-Watch-Karten-Komponente
const MustWatchCard = ({ movie, handleMarkAsWatched, handleDeleteMovie }: { 
  movie: Movie, 
  handleMarkAsWatched: (m: Movie) => void, 
  handleDeleteMovie: (id: string, title: string) => void
}) => (
  <div 
    draggable
    onDragStart={(e) => e.dataTransfer.setData('text/plain', movie.id!)}
    className={`p-3 ml-2 rounded-xl shadow-sm flex flex-col group border transition-all cursor-grab active:cursor-grabbing ${movie.title.includes('(K)') ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 hover:border-amber-400 dark:border-amber-700/50 dark:hover:border-amber-500' : 'bg-white dark:bg-gray-700 border-transparent hover:border-gray-300 dark:hover:border-gray-500'}`}
  >
    <div className="flex justify-between items-start">
      <p className="text-gray-900 dark:text-white flex-grow pr-2 font-medium leading-snug">{movie.title}</p>
      <div className="flex items-center shrink-0">
        <button onClick={() => handleMarkAsWatched(movie)} className="text-green-500 hover:text-green-700 p-1" title="Als gesehen markieren">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </button>
        <button onClick={() => handleDeleteMovie(movie.id!, movie.title)} className="text-red-500 hover:text-red-700 p-1 ml-1" title="Film löschen">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  </div>
);

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
              onMouseEnter={(e: React.MouseEvent<SVGSVGElement>) => {
              const el = e.currentTarget as unknown as HTMLElement;
              // make this and all previous sibling stars golden
              let prev: Element | null = el;
              while (prev) {
                (prev as HTMLElement).classList.add('text-yellow-400');
                (prev as HTMLElement).classList.remove('text-gray-300', 'dark:text-gray-600');
                prev = prev.previousElementSibling;
              }
              }}
              onMouseLeave={(e: React.MouseEvent<SVGSVGElement>) => {
              const container = e.currentTarget.parentElement;
              if (!container) return;
              // restore colors based on current rating
              Array.from(container.children).forEach((child, i) => {
                const val = i + 1;
                if (val <= rating) {
                child.classList.add('text-yellow-400');
                child.classList.remove('text-gray-300', 'dark:text-gray-600');
                } else {
                child.classList.remove('text-yellow-400');
                child.classList.add('text-gray-300', 'dark:text-gray-600');
                }
              });
              }}
              className={`w-6 h-6 cursor-pointer transition-transform duration-200 hover:scale-125 ${starValue <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
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
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [collapsedYears, setCollapsedYears] = useState<Record<string, boolean>>({});
    const initialCollapseDone = useRef(false);
  
    // Must-Watch Folder States
    const [folders, setFolders] = useState<MovieFolder[]>([]);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingFolderName, setEditingFolderName] = useState('');

    const [newMustWatchTitle, setNewMustWatchTitle] = useState('');
  
    // Edit State
    const [editEntry, setEditEntry] = useState<{ isOpen: boolean; entryId: string | null; title: string; date: string; rating: number; }>({ isOpen: false, entryId: null, title: '', date: '', rating: 0 });
  
    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; entryId: string | null; entryText: string; }>({ isOpen: false, entryId: null, entryText: '' });
  
    useEffect(() => {
      const unsubscribe = subscribeToMovies((movies) => {
        setAllMovies(movies);
        const sortedMovies = movies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const grouped = sortedMovies.reduce((acc, movie) => {
          if (movie.rating > 0) {
            const year = new Date(movie.date).getFullYear().toString();
            if (!acc[year]) {
              acc[year] = [];
            }
            acc[year].push(movie);
          }
          return acc;
        }, {} as {[year: string]: Movie[]});
        setMoviesByYear(grouped);
  
        if (movies.length > 0 && !initialCollapseDone.current) {
          const currentYear = new Date().getFullYear();
          const years = Object.keys(grouped);
          const initialCollapsedState: Record<string, boolean> = {};
          years.forEach(year => {
            if (parseInt(year) !== currentYear) {
              initialCollapsedState[year] = true;
            }
          });
          setCollapsedYears(initialCollapsedState);
          initialCollapseDone.current = true;
        }
      });
      return () => unsubscribe();
    }, []);

    // Folders laden
    useEffect(() => {
      const unsubscribe = subscribeToMovieFolders((fetchedFolders) => {
        setFolders(fetchedFolders);
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
  
    const handleAddMustWatch = async () => {
      if (!newMustWatchTitle.trim()) {
        return;
      }
      try {
        setIsLoading(true);
        const movieData: Partial<Movie> = { title: newMustWatchTitle.trim(), date: today, rating: 0 };
        await addMovie(movieData as Omit<Movie, 'id' | 'createdAt'>);
        setNewMustWatchTitle('');
      } catch (error) {
        console.error('Fehler beim Hinzufügen des Must-Watch-Films:', error);
        alert('Fehler beim Hinzufügen des Must-Watch-Films.');
      } finally {
        setIsLoading(false);
      }
    };
  
    const handleMarkAsWatched = (movie: Movie) => {
      setEditEntry({
        isOpen: true,
        entryId: movie.id!,
        title: movie.title,
        date: today,
        rating: 1, // Default to 1 star, user can change in modal
      });
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
  
    const handleCreateFolder = async () => {
      if (!newFolderName.trim()) return;
      setIsLoading(true);
      try {
        await addMovieFolder({ name: newFolderName.trim() });
        setNewFolderName('');
        setIsCreatingFolder(false);
      } catch (error) {
        console.error('Fehler beim Erstellen des Ordners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleRenameFolder = async () => {
      if (!editingFolderId || !editingFolderName.trim()) return setEditingFolderId(null);
      setIsLoading(true);
      try {
        await updateMovieFolder(editingFolderId, editingFolderName.trim());
        setEditingFolderId(null);
      } catch (error) {
        console.error('Fehler beim Umbenennen:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleDeleteFolder = async (folderId: string) => {
      if (confirm('Ordner wirklich löschen? Die enthaltenen Filme werden nach "Ungruppiert" verschoben.')) {
        setIsLoading(true);
        const moviesInFolder = allMovies.filter(m => m.folderId === folderId);
        for (const m of moviesInFolder) {
          await updateMovie(m.id!, { title: m.title, date: m.date, rating: m.rating, folderId: '' });
        }
        await deleteMovieFolder(folderId);
        setIsLoading(false);
      }
    };

    const cancelDelete = () => {
      setDeleteConfirmation({ isOpen: false, entryId: null, entryText: '' });
    };
  
    const cancelEdit = () => {
      setEditEntry({ isOpen: false, entryId: null, title: '', date: '', rating: 0 });
    };
  
    const mustWatches = allMovies.filter(movie => movie.rating === 0);
  
    const handleDrop = async (e: React.DragEvent, folderId: string) => {
      e.preventDefault();
      const movieId = e.dataTransfer.getData('text/plain');
      if (!movieId) return;
      
      const movie = allMovies.find(m => m.id === movieId);
      if (movie && (movie.folderId || '') !== folderId) {
        setIsLoading(true);
        try {
          await updateMovie(movieId, { title: movie.title, date: movie.date, rating: movie.rating, folderId });
        } catch (error) {
          console.error('Fehler beim Verschieben:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const handleExportCSV = () => {
      const watchedMovies = allMovies.filter(m => m.rating > 0).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (watchedMovies.length === 0) {
        alert('Keine gesehenen Filme vorhanden.');
        return;
      }
      
      const headers = ['Titel', 'Datum', 'Bewertung'];
      const csvRows = watchedMovies.map(movie => {
        const title = movie.title.replace(/"/g, '""'); // Escape double quotes for CSV
        return `"${title}",${movie.date},${movie.rating}`;
      });
      
      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for proper UTF-8 handling in Excel
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'gesehene_filme.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row justify-center gap-6 items-start max-w-7xl mx-auto">
          <div className="flex-1 w-full lg:max-w-2xl">
            <div className="bg-white dark:bg-gray-900 rounded-4xl p-6 shadow-2xl mb-6 hover:shadow-2xl hover:scale-102 transition-all duration-300">
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg hover:scale-101 duration-600"
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
                    <div className="flex items-center justify-between my-4">
                        <button
                        className="text-xl font-semibold text-gray-800 dark:text-gray-200 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors hover:shadow-2xl hover:scale-110 transition-all duration-300"
                        onClick={() => setCollapsedYears(prev => ({ ...prev, [year]: !prev[year] }))}
                        >
                        {year}
                        </button>
                      <button
                        onClick={() => setCollapsedYears(prev => ({ ...prev, [year]: !prev[year] }))}
                        className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600  hover:shadow-2xl hover:scale-110 transition-all duration-300"
                      >
                        {collapsedYears[year] ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>
                        )}
                      </button>
                    </div>
                    {!collapsedYears[year] && (
                      <div className="space-y-4">
                        {moviesByYear[year].filter(movie => movie.rating > 0).map(movie => (
                          <div key={movie.id} className={`p-3 sm:p-4 rounded-xl shadow-lg border flex items-center justify-between hover:shadow-2xl hover:scale-102 transition-all duration-300 ${movie.title.includes('(K)') ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
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
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <p className="text-gray-500 dark:text-gray-400">Noch keine Filme hinzugefügt.</p>
                </div>
              )}
            </div>
            <div className="flex justify-center mt-6">
                  <button
              onClick={() => window.location.href = '/'}
              className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
              title="Neuen Eintrag hinzufügen"
                  >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
                  </button>
              </div>
          </div>
    
          {/* Must-Watches Sidebar */}
          <div className="w-full lg:w-[26rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] flex flex-col">
            <div className="bg-white dark:bg-gray-900 rounded-4xl p-6 shadow-2xl flex flex-col h-full overflow-hidden">
              
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Must-Watches</h2>
                <button onClick={() => setIsCreatingFolder(!isCreatingFolder)} className="p-2 text-indigo-600 bg-indigo-50 dark:bg-gray-800 dark:text-indigo-400 hover:bg-indigo-100 rounded-full transition-colors" title="Neuen Ordner erstellen">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2z" /></svg>
                </button>
              </div>

              {isCreatingFolder && (
                <div className="flex gap-2 mb-4 shrink-0">
                  <input type="text" placeholder="Ordnername" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={handleCreateFolder} disabled={isLoading} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">OK</button>
                </div>
              )}

              <div className="space-y-2 mb-4 shrink-0">
                <div className="flex gap-2 mb-1">
                  <input
                    type="text"
                    placeholder="Neuen Film hinzufügen"
                    value={newMustWatchTitle}
                    onChange={(e) => setNewMustWatchTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMustWatch()}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddMustWatch}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 rounded-xl transition-colors shadow-md flex items-center justify-center"
                  >
                    {isLoading ? '...' : 'Hinzufügen'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-6">
                {/* Ordner rendern */}
                {folders.map(folder => {
                  const folderMovies = mustWatches.filter(m => m.folderId === folder.id);
                  return (
                    <div 
                      key={folder.id} 
                      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, folder.id!)}
                    >
                      <div className="flex justify-between items-center mb-3">
                        {editingFolderId === folder.id ? (
                          <input 
                            autoFocus 
                            value={editingFolderName} 
                            onChange={e => setEditingFolderName(e.target.value)}
                            onBlur={handleRenameFolder}
                            onKeyDown={e => e.key === 'Enter' && handleRenameFolder()}
                            className="flex-1 p-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded mr-2 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex-1 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => { setEditingFolderId(folder.id!); setEditingFolderName(folder.name); }} title="Klicken zum Umbenennen">
                            📁 {folder.name}
                          </h3>
                        )}
                        <button onClick={() => handleDeleteFolder(folder.id!)} className="text-gray-400 hover:text-red-500" title="Ordner löschen">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                      <div className="space-y-2 pl-2 border-l-2 border-indigo-100 dark:border-gray-600">
                        {folderMovies.length === 0 ? (
                          <p className="text-xs text-gray-500 italic ml-2">Leer</p>
                        ) : (
                          folderMovies.map(movie => <MustWatchCard key={movie.id} movie={movie} handleMarkAsWatched={handleMarkAsWatched} handleDeleteMovie={handleDeleteMovie} />)
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Ungruppierte rendern */}
                {(mustWatches.filter(m => !m.folderId).length > 0 || folders.length > 0) && (
                  <div 
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, '')}
                  >
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Ungruppiert</h3>
                    <div className="space-y-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                      {mustWatches.filter(m => !m.folderId).length === 0 ? (
                        <p className="text-xs text-gray-500 italic ml-2">Leer</p>
                      ) : (
                        mustWatches.filter(m => !m.folderId).map(movie => (
                          <MustWatchCard key={movie.id} movie={movie} handleMarkAsWatched={handleMarkAsWatched} handleDeleteMovie={handleDeleteMovie} />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
  
        {/* CSV Export Button */}
        <div className="max-w-7xl mx-auto mt-8 flex justify-center pb-8">
          <button
            onClick={handleExportCSV}
            className="px-6 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Gesehene Filme als CSV exportieren
          </button>
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
  

  