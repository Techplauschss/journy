'use client';

import { useState, useEffect } from 'react';
import { addJourneyDay, subscribeToJourneyDays, deleteJourneyDay, JourneyDay } from '../lib/journeyService';

export default function Home() {
  // Aktuelles Datum im YYYY-MM-DD Format für den Datepicker
  const today = new Date().toISOString().split('T')[0];
  
  // State für Formulardaten
  const [entry, setEntry] = useState('');
  const [date, setDate] = useState(today);
  const [journeyDays, setJourneyDays] = useState<JourneyDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Firebase Realtime Listener
  useEffect(() => {
    const unsubscribe = subscribeToJourneyDays((days) => {
      // Sortiere nach Datum (neueste zuerst)
      const sortedDays = days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setJourneyDays(sortedDays);
    });

    return () => unsubscribe();
  }, []);

  // Aktivität hinzufügen
  const handleAddEntry = async () => {
    if (!entry.trim()) {
      alert('Bitte beschreibe deine Aktivität!');
      return;
    }

    setIsLoading(true);
    try {
      await addJourneyDay({
        destination: entry.trim(),
        date: date
      });
      
      // Formular zurücksetzen
      setEntry('');
      setDate(today);
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Aktivität:', error);
      alert('Fehler beim Speichern der Aktivität. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  // Aktivität löschen
  const handleDeleteEntry = async (entryId: string) => {
    if (confirm('Möchtest du diese Aktivität wirklich löschen?')) {
      try {
        await deleteJourneyDay(entryId);
      } catch (error) {
        console.error('Fehler beim Löschen der Aktivität:', error);
        alert('Fehler beim Löschen der Aktivität.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-50 border-b border-gray-200/20">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-center items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Journy</h1>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Willkommen bei{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Journy
            </span>
          </h1>
          
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                  Was habe ich heute gemacht?
                </label>
                <textarea
                  id="destination"
                  placeholder="Beschreibe deine Aktivitäten..."
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  rows={2}
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
              </div>
              
              <div>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
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

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Dokumentiere deine täglichen Aktivitäten und behalte den Überblick über deinen Tag.
          </p>
        </div>
      </section>

      {/* Journal Entries Section */}
      {journeyDays.length > 0 && (
        <section className="py-8 px-4">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Meine Aktivitäten
            </h2>
            <div className="space-y-4">
              {journeyDays.map((day) => (
                <div key={day.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                        {new Date(day.date).toLocaleDateString('de-DE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-gray-900 dark:text-white mt-2 leading-relaxed">
                        {day.destination}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(day.id!)}
                      className="text-red-500 hover:text-red-700 p-1 ml-2"
                      title="Aktivität löschen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="py-12 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Über Journy
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Deine persönliche App um zu dokumentieren, was du täglich machst und erlebst.
            </p>
          </div>
          <div className="space-y-6">
            <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aktivitäten festhalten</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Dokumentiere was du täglich machst und erlebst.</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12v-4m0 0V7m0 6l-4-4m4 4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Überblick behalten</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Verfolge deine täglichen Fortschritte und Gewohnheiten.</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Erinnerungen</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Schaue zurück auf vergangene Tage und Aktivitäten.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Warum Aktivitäten dokumentieren?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Entdecke die Vorteile des täglichen Dokumentierens.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { title: "Produktivität", description: "Erkenne was dich produktiv macht und optimiere deinen Tag" },
              { title: "Gewohnheiten", description: "Verfolge deine Routinen und baue positive Gewohnheiten auf" },
              { title: "Zeitmanagement", description: "Verstehe wie du deine Zeit wirklich verbringst" },
              { title: "Motivation", description: "Sehe deine Fortschritte und bleibe motiviert" }
            ].map((service, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{service.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Feedback
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Hast du Ideen oder Verbesserungsvorschläge? Wir freuen uns auf dein Feedback!
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kontakt</h3>
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center">
                    📧 feedback@journy.app
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center">
                    � Teile deine Erfahrungen mit uns
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center">
                    🌱 Hilf uns, Journy zu verbessern
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nachricht senden</h3>
                <form className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="Deine E-Mail" 
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <textarea 
                    placeholder="Dein Feedback" 
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  ></textarea>
                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
                    Feedback senden
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 bg-gray-900 text-white">
        <div className="max-w-md mx-auto text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Journy. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
}
