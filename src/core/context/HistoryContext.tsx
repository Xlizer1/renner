import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type HistoryContextType = {
  history: string[]; // List of IDs (e.g., "S 0502-Y")
  addToHistory: (key: string) => void;
  clearHistory: () => void;
};

const HistoryContext = createContext<HistoryContextType>({
  history: [],
  addToHistory: () => {},
  clearHistory: () => {},
});

export const HistoryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [history, setHistory] = useState<string[]>([]);

  // 1. Load on Start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("user_history");
        if (stored) setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    })();
  }, []);

  // 2. Save Helper
  const saveToStorage = async (newList: string[]) => {
    try {
      await AsyncStorage.setItem("user_history", JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const addToHistory = (key: string) => {
    setHistory((prev) => {
      // Remove duplicates (so the new one moves to the top)
      const filtered = prev.filter((k) => k !== key);

      // Add to front, limit to 20 items
      const newList = [key, ...filtered].slice(0, 20);

      saveToStorage(newList);
      return newList;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    saveToStorage([]);
  };

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => useContext(HistoryContext);
