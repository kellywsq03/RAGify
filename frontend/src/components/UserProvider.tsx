'use client';

import { createContext, useState, ReactNode } from 'react';

interface UserContextType {
  userId: string | null;
  setUserId: (id: string) => void;
}

export const UserIdContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  return (
    <UserIdContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserIdContext.Provider>
  );
}
