// src/context/SearchContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

interface SearchParams {
  status?: string;
  type?: string;
  hot?: string;
  duureg?: string;
  min?: string;
  max?: string;
  from?: string;
  to?: string;
}

interface SearchContextType {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  triggerSearch: () => void;
  lastTrigger: number;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [lastTrigger, setLastTrigger] = useState(0);

  const triggerSearch = () => setLastTrigger(prev => prev + 1);

  return (
    <SearchContext.Provider value={{ searchParams, setSearchParams, triggerSearch, lastTrigger }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useSearch must be used within SearchProvider");
  return context;
};