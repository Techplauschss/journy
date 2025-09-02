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
      Object.entries(journeyDay).filter(([_, value]) => value !== undefined)
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
