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

  // Lazy Loading State
  const [displayedCount, setDisplayedCount] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Get latest activity for display
  const latestActivity = journeyDays.length > 0 ? journeyDays[0] : null;

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

  // Hilfsfunktion für Tausenderpunktierung
  const formatNumber = (num: number): string => {
    return num.toLocaleString('de-DE', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 1 
    });
  };

  // Firebase Realtime Listener
  useEffect(() => {
    const unsubscribe = subscribeToJourneyDays((days) => {
      // Sortiere nach Datum (neueste zuerst)
      const sortedDays = days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setJourneyDays(sortedDays);
    });

    return () => unsubscribe();
  }, []);

  // Jahr-Filter handhaben
  const handleYearFilter = () => {
    setSelectedFilter('year');
    setSelectedMonth(null); // Reset month selection when switching to year filter
  };

  // Wochen-Filter handhaben
  const handleWeekFilter = () => {
    setSelectedFilter('month');
    setSelectedWeek(null); // Reset week selection when switching to week filter
  };

  // Jahr für Wochenansicht ändern
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSelectedWeek(null); // Reset week selection when changing year
  };

  // Funktion um die Anzahl der Aktivitäten pro Woche zu ermitteln
  const getWeekActivityCount = (weekNumber: number) => {
    const yearStart = new Date(selectedYear, 0, 1);
    
    if (weekNumber === 0) {
      // Erste Woche: vom 1. Januar bis zum ersten Sonntag
      const weekStart = new Date(yearStart);
      weekStart.setHours(0, 0, 0, 0);
      
      // Finde den ersten Sonntag des Jahres
      const firstSunday = new Date(yearStart);
      const dayOfWeek = firstSunday.getDay(); // 0 = Sonntag, 1 = Montag, etc.
      
      if (dayOfWeek === 0) {
        // 1. Januar ist bereits ein Sonntag
        firstSunday.setHours(23, 59, 59, 999);
      } else {
        // Finde den nächsten Sonntag
        const daysToSunday = 7 - dayOfWeek;
        firstSunday.setDate(firstSunday.getDate() + daysToSunday);
        firstSunday.setHours(23, 59, 59, 999);
      }
      
      return journeyDays.filter(day => {
        const dayDate = new Date(day.date + 'T12:00:00');
        return dayDate >= weekStart && dayDate <= firstSunday;
      }).length;
    } else {
      // Alle anderen Wochen: normale Montag-Sonntag Wochen
      const yearStart = new Date(selectedYear, 0, 1);
      
      // Finde ersten Montag nach dem ersten Sonntag
      const firstSunday = new Date(yearStart);
      const dayOfWeek = firstSunday.getDay();
      
      if (dayOfWeek === 0) {
        // 1. Januar ist ein Sonntag, nächster Montag ist am 2. Januar
        firstSunday.setDate(firstSunday.getDate() + 1);
      } else {
        // Finde den ersten Sonntag, dann den nächsten Montag
        const daysToSunday = 7 - dayOfWeek;
        firstSunday.setDate(firstSunday.getDate() + daysToSunday + 1); // +1 für Montag
      }
      
      // Berechne Start der Woche (Montag)
      const weekStart = new Date(firstSunday);
      weekStart.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);
      weekStart.setHours(0, 0, 0, 0);
      
      // Berechne Ende der Woche (Sonntag)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      return journeyDays.filter(day => {
        const dayDate = new Date(day.date + 'T12:00:00');
        return dayDate >= weekStart && dayDate <= weekEnd;
      }).length;
    }
  };

  // Berechne die Gesamt-Kilometer für eine Woche
  const getWeekKilometers = (weekNumber: number) => {
    const yearStart = new Date(selectedYear, 0, 1);
    
    if (weekNumber === 0) {
      // Erste Woche: vom 1. Januar bis zum ersten Sonntag
      const weekStart = new Date(yearStart);
      weekStart.setHours(0, 0, 0, 0);
      
      // Finde den ersten Sonntag des Jahres
      const firstSunday = new Date(yearStart);
      const dayOfWeek = firstSunday.getDay(); // 0 = Sonntag, 1 = Montag, etc.
      
      if (dayOfWeek === 0) {
        // 1. Januar ist bereits ein Sonntag
        firstSunday.setHours(23, 59, 59, 999);
      } else {
        // Finde den nächsten Sonntag
        const daysToSunday = 7 - dayOfWeek;
        firstSunday.setDate(firstSunday.getDate() + daysToSunday);
        firstSunday.setHours(23, 59, 59, 999);
      }
      
      return Math.round(journeyDays.filter(day => {
        const dayDate = new Date(day.date + 'T12:00:00');
        return dayDate >= weekStart && dayDate <= firstSunday;
      }).reduce((sum, day) => {
        const km = day.kilometer ? parseFloat(day.kilometer.toString()) : 0;
        return sum + (isNaN(km) ? 0 : km);
      }, 0) * 10) / 10;
    } else {
      // Alle anderen Wochen: normale Montag-Sonntag Wochen
      const yearStart = new Date(selectedYear, 0, 1);
      
      // Finde ersten Montag nach dem ersten Sonntag
      const firstSunday = new Date(yearStart);
      const dayOfWeek = firstSunday.getDay();
      
      if (dayOfWeek === 0) {
        // 1. Januar ist ein Sonntag, nächster Montag ist am 2. Januar
        firstSunday.setDate(firstSunday.getDate() + 1);
      } else {
        // Finde den ersten Sonntag, dann den nächsten Montag
        const daysToSunday = 7 - dayOfWeek;
        firstSunday.setDate(firstSunday.getDate() + daysToSunday + 1); // +1 für Montag
      }
      
      // Berechne Start der Woche (Montag)
      const weekStart = new Date(firstSunday);
      weekStart.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);
      weekStart.setHours(0, 0, 0, 0);
      
      // Berechne Ende der Woche (Sonntag)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      return Math.round(journeyDays.filter(day => {
        const dayDate = new Date(day.date + 'T12:00:00');
        return dayDate >= weekStart && dayDate <= weekEnd;
      }).reduce((sum, day) => {
        const km = day.kilometer ? parseFloat(day.kilometer.toString()) : 0;
        return sum + (isNaN(km) ? 0 : km);
      }, 0) * 10) / 10;
    }
  };

  // Berechne die Anzahl der Wochen im Jahr bis jetzt
  const getWeeksInYear = () => {
    const now = new Date();
    const yearStart = new Date(selectedYear, 0, 1);
    
    // Wenn das ausgewählte Jahr in der Zukunft liegt, zeige alle 52 Wochen
    if (selectedYear > now.getFullYear()) {
      return 52;
    }
    
    // Wenn das ausgewählte Jahr in der Vergangenheit liegt, zeige alle 52 Wochen
    if (selectedYear < now.getFullYear()) {
      return 52;
    }
    
    // Für das aktuelle Jahr: berechne wie viele Wochen seit dem 1. Januar vergangen sind
    const daysSinceYearStart = Math.floor((now.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000));
    
    // Erste Woche: vom 1. Januar bis zum ersten Sonntag
    const firstSunday = new Date(yearStart);
    const dayOfWeek = firstSunday.getDay();
    const daysInFirstWeek = dayOfWeek === 0 ? 1 : 7 - dayOfWeek + 1;
    
    if (daysSinceYearStart < daysInFirstWeek) {
      // Wir sind noch in der ersten Woche
      return 1;
    }
    
    // Berechne die Anzahl kompletter Wochen nach der ersten Woche
    const daysAfterFirstWeek = daysSinceYearStart - daysInFirstWeek;
    const completeWeeksAfterFirst = Math.floor(daysAfterFirstWeek / 7);
    
    // Prüfe ob wir uns in einer laufenden Woche befinden
    const daysInCurrentWeek = daysAfterFirstWeek % 7;
    const hasCurrentWeek = daysInCurrentWeek >= 0 ? 1 : 0;
    
    // Erste Woche + komplette Wochen danach + laufende Woche (falls vorhanden)
    return 1 + completeWeeksAfterFirst + hasCurrentWeek;
  };

  // Hilfsfunktion um das Datum einer Woche zu bekommen
  const getWeekDates = (weekNumber: number) => {
    const yearStart = new Date(selectedYear, 0, 1);
    
    if (weekNumber === 0) {
      // Erste Woche: vom 1. Januar bis zum ersten Sonntag
      const weekStart = new Date(yearStart);
      
      // Finde den ersten Sonntag des Jahres
      const firstSunday = new Date(yearStart);
      const dayOfWeek = firstSunday.getDay(); // 0 = Sonntag, 1 = Montag, etc.
      
      if (dayOfWeek === 0) {
        // 1. Januar ist bereits ein Sonntag
        // Woche ist nur der 1. Januar
        return {
          start: weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
          end: weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
        };
      } else {
        // Finde den nächsten Sonntag
        const daysToSunday = 7 - dayOfWeek;
        firstSunday.setDate(firstSunday.getDate() + daysToSunday);
        
        return {
          start: weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
          end: firstSunday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
        };
      }
    } else {
      // Alle anderen Wochen: normale Montag-Sonntag Wochen
      const yearStart = new Date(selectedYear, 0, 1);
      
      // Finde ersten Montag nach dem ersten Sonntag
      const firstSunday = new Date(yearStart);
      const dayOfWeek = firstSunday.getDay();
      
      if (dayOfWeek === 0) {
        // 1. Januar ist ein Sonntag, nächster Montag ist am 2. Januar
        firstSunday.setDate(firstSunday.getDate() + 1);
      } else {
        // Finde den ersten Sonntag, dann den nächsten Montag
        const daysToSunday = 7 - dayOfWeek;
        firstSunday.setDate(firstSunday.getDate() + daysToSunday + 1); // +1 für Montag
      }
      
      // Berechne Start der Woche (Montag)
      const weekStart = new Date(firstSunday);
      weekStart.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);
      
      // Berechne Ende der Woche (Sonntag)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return {
        start: weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        end: weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
      };
    }
  };

  // Prüfe ob für die erste Woche alle Tage abgedeckt sind (nur für Woche 0)
  const isFirstWeekComplete = (weekNumber: number) => {
    if (weekNumber !== 0) return false;
    
    const yearStart = new Date(selectedYear, 0, 1);
    const firstSunday = new Date(yearStart);
    const dayOfWeek = firstSunday.getDay();
    
    // Berechne alle Tage von 1. Januar bis zum ersten Sonntag
    const daysInFirstWeek = [];
    
    if (dayOfWeek === 0) {
      // 1. Januar ist bereits ein Sonntag
      daysInFirstWeek.push(yearStart.toISOString().split('T')[0]);
    } else {
      // Alle Tage von 1. Januar bis zum ersten Sonntag
      const daysToSunday = 7 - dayOfWeek;
      for (let i = 0; i <= daysToSunday; i++) {
        const day = new Date(yearStart);
        day.setDate(yearStart.getDate() + i);
        daysInFirstWeek.push(day.toISOString().split('T')[0]);
      }
    }
    
    // Prüfe ob für jeden Tag ein Eintrag vorhanden ist
    return daysInFirstWeek.every(date => 
      journeyDays.some(day => day.date === date)
    );
  };

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
        date: date,
        kilometer: kilometer === '' ? undefined : kilometer
      });
      
      // Formular zurücksetzen
      setEntry('');
      setDate(today);
      setKilometer('');
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Aktivität:', error);
      alert('Fehler beim Speichern der Aktivität. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  // Aktivität löschen
  const handleDeleteEntry = async (entryId: string, entryText: string) => {
    setDeleteConfirmation({
      isOpen: true,
      entryId: entryId,
      entryText: entryText
    });
  };

  // Löschung bestätigen
  const confirmDelete = async () => {
    if (deleteConfirmation.entryId) {
      try {
        await deleteJourneyDay(deleteConfirmation.entryId);
      } catch (error) {
        console.error('Fehler beim Löschen der Aktivität:', error);
        alert('Fehler beim Löschen der Aktivität.');
      }
    }
    setDeleteConfirmation({
      isOpen: false,
      entryId: null,
      entryText: ''
    });
  };

  // Löschung abbrechen
  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      entryId: null,
      entryText: ''
    });
  };

  // Aktivität bearbeiten öffnen
  const handleEditEntry = (day: JourneyDay) => {
    setEditEntry({
      isOpen: true,
      entryId: day.id!,
      destination: day.destination,
      date: day.date,
      kilometer: day.kilometer || ''
    });
  };

  // Bearbeitung speichern
  const handleSaveEdit = async () => {
    if (!editEntry.destination.trim()) {
      alert('Bitte beschreibe deine Aktivität!');
      return;
    }

    try {
      await updateJourneyDay(editEntry.entryId!, {
        destination: editEntry.destination.trim(),
        date: editEntry.date,
        kilometer: editEntry.kilometer === '' ? undefined : editEntry.kilometer
      });
      
      // Modal schließen
      setEditEntry({
        isOpen: false,
        entryId: null,
        destination: '',
        date: '',
        kilometer: ''
      });
      
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Aktivität:', error);
      alert('Fehler beim Speichern der Änderungen. Bitte versuche es erneut.');
    }
  };

  // Bearbeitung abbrechen
  const cancelEdit = () => {
    setEditEntry({
      isOpen: false,
      entryId: null,
      destination: '',
      date: '',
      kilometer: ''
    });
  };

  // Lazy Loading beim Scrollen
  const loadMoreEntries = () => {
    if (isLoadingMore || displayedCount >= filteredJourneyDays.length) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + 5, filteredJourneyDays.length));
      setIsLoadingMore(false);
    }, 300); // Kleine Verzögerung für smooth loading
  };

  // Scroll Event Listener für Lazy Loading
  useEffect(() => {
    if (currentView !== 'list') return;

    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop 
          >= document.documentElement.offsetHeight - 1000) {
        loadMoreEntries();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView, displayedCount, filteredJourneyDays.length, isLoadingMore]);

  // Reset displayedCount when switching to list view or when filters change
  useEffect(() => {
    if (currentView === 'list') {
      setDisplayedCount(1);
    }
  }, [currentView, selectedFilter, customDateStart, customDateEnd, selectedMonth, selectedWeek, searchTerm]);

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

      {/* List View */}
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
                Meine Aktivitäten
              </h1>
              
              <div className="w-20"></div>
            </div>
            
            {/* Filter Section */}
            {journeyDays.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-4">
                <div className="grid grid-cols-5 gap-2">
                  <button
                    onClick={() => {
                      setSelectedFilter('week')
                      setSelectedMonth(null)
                      setSelectedWeek(null)
                      setIsSearchActive(false)
                      setSearchTerm('')
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedFilter === 'week' && !isSearchActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    7 Tage
                  </button>
                  <button
                    onClick={() => {
                      handleWeekFilter()
                      setIsSearchActive(false)
                      setSearchTerm('')
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedFilter === 'month' && !isSearchActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Wochen
                  </button>
                  <button
                    onClick={() => {
                      handleYearFilter()
                      setIsSearchActive(false)
                      setSearchTerm('')
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedFilter === 'year' && !isSearchActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Jahr
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFilter('custom')
                      setSelectedMonth(null)
                      setSelectedWeek(null)
                      setIsSearchActive(false)
                      setSearchTerm('')
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedFilter === 'custom' && !isSearchActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Zeitraum
                  </button>
                  <button
                    onClick={() => {
                      setIsSearchActive(!isSearchActive)
                      setSearchTerm('')
                      setSelectedMonth(null)
                      setSelectedWeek(null)
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSearchActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Suchen
                  </button>
                </div>
                
                {/* Search Input */}
                {isSearchActive && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600 mt-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nach Destination suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        autoFocus
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Week Selection for Month Filter */}
                {selectedFilter === 'month' && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600 mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs text-gray-600 dark:text-gray-400">Woche auswählen:</label>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 dark:text-gray-400">Jahr:</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => handleYearChange(Number(e.target.value))}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {Array.from({ length: 6 }, (_, i) => {
                            const year = new Date().getFullYear() - 5 + i;
                            return (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                      {Array.from({ length: getWeeksInYear() }, (_, index) => {
                        const weekNumber = index;
                        const activityCount = getWeekActivityCount(weekNumber);
                        const weekKilometers = getWeekKilometers(weekNumber);
                        const weekDates = getWeekDates(weekNumber);
                        
                        // Bestimme die Farbe basierend auf der Anzahl der Aktivitäten
                        let colorClass = '';
                        if (weekNumber === 0) {
                          // Erste Woche: Grün nur wenn alle Tage vom 1. Januar bis zum ersten Sonntag abgedeckt sind
                          if (isFirstWeekComplete(weekNumber)) {
                            colorClass = 'bg-green-500'; // Grün für vollständige erste Woche
                          } else if (activityCount > 0) {
                            colorClass = 'bg-yellow-500'; // Gelb für teilweise abgedeckte erste Woche
                          } else {
                            colorClass = 'bg-red-500'; // Rot für keine Aktivitäten
                          }
                        } else {
                          // Alle anderen Wochen: normale Logik
                          if (activityCount > 7) {
                            colorClass = 'bg-purple-500'; // Lila für >7 Aktivitäten
                          } else if (activityCount === 7) {
                            colorClass = 'bg-green-500'; // Grün für genau 7 Aktivitäten
                          } else if (activityCount > 0) {
                            colorClass = 'bg-yellow-500'; // Gelb für 1-6 Aktivitäten
                          } else {
                            colorClass = 'bg-red-500'; // Rot für 0 Aktivitäten
                          }
                        }
                        
                        return (
                          <button
                            key={weekNumber}
                            onClick={() => setSelectedWeek(weekNumber)}
                            className={`w-6 h-6 rounded-sm text-xs font-medium transition-all flex items-center justify-center ${
                              selectedWeek === weekNumber
                                ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-gray-800'
                                : ''
                            } ${colorClass} text-white hover:scale-110`}
                            title={`Woche ${weekNumber + 1} (${weekDates.start} - ${weekDates.end}): ${activityCount} Aktivitäten${weekKilometers > 0 ? ` • ${formatNumber(weekKilometers)} km` : ''}`}
                          >
                            {weekNumber + 1}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                        <span>&gt;7 Aktivitäten</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                        <span>7 Aktivitäten</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                        <span>1-6 Aktivitäten</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                        <span>0 Aktivitäten</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Month Selection for Year Filter */}
                {selectedFilter === 'year' && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600 mt-3">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Monat auswählen:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { month: 0, name: 'Jan' },
                        { month: 1, name: 'Feb' },
                        { month: 2, name: 'Mär' },
                        { month: 3, name: 'Apr' },
                        { month: 4, name: 'Mai' },
                        { month: 5, name: 'Jun' },
                        { month: 6, name: 'Jul' },
                        { month: 7, name: 'Aug' },
                        { month: 8, name: 'Sep' },
                        { month: 9, name: 'Okt' },
                        { month: 10, name: 'Nov' },
                        { month: 11, name: 'Dez' }
                      ].map((monthInfo) => {
                        const currentMonth = new Date().getMonth();
                        const isFuture = monthInfo.month > currentMonth;
                        
                        return (
                          <button
                            key={monthInfo.month}
                            onClick={() => !isFuture && setSelectedMonth(monthInfo.month)}
                            disabled={isFuture}
                            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              isFuture
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                                : selectedMonth === monthInfo.month
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {monthInfo.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Custom Date Range */}
                {selectedFilter === 'custom' && (
                  <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-600 mt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Von:</label>
                        <input
                          type="date"
                          value={customDateStart}
                          onChange={(e) => setCustomDateStart(e.target.value)}
                          className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Bis:</label>
                        <input
                          type="date"
                          value={customDateEnd}
                          onChange={(e) => setCustomDateEnd(e.target.value)}
                          className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Journal Entries Section - nur in List View */}
      {currentView === 'list' && journeyDays.length > 0 && (
        <section className="py-2 px-4">
          <div className="max-w-md mx-auto">

            {/* Wochenstatistik */}
            {selectedFilter === 'month' && selectedWeek !== null && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-4 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                      Woche {selectedWeek + 1} • {getWeekDates(selectedWeek).start} - {getWeekDates(selectedWeek).end}
                    </h3>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">
                      {getWeekActivityCount(selectedWeek)} Aktivitäten
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {formatNumber(getWeekKilometers(selectedWeek))} km
                    </div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300">Gesamt</div>
                  </div>
                </div>
              </div>
            )}

            {/* Activities List */}
            <div className="space-y-4">
              {selectedFilter === 'custom' && (!customDateStart || !customDateEnd) ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Bitte wähle einen Zeitraum aus, um Aktivitäten anzuzeigen.
                  </p>
                </div>
              ) : selectedFilter === 'year' && selectedMonth === null ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Bitte wähle einen Monat aus, um Aktivitäten anzuzeigen.
                  </p>
                </div>
              ) : selectedFilter === 'month' && selectedWeek === null ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Bitte wähle eine Woche aus, um Aktivitäten anzuzeigen.
                  </p>
                </div>
              ) : filteredJourneyDays.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Keine Aktivitäten für den gewählten Zeitraum gefunden.
                  </p>
                </div>
              ) : (
                <>
                  {filteredJourneyDays.slice(0, displayedCount).map((day) => (
                  <div key={day.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                            {new Date(day.date).toLocaleDateString('de-DE', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {day.kilometer && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              {formatNumber(parseFloat(day.kilometer.toString()))}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 dark:text-white leading-relaxed">
                          {day.destination}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditEntry(day)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Aktivität bearbeiten"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(day.id!, day.destination)}
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
                  ))}
                  
                  {/* Loading Indicator */}
                  {isLoadingMore && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center text-indigo-600 dark:text-indigo-400">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Lade weitere Aktivitäten...
                      </div>
                    </div>
                  )}
                  
                  {/* Show More Button (als Alternative zum automatischen Laden) */}
                  {!isLoadingMore && displayedCount < filteredJourneyDays.length && (
                    <div className="text-center py-4">
                      <button
                        onClick={loadMoreEntries}
                        className="px-6 py-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200"
                      >
                        Weitere Aktivitäten laden ({filteredJourneyDays.length - displayedCount} verbleibend)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Empty state für List View wenn keine Einträge vorhanden */}
      {currentView === 'list' && journeyDays.length === 0 && (
        <section className="min-h-screen flex items-center justify-center py-4 px-4">
          <div className="max-w-md mx-auto text-center w-full">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
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
                "{deleteConfirmation.entryText}"
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
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
