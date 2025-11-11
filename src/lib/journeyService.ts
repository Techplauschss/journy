import { database } from './firebase';
import { ref, push, set, get, onValue, off } from 'firebase/database';

export interface JourneyDay {
  id?: string;
  destination: string;
  date: string;
  kilometer?: number;
  createdAt: number;
}

// Tag zu einer Reise hinzufügen
export const addJourneyDay = async (dayData: Omit<JourneyDay, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const journeyRef = ref(database, 'journeyDays');
    const newDayRef = push(journeyRef);
    
    const journeyDay: JourneyDay = {
      ...dayData,
      createdAt: Date.now()
    };
    
    // Entferne undefined Werte vor dem Speichern
    const cleanedJourneyDay = Object.fromEntries(
      Object.entries(journeyDay).filter(([, value]) => value !== undefined)
    );
    
    await set(newDayRef, cleanedJourneyDay);
    return newDayRef.key!;
  } catch (error) {
    console.error('Error adding journey day:', error);
    throw error;
  }
};

// Alle Reisetage abrufen
export const getJourneyDays = async (): Promise<JourneyDay[]> => {
  try {
    const journeyRef = ref(database, 'journeyDays');
    const snapshot = await get(journeyRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting journey days:', error);
    throw error;
  }
};

// Realtime Listener für Reisetage
export const subscribeToJourneyDays = (callback: (days: JourneyDay[]) => void) => {
  const journeyRef = ref(database, 'journeyDays');
  
  const unsubscribe = onValue(journeyRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const days = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      callback(days);
    } else {
      callback([]);
    }
  });
  
  return () => off(journeyRef, 'value', unsubscribe);
};

// Tag aktualisieren
export const updateJourneyDay = async (dayId: string, dayData: Omit<JourneyDay, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const dayRef = ref(database, `journeyDays/${dayId}`);
    
    // Hole die ursprünglichen Daten um createdAt zu erhalten
    const snapshot = await get(dayRef);
    if (!snapshot.exists()) {
      throw new Error('Journey day not found');
    }
    
    const originalData = snapshot.val();
    const updatedJourneyDay: JourneyDay = {
      ...dayData,
      createdAt: originalData.createdAt // Behalte original createdAt
    };
    
    // Entferne undefined Werte vor dem Speichern
    const cleanedJourneyDay = Object.fromEntries(
      Object.entries(updatedJourneyDay).filter(([, value]) => value !== undefined)
    );
    
    await set(dayRef, cleanedJourneyDay);
  } catch (error) {
    console.error('Error updating journey day:', error);
    throw error;
  }
};

// Tag löschen
export const deleteJourneyDay = async (dayId: string): Promise<void> => {
  try {
    const dayRef = ref(database, `journeyDays/${dayId}`);
    await set(dayRef, null);
  } catch (error) {
    console.error('Error deleting journey day:', error);
    throw error;
  }
};

export interface Movie {
  id?: string;
  title: string;
  date: string;
  rating: number;
  createdAt: number;
}

// Film hinzufügen
export const addMovie = async (movieData: Omit<Movie, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const moviesRef = ref(database, 'movies');
    const newMovieRef = push(moviesRef);
    
    const movie: Movie = {
      ...movieData,
      createdAt: Date.now()
    };
    
    await set(newMovieRef, movie);
    return newMovieRef.key!;
  } catch (error) {
    console.error('Error adding movie:', error);
    throw error;
  }
};

// Realtime Listener für Filme
export const subscribeToMovies = (callback: (movies: Movie[]) => void) => {
  const moviesRef = ref(database, 'movies');
  
  const unsubscribe = onValue(moviesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const movies = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      callback(movies);
    } else {
      callback([]);
    }
  });
  
  return () => off(moviesRef, 'value', unsubscribe);
};

// Film aktualisieren
export const updateMovie = async (movieId: string, movieData: Omit<Movie, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const movieRef = ref(database, `movies/${movieId}`);
    
    const snapshot = await get(movieRef);
    if (!snapshot.exists()) {
      throw new Error('Movie not found');
    }
    
    const originalData = snapshot.val();
    const updatedMovie: Movie = {
      ...movieData,
      createdAt: originalData.createdAt
    };
    
    await set(movieRef, updatedMovie);
  } catch (error) {
    console.error('Error updating movie:', error);
    throw error;
  }
};

// Film löschen
export const deleteMovie = async (movieId: string): Promise<void> => {
  try {
    const movieRef = ref(database, `movies/${movieId}`);
    await set(movieRef, null);
  } catch (error) {
    console.error('Error deleting movie:', error);
    throw error;
  }
};

export interface Trip {
  id?: string;
  startDate: string;
  endDate: string;
  location: string;
  companions?: string;
  createdAt: number;
}

// Reise hinzufügen
export const addTrip = async (tripData: Omit<Trip, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const tripsRef = ref(database, 'trips');
    const newTripRef = push(tripsRef);
    
    const trip: Trip = {
      ...tripData,
      createdAt: Date.now()
    };
    
    // Entferne undefined Werte vor dem Speichern
    const cleanedTrip = Object.fromEntries(
      Object.entries(trip).filter(([, value]) => value !== undefined)
    );
    
    await set(newTripRef, cleanedTrip);
    return newTripRef.key!;
  } catch (error) {
    console.error('Error adding trip:', error);
    throw error;
  }
};

// Realtime Listener für Reisen
export const subscribeToTrips = (callback: (trips: Trip[]) => void) => {
  const tripsRef = ref(database, 'trips');
  
  const unsubscribe = onValue(tripsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const trips = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      callback(trips);
    } else {
      callback([]);
    }
  });
  
  return () => off(tripsRef, 'value', unsubscribe);
};

// Reise löschen
export const deleteTrip = async (tripId: string): Promise<void> => {
  try {
    const tripRef = ref(database, `trips/${tripId}`);
    await set(tripRef, null);
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

export interface TripEntry {
  id?: string;
  tripId: string;
  date: string;
  title: string;
  description: string;
  createdAt: number;
}

// Reiseverlauf-Eintrag hinzufügen
export const addTripEntry = async (entryData: Omit<TripEntry, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const entriesRef = ref(database, `tripEntries/${entryData.tripId}`);
    const newEntryRef = push(entriesRef);
    
    const entry: TripEntry = {
      ...entryData,
      createdAt: Date.now()
    };
    
    await set(newEntryRef, entry);
    return newEntryRef.key!;
  } catch (error) {
    console.error('Error adding trip entry:', error);
    throw error;
  }
};

// Realtime Listener für Reiseverlauf-Einträge einer Reise
export const subscribeTripEntries = (tripId: string, callback: (entries: TripEntry[]) => void) => {
  const entriesRef = ref(database, `tripEntries/${tripId}`);
  
  const unsubscribe = onValue(entriesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const entries = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      // Sort by date (newest first)
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(entries);
    } else {
      callback([]);
    }
  });
  
  return () => off(entriesRef, 'value', unsubscribe);
};

// Reiseverlauf-Eintrag löschen
export const deleteTripEntry = async (tripId: string, entryId: string): Promise<void> => {
  try {
    const entryRef = ref(database, `tripEntries/${tripId}/${entryId}`);
    await set(entryRef, null);
  } catch (error) {
    console.error('Error deleting trip entry:', error);
    throw error;
  }
};

