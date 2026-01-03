import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type FavoritesContextType = {
  favorites: string[]; // List of IDs (e.g., "S 0502-Y")
  toggleFavorite: (key: string) => void;
  isFavorite: (key: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
});

export const FavoritesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // 1. Load from Storage on App Start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("user_favorites");
        if (stored) setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load favorites", e);
      }
    })();
  }, []);

  // 2. Save to Storage whenever list changes
  const saveToStorage = async (newList: string[]) => {
    try {
      await AsyncStorage.setItem("user_favorites", JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to save favorites", e);
    }
  };

  const toggleFavorite = (key: string) => {
    setFavorites((prev) => {
      const newList = prev.includes(key)
        ? prev.filter((k) => k !== key) // Remove
        : [...prev, key]; // Add
      console.log(key)

      saveToStorage(newList);
      return newList;
    });
  };

  const isFavorite = (key: string) => favorites.includes(key);

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggleFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
