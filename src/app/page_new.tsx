'use client';

import { useState, useEffect } from 'react';
import { addJourneyDay, subscribeToJourneyDays, deleteJourneyDay, updateJourneyDay, JourneyDay } from '../lib/journeyService';

export default function Home() {
  // Aktuelles Datum im YYYY-MM-DD Format für den Datepicker
  const today = new Date().toISOString().split('T')[0];
  
  // State für Formulardaten
  const [entry, setEntry] = useState('');
  const [date, setDate] = useState(today);
  const [kilometer, setKilometer] = useState<number | ''>('');
  const [journeyDays, setJourneyDays] = useState<JourneyDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Page State
  const [currentView, setCurrentView] = useState<'add' | 'list'>('add');

  // Get latest activity for display (sorted by date, newest first)
  const latestActivity = journeyDays.length > 0 
    ? [...journeyDays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  // Edit State
  const [editEntry, setEditEntry] = useState<{
    isOpen: boolean;
    entryId: string | null;
    destination: string;
    date: string;
    kilometer: number | '';
  }>({
    isOpen: false,
    entryId: null,
    destination: '',
    date: '',
    kilometer: ''
  });

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    entryId: string | null;
    entryText: string;
  }>({
    isOpen: false,
    entryId: null,
    entryText: ''
  });

  // Firebase Subscription
  useEffect(() => {
    const unsubscribe = subscribeToJourneyDays((days) => {
      setJourneyDays(days);
    });

    return () => unsubscribe();
  }, []);

  // Neuen Eintrag hinzufügen
  const handleAddEntry = async () => {
    if (!entry.trim() || !date) return;

    try {
      setIsLoading(true);
      await addJourneyDay({
        destination: entry.trim(),
        date: date,
        kilometer: kilometer === '' ? 0 : Number(kilometer)
      });
      
      // Formular zurücksetzen
      setEntry('');
      setDate(today);
      setKilometer('');
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Eintrags:', error);
      alert('Fehler beim Hinzufügen des Eintrags. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEntry = (day: JourneyDay) => {
    setEditEntry({
      isOpen: true,
      entryId: day.id!,
      destination: day.destination,
      date: day.date,
      kilometer: day.kilometer || ''
    });
  };

  const handleUpdateEntry = async () => {
    if (!editEntry.entryId || !editEntry.destination.trim() || !editEntry.date) return;

    try {
      setIsLoading(true);
      await updateJourneyDay(editEntry.entryId, {
        destination: editEntry.destination.trim(),
        date: editEntry.date,
        kilometer: editEntry.kilometer === '' ? 0 : Number(editEntry.kilometer)
      });
      
      cancelEdit();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Eintrags:', error);
      alert('Fehler beim Aktualisieren des Eintrags. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = (entryId: string, entryText: string) => {
    setDeleteConfirmation({
      isOpen: true,
      entryId,
      entryText: entryText.slice(0, 50) + (entryText.length > 50 ? '...' : '')
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.entryId) return;

    try {
      await deleteJourneyDay(deleteConfirmation.entryId);
      cancelDelete();
    } catch (error) {
      console.error('Fehler beim Löschen des Eintrags:', error);
      alert('Fehler beim Löschen des Eintrags. Bitte versuche es erneut.');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      entryId: null,
      entryText: ''
    });
  };

  const cancelEdit = () => {
    setEditEntry({
      isOpen: false,
      entryId: null,
      destination: '',
      date: '',
      kilometer: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Add Entry View */}
      {currentView === 'add' && (
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            {/* Input Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-4">
              <div className="space-y-4">
                <div>
                  <textarea
                    id="destination"
                    placeholder="Beschreibe deine Aktivitäten..."
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    rows={2}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      id="kilometer"
                      placeholder="Kilometer (optional)"
                      value={kilometer}
                      onChange={(e) => setKilometer(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleAddEntry}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Wird gespeichert...' : 'Aktivität hinzufügen'}
                </button>
              </div>
            </div>
            
            {/* Navigation Button */}
            <button
              onClick={() => setCurrentView('list')}
              className="mt-4 flex items-center justify-center mx-auto px-4 py-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200"
              title="Aktivitäten anzeigen"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Meine Aktivitäten anzeigen
            </button>
          </div>
        </section>
      )}

      {/* List View - Only Latest Activity */}
      {currentView === 'list' && (
        <section className="min-h-screen flex flex-col justify-center py-4 px-4">
          <div className="max-w-md mx-auto w-full">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentView('add')}
                className="flex items-center px-4 py-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200"
                title="Neuen Eintrag hinzufügen"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Neuer Eintrag
              </button>
              
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Letzte Aktivität
              </h1>
              
              <div className="w-20"></div>
            </div>

            {/* Latest Activity or Empty State */}
            {latestActivity ? (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                        {new Date(latestActivity.date).toLocaleDateString('de-DE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {latestActivity.kilometer && latestActivity.kilometer > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          {latestActivity.kilometer} km
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {latestActivity.destination}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-1 ml-4">
                    <button
                      onClick={() => handleEditEntry(latestActivity)}
                      className="text-indigo-500 hover:text-indigo-700 p-1"
                      title="Aktivität bearbeiten"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(latestActivity.id!, latestActivity.destination)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Aktivität löschen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Noch keine Aktivitäten
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Du hast noch keine Aktivitäten hinzugefügt. Beginne damit, deine erste Aktivität zu dokumentieren!
                </p>
                <button
                  onClick={() => setCurrentView('add')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg"
                >
                  Erste Aktivität hinzufügen
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Aktivität löschen
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Möchtest du diese Aktivität wirklich löschen?
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                &quot;{deleteConfirmation.entryText}&quot;
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editEntry.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Aktivität bearbeiten
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Destination
                </label>
                <input
                  type="text"
                  id="edit-destination"
                  value={editEntry.destination}
                  onChange={(e) => setEditEntry({...editEntry, destination: e.target.value})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Was hast du gemacht?"
                />
              </div>
              
              <div>
                <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  id="edit-date"
                  value={editEntry.date}
                  onChange={(e) => setEditEntry({...editEntry, date: e.target.value})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label htmlFor="edit-kilometer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kilometer (optional)
                </label>
                <input
                  type="number"
                  id="edit-kilometer"
                  value={editEntry.kilometer}
                  onChange={(e) => setEditEntry({...editEntry, kilometer: e.target.value === '' ? '' : Number(e.target.value)})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelEdit}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleUpdateEntry}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
