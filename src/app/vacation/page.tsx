"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { addTrip, subscribeToTrips, deleteTrip, type Trip } from '../../lib/journeyService';

export default function VacationPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [companions, setCompanions] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to trips from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToTrips((data: Trip[]) => {
      // Sort by date (newest first)
      const sorted = [...data].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setTrips(sorted);
    });

    return () => unsubscribe();
  }, []);

  const handleAddTrip = async () => {
    if (!startDate || !endDate || !location.trim()) {
      alert('Bitte fülle mindestens Startdatum, Enddatum und Ort aus.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Das Enddatum muss nach dem Startdatum liegen.');
      return;
    }

    try {
      setIsLoading(true);
      await addTrip({
        startDate,
        endDate,
        location: location.trim(),
        companions: companions.trim() || undefined
      });

      // Reset form
      setStartDate('');
      setEndDate('');
      setLocation('');
      setCompanions('');
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Reise:', error);
      alert('Fehler beim Hinzufügen der Reise. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    try {
      await deleteTrip(id);
    } catch (error) {
      console.error('Fehler beim Löschen der Reise:', error);
      alert('Fehler beim Löschen der Reise. Bitte versuche es erneut.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reisen</h1>
          <p className="text-gray-600 dark:text-gray-300">Dokumentiere deine Urlaube und Reisen</p>
        </div>

        {/* Add Trip Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Neue Reise hinzufügen</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Startdatum
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enddatum
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ort
              </label>
              <input
                type="text"
                id="location"
                placeholder="z.B. Spanien, Südfrankreich, Berlin"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="companions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mitreisende (optional)
              </label>
              <input
                type="text"
                id="companions"
                placeholder="z.B. Partner, Familie, Freunde"
                value={companions}
                onChange={(e) => setCompanions(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              onClick={handleAddTrip}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading ? 'Wird gespeichert...' : 'Reise hinzufügen'}
            </button>
          </div>
        </div>

        {/* Trips List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {trips.length === 0 ? 'Keine Reisen' : `${trips.length} ${trips.length === 1 ? 'Reise' : 'Reisen'}`}
          </h2>

          {trips.length > 0 ? (
            <div className="space-y-4">
              {trips.map((trip) => (
                <div key={trip.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-start">
                    <Link href={`/vacation/details?id=${trip.id}`} className="flex-1 cursor-pointer hover:opacity-75 transition-opacity">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {trip.location}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <p>
                          <span className="font-medium">Zeitraum:</span> {new Date(trip.startDate).toLocaleDateString('de-DE')} - {new Date(trip.endDate).toLocaleDateString('de-DE')}
                        </p>
                        {trip.companions && (
                          <p>
                            <span className="font-medium">Mitreisende:</span> {trip.companions}
                          </p>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => trip.id && handleDeleteTrip(trip.id)}
                      className="text-red-500 hover:text-red-700 p-2 ml-4"
                      title="Reise löschen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.5 19.5 21 12l-18.5-7.5L7 12l-4.5 7.5zM7 12l5 1 5-1" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300">Füge deine erste Reise hinzu, um sie hier zu sehen.</p>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="flex justify-center mt-6">
          <Link href="/">
            <button className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors shadow-sm">
              Zurück zur Übersicht
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
