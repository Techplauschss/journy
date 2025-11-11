'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredActivities, setFilteredActivities] = useState<JourneyDay[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [collapsedYears, setCollapsedYears] = useState<Record<string, boolean>>({});

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

  // Get available years from existing entries
  const getAvailableYears = () => {
    const years = journeyDays.map(day => new Date(day.date).getFullYear());
    const uniqueYears = Array.from(new Set(years)).sort((a, b) => b - a);
    return uniqueYears;
  };

  // Clear month/year selection (reset to current month/year)
  const clearMonthYearFilter = () => {
    setSelectedMonth((new Date().getMonth() + 1).toString());
    setSelectedYear(new Date().getFullYear().toString());
  };

  // Hilfsfunktion für Datumssuche
  const matchesDateSearch = (dayDate: string, searchTerm: string): boolean => {
    const searchLower = searchTerm.toLowerCase();
    const dayDateObj = new Date(dayDate);
    
    // Format das gespeicherte Datum in verschiedene Formate
    const day = dayDateObj.getDate();
    const month = dayDateObj.getMonth() + 1;
    const year = dayDateObj.getFullYear();
    const shortYear = year.toString().slice(-2);
    
    // Deutsche Monatsnamen
    const monthNames = [
      'januar', 'februar', 'märz', 'april', 'mai', 'juni',
      'juli', 'august', 'september', 'oktober', 'november', 'dezember'
    ];
    const monthName = monthNames[dayDateObj.getMonth()];
    
    // Verschiedene Datumsformate prüfen
    const formats = [
      `${day}.${month}.${year}`,        // 1.11.2024
      `${day}.${month}.${shortYear}`,   // 1.11.24
      `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`, // 01.11.2024
      `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${shortYear}`, // 01.11.24
      `${day}. ${monthName}`,           // 1. november
      `${day}. ${monthName} ${year}`,   // 1. november 2024
      `${day}. ${monthName} ${shortYear}`, // 1. november 24
      `${day}/${month}/${year}`,        // 1/11/2024
      `${day}/${month}/${shortYear}`,   // 1/11/24
      `${day}-${month}-${year}`,        // 1-11-2024
      `${day}-${month}-${shortYear}`,   // 1-11-24
    ];
    
    return formats.some(format => format.includes(searchLower));
  };

  // Search Logic
  useEffect(() => {
    let filtered = [...journeyDays];
    
    // Month/Year Filter
    if (selectedMonth && selectedYear) {
      filtered = filtered.filter(day => {
        const dayDate = new Date(day.date);
        const dayMonth = dayDate.getMonth() + 1; // JavaScript months are 0-indexed
        const dayYear = dayDate.getFullYear();
        return dayMonth === parseInt(selectedMonth) && dayYear === parseInt(selectedYear);
      });
    }
    
    // Text/Date Search Filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(day => 
        day.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        matchesDateSearch(day.date, searchTerm)
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Always show filtered activities (including current month/year filter)
    setFilteredActivities(filtered);
  }, [journeyDays, searchTerm, latestActivity, selectedMonth, selectedYear]);

  // Neuen Eintrag hinzufügen
  const handleAddEntry = async () => {
    if (!entry.trim() || !date) return;

    try {
      setIsLoading(true);
      await addJourneyDay({
        destination: entry.trim(),
        date: date,
        kilometer: kilometer === '' ? undefined : Number(kilometer)
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
        kilometer: editEntry.kilometer === '' ? undefined : Number(editEntry.kilometer)
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

  const groupedActivities = filteredActivities.reduce((acc, activity) => {
    const year = new Date(activity.date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(activity);
    return acc;
  }, {} as Record<number, JourneyDay[]>);

  const sortedYears = Object.keys(groupedActivities).map(Number).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Add Entry View */}
      {currentView === 'add' && (
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            {/* Input Section */}
            <div className="bg-white dark:bg-gray-800 rounded-4xl p-6 shadow-2xl mb-4 over:shadow-lg hover:scale-105 duration-600">
              <div className="space-y-4">
                <div>
                  <textarea
                    id="destination"
                    placeholder="Beschreibe deine Aktivität"
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    rows={2}
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none hover:shadow-lg disabled:cursor-not-allowed hover:scale-102 duration-600"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:shadow-lg disabled:cursor-not-allowed hover:scale-102 duration-600"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      id="kilometer"
                      placeholder="Kilometer"
                      value={kilometer}
                      onChange={(e) => setKilometer(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:shadow-lg disabled:cursor-not-allowed hover:scale-103 duration-600"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleAddEntry}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg disabled:cursor-not-allowed hover:scale-103 duration-600"
                >
                  {isLoading ? 'Wird gespeichert...' : 'Aktivität hinzufügen'}
                </button>
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setCurrentView('list')}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center hover:shadow-lg disabled:cursor-not-allowed hover:scale-110 duration-200"
                title="Aktivitäten anzeigen"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <Link href="/movies" title="Filme anzeigen">
                <button
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center hover:shadow-lg disabled:cursor-not-allowed hover:scale-110 duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
                  </svg>
                </button>
              </Link>
              {/* Vacation Button (plane) */}
              <Link href="/vacation" title="Urlaub anzeigen">
                <button
                  aria-label="Urlaub"
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center hover:shadow-lg disabled:cursor-not-allowed hover:scale-110 duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.5 19.5 21 12l-18.5-7.5L7 12l-4.5 7.5zM7 12l5 1 5-1" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* List View - Only Latest Activity */}
      {currentView === 'list' && (
        <section className="min-h-screen flex flex-col justify-center py-4 px-4">
          <div className="max-w-md mx-auto w-full">
            {/* Main Card with Search and Activities */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              {/* Search Field */}
              <div className="mb-6 space-y-3">
                <input
                  type="text"
                  placeholder="Aktivitäten durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center"
                />
                
                {/* Month/Year Picker */}
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full appearance-none px-4 py-3 pr-10 border-0 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-gray-800">Monat wählen</option>
                      <option value="1" className="bg-white dark:bg-gray-800">Januar</option>
                      <option value="2" className="bg-white dark:bg-gray-800">Februar</option>
                      <option value="3" className="bg-white dark:bg-gray-800">März</option>
                      <option value="4" className="bg-white dark:bg-gray-800">April</option>
                      <option value="5" className="bg-white dark:bg-gray-800">Mai</option>
                      <option value="6" className="bg-white dark:bg-gray-800">Juni</option>
                      <option value="7" className="bg-white dark:bg-gray-800">Juli</option>
                      <option value="8" className="bg-white dark:bg-gray-800">August</option>
                      <option value="9" className="bg-white dark:bg-gray-800">September</option>
                      <option value="10" className="bg-white dark:bg-gray-800">Oktober</option>
                      <option value="11" className="bg-white dark:bg-gray-800">November</option>
                      <option value="12" className="bg-white dark:bg-gray-800">Dezember</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="relative flex-1">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full appearance-none px-4 py-3 pr-10 border-0 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-gray-800">Jahr wählen</option>
                      {getAvailableYears().map(year => (
                        <option key={year} value={year} className="bg-white dark:bg-gray-800">{year}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {(selectedMonth || selectedYear) && (
                    <button
                      onClick={clearMonthYearFilter}
                      className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Filter zurücksetzen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Activities or Empty State */}
              {filteredActivities.length > 0 ? (
                <div className="space-y-4">
                  {sortedYears.map(year => (
                    <div key={year}>
                      <div className="flex items-center justify-between my-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {year}
                        </h2>
                        <button
                          onClick={() => setCollapsedYears(prev => ({ ...prev, [year]: !prev[year] }))}
                          className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
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
                          {groupedActivities[year].map((activity) => (
                            <div key={activity.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                              <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                    {new Date(activity.date).toLocaleDateString('de-DE', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                    {activity.kilometer && parseInt(String(activity.kilometer), 10) > 0 && (
                                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        {parseInt(String(activity.kilometer), 10)} km
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                                  {activity.destination}
                                </p>
                              </div>
                              <div className="flex flex-col space-y-1 ml-4">
                                <button
                                  onClick={() => handleEditEntry(activity)}
                                  className="text-indigo-500 hover:text-indigo-700 p-1"
                                  title="Aktivität bearbeiten"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(activity.id!, activity.destination)}
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
                        </div>
                      )}
                    </div>
                  ))}
                
                {/* Search Results Info */}
                {(searchTerm.trim() || selectedMonth || selectedYear) && (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    {(() => {
                      const hasSearch = searchTerm.trim();
                      const hasMonthYear = selectedMonth || selectedYear;
                      const monthNames = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
                      
                      let filterText = '';
                      if (hasSearch && hasMonthYear) {
                        const monthText = selectedMonth ? monthNames[parseInt(selectedMonth)] : '';
                        const yearText = selectedYear || '';
                        const monthYearText = [monthText, yearText].filter(Boolean).join(' ');
                        filterText = `"${searchTerm}" in ${monthYearText}`;
                      } else if (hasSearch) {
                        filterText = `"${searchTerm}"`;
                      } else if (hasMonthYear) {
                        const monthText = selectedMonth ? monthNames[parseInt(selectedMonth)] : '';
                        const yearText = selectedYear || '';
                        filterText = [monthText, yearText].filter(Boolean).join(' ');
                      }
                      
                      return filteredActivities.length === 1 
                        ? `1 Aktivität gefunden${filterText ? ` für ${filterText}` : ''}`
                        : `${filteredActivities.length} Aktivitäten gefunden${filterText ? ` für ${filterText}` : ''}`;
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  {(searchTerm.trim() || selectedMonth || selectedYear) ? (
                    <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {(() => {
                    const hasSearch = searchTerm.trim();
                    const hasMonthYear = selectedMonth || selectedYear;
                    
                    if (hasSearch || hasMonthYear) {
                      const monthNames = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
                      let filterText = '';
                      
                      if (hasSearch && hasMonthYear) {
                        const monthText = selectedMonth ? monthNames[parseInt(selectedMonth)] : '';
                        const yearText = selectedYear || '';
                        const monthYearText = [monthText, yearText].filter(Boolean).join(' ');
                        filterText = `"${searchTerm}" in ${monthYearText}`;
                      } else if (hasSearch) {
                        filterText = `"${searchTerm}"`;
                      } else if (hasMonthYear) {
                        const monthText = selectedMonth ? monthNames[parseInt(selectedMonth)] : '';
                        const yearText = selectedYear || '';
                        filterText = [monthText, yearText].filter(Boolean).join(' ');
                      }
                      
                      return `Keine Ergebnisse für ${filterText}`;
                    }
                    
                    return 'Noch keine Aktivitäten';
                  })()}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {(searchTerm.trim() || selectedMonth || selectedYear)
                    ? 'Versuche andere Filter oder füge eine neue Aktivität hinzu.'
                    : 'Du hast noch keine Aktivitäten hinzugefügt. Beginne damit, deine erste Aktivität zu dokumentieren!'
                  }
                </p>
                <button
                  onClick={() => setCurrentView('add')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg"
                >
                  {(searchTerm.trim() || selectedMonth || selectedYear) ? 'Neue Aktivität hinzufügen' : 'Erste Aktivität hinzufügen'}
                </button>
              </div>
            )}
            </div>
            
            {/* Add Entry Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setCurrentView('add')}
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                title="Neuen Eintrag hinzufügen"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
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
