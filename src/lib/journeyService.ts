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
