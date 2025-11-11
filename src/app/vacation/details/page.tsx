"use client";

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { subscribeToTrips, subscribeTripEntries, addTripEntry, deleteTripEntry, type Trip, type TripEntry } from '../../../lib/journeyService';
import { useSearchParams } from 'next/navigation';

function TripDetailContent() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get('id') || '';

  const [trip, setTrip] = useState<Trip | null>(null);
  const [entries, setEntries] = useState<TripEntry[]>([]);
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = subscribeToTrips((trips: Trip[]) => {
      const found = trips.find(t => t.id === tripId);
      setTrip(found || null);
    });

    return () => unsubscribe();
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = subscribeTripEntries(tripId, (data: TripEntry[]) => {
      setEntries(data);
    });

    return () => unsubscribe();
  }, [tripId]);

  const handleAddEntry = async () => {
    if (!date || !title.trim()) {
      alert('Bitte fülle mindestens Datum und Titel aus.');
      return;
    }

    try {
      setIsLoading(true);
      await addTripEntry({
        tripId,
        date,
        title: title.trim(),
        description: description.trim()
      });

      setDate('');
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Eintrags:', error);
      alert('Fehler beim Hinzufügen des Eintrags. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteTripEntry(tripId, entryId);
    } catch (error) {
      console.error('Fehler beim Löschen des Eintrags:', error);
      alert('Fehler beim Löschen des Eintrags. Bitte versuche es erneut.');
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">Reise wird geladen...</p>
          <Link href="/vacation">
            <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              Zurück zu Reisen
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/vacation" className="text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block">
            ← Zurück zu Reisen
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{trip.location}</h1>
          <div className="text-gray-600 dark:text-gray-300 space-y-1">
            <p>
              <span className="font-medium">Zeitraum:</span> {new Date(trip.startDate).toLocaleDateString('de-DE')} - {new Date(trip.endDate).toLocaleDateString('de-DE')}
            </p>
            {trip.companions && (
              <p>
                <span className="font-medium">Mitreisende:</span> {trip.companions}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Reiseverlauf eintragen</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  id="entryDate"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={trip.startDate}
                  max={trip.endDate}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="entryTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titel
                </label>
                <input
                  type="text"
                  id="entryTitle"
                  placeholder="z.B. Ankunft, Museumsbesuch, Wanderung"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="entryDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Beschreibung (optional)
              </label>
              <textarea
                id="entryDescription"
                placeholder="Schreibe Details zu diesem Tag auf..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <button
              onClick={handleAddEntry}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading ? 'Wird gespeichert...' : 'Eintrag hinzufügen'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {entries.length === 0 ? 'Kein Reiseverlauf' : `${entries.length} ${entries.length === 1 ? 'Eintrag' : 'Einträge'}`}
          </h2>

          {entries.length > 0 ? (
            <div className="relative px-8">
              {/* Timeline line - in the center behind the cards */}
              <div className="absolute left-1/2 transform -translate-x-1/2 top-3 bottom-0 w-1 bg-gradient-to-b from-indigo-400 via-indigo-500 to-indigo-600 dark:from-indigo-500 dark:via-indigo-600 dark:to-indigo-700 pointer-events-none"></div>

              {/* Entries */}
              <div className="space-y-6 relative">
                {entries.map((entry) => (
                  <div key={entry.id} className="relative">
                    {/* Entry content */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow relative z-10">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-2">
                            {new Date(entry.date).toLocaleDateString('de-DE', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {entry.title}
                          </h3>
                          {entry.description && (
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {entry.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => entry.id && handleDeleteEntry(entry.id)}
                          className="text-red-500 hover:text-red-700 p-2 flex-shrink-0"
                          title="Eintrag löschen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300">Füge einen Eintrag hinzu, um deinen Reiseverlauf zu dokumentieren.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TripDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Wird geladen...</p>
        </div>
      </div>
    }>
      <TripDetailContent />
    </Suspense>
  );
}
