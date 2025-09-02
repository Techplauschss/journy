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
  const [filteredJourneyDays, setFilteredJourneyDays] = useState<JourneyDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter State
  const [selectedFilter, setSelectedFilter] = useState<'week' | 'month' | 'year' | 'custom'>('week');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

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

  // Firebase Realtime Listener
  useEffect(() => {
    const unsubscribe = subscribeToJourneyDays((days) => {
      // Sortiere nach Datum (neueste zuerst)
      const sortedDays = days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setJourneyDays(sortedDays);
    });

    return () => unsubscribe();
  }, []);

  // Filter Effekt
  useEffect(() => {
    const filterJourneyDays = () => {
      const now = new Date();
      let filtered: JourneyDay[] = [];
      
      // Wenn Suche aktiv ist, durchsuche alle Einträge
      if (isSearchActive && searchTerm.trim()) {
        filtered = journeyDays.filter(day => 
          day.destination.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        // Normale Filter-Logik
        switch (selectedFilter) {
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = journeyDays.filter(day => new Date(day.date) >= weekAgo);
            break;
            
          case 'month':
            if (selectedWeek !== null) {
              // Verwende die neue Wochenlogik
              const yearStart = new Date(selectedYear, 0, 1);
              
              if (selectedWeek === 0) {
                // Erste Woche: vom 1. Januar bis zum ersten Sonntag
                const weekStart = new Date(yearStart);
                weekStart.setHours(0, 0, 0, 0);
                
                const firstSunday = new Date(yearStart);
                const dayOfWeek = firstSunday.getDay();
                
                if (dayOfWeek === 0) {
                  // 1. Januar ist bereits ein Sonntag
                  firstSunday.setHours(23, 59, 59, 999);
                } else {
                  // Finde den nächsten Sonntag
                  const daysToSunday = 7 - dayOfWeek;
                  firstSunday.setDate(firstSunday.getDate() + daysToSunday);
                  firstSunday.setHours(23, 59, 59, 999);
                }
                
                filtered = journeyDays.filter(day => {
                  const dayDate = new Date(day.date + 'T12:00:00');
                  return dayDate >= weekStart && dayDate <= firstSunday;
                });
              } else {
                // Alle anderen Wochen: normale Montag-Sonntag Wochen
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
                
                // Berechne Start der ausgewählten Woche (Montag)
                const weekStart = new Date(firstSunday);
                weekStart.setDate(firstSunday.getDate() + (selectedWeek - 1) * 7);
                weekStart.setHours(0, 0, 0, 0);
                
                // Berechne Ende der ausgewählten Woche (Sonntag)
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
                
                filtered = journeyDays.filter(day => {
                  const dayDate = new Date(day.date + 'T12:00:00');
                  return dayDate >= weekStart && dayDate <= weekEnd;
                });
              }
            } else {
              // Zeige keine Aktivitäten an, bis eine Woche ausgewählt ist
              filtered = [];
            }
            break;
            
          case 'year':
            if (selectedMonth !== null) {
              // Filtere nach ausgewähltem Monat im aktuellen Jahr
              const monthStart = new Date(now.getFullYear(), selectedMonth, 1);
              const monthEnd = new Date(now.getFullYear(), selectedMonth + 1, 0);
              filtered = journeyDays.filter(day => {
                const dayDate = new Date(day.date);
                return dayDate >= monthStart && dayDate <= monthEnd;
              });
            } else {
              // Zeige keine Aktivitäten an, bis ein Monat ausgewählt ist
              filtered = [];
            }
            break;
            
          case 'custom':
            if (customDateStart && customDateEnd) {
              filtered = journeyDays.filter(day => 
                day.date >= customDateStart && day.date <= customDateEnd
              );
            } else {
              // Zeige keine Aktivitäten an, bis beide Daten eingegeben sind
              filtered = [];
            }
            break;
        }
      }
      
      // Sortiere nach Datum (neueste zuerst)
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFilteredJourneyDays(filtered);
    };

    filterJourneyDays();
  }, [journeyDays, selectedFilter, customDateStart, customDateEnd, selectedMonth, selectedWeek, selectedYear, searchTerm, isSearchActive]);

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
      <section className="pt-24 pb-4 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Willkommen bei{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Journy
            </span>
          </h1>
          
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-4">
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                    Datum
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="kilometer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                    Kilometer (optional)
                  </label>
                  <input
                    type="number"
                    id="kilometer"
                    placeholder="0"
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

              {/* Filter Section */}
              {journeyDays.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
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
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
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
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
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
                              title={`Woche ${weekNumber + 1} (${weekDates.start} - ${weekDates.end}): ${activityCount} Aktivitäten`}
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
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
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
          </div>
        </div>
      </section>

      {/* Journal Entries Section */}
      {journeyDays.length > 0 && (
        <section className="py-2 px-4">
          <div className="max-w-md mx-auto">

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
                filteredJourneyDays.map((day) => (
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
                              {day.kilometer}
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
                ))
              )}
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
