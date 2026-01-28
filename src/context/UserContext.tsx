import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockUser } from '@/data/mockData';

// Definimos la interfaz del usuario basada en lo que hay en mockData
// y lo que usa Settings (firstName, lastName, etc)
export interface UserData {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    firstName?: string; // Para compatibilidad con el formulario separado
    lastName?: string;  // Para compatibilidad con el formulario separado
    phone?: string;
    company?: string;
}

interface UserContextType {
    user: UserData;
    updateUser: (updates: Partial<UserData>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    // Inicializamos el estado. Intentamos inferir firstName/lastName si no existen
    const [user, setUser] = useState<UserData>(() => {
        const names = mockUser.name.split(' ');
        return {
            ...mockUser,
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || '',
            phone: '+57 300 123 4567', // Valor por defecto visto en settings
            company: 'ASC Energy',
            role: 'Administrador Global'
        };
    });

    const updateUser = (updates: Partial<UserData>) => {
        setUser(prev => {
            // Si actualizan firstName o lastName, regeneramos 'name' completo
            const newData = { ...prev, ...updates };
            if (updates.firstName !== undefined || updates.lastName !== undefined) {
                newData.name = `${newData.firstName} ${newData.lastName}`.trim();
            }
            return newData;
        });
    };

    return (
        <UserContext.Provider value={{ user, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
