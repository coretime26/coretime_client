'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TSID } from '@/lib/mock-data';
import { Room } from '@/features/schedule';
import { getRooms } from '@/features/schedule/model/mock-data';

// --- Types ---

export interface ClassCategory {
    id: TSID;
    name: string;
    color: string; // Hex or Mantine color
}

export interface NoShowPolicy {
    enabled: boolean;
    penaltyCount: number; // e.g. 1 (deduct 1 time) or 2
}

export interface ReservationPolicy {
    openBeforeHours: number; // e.g. 168 (1 week) or 24 (1 day) - when booking opens
    cancelBeforeHours: number; // e.g. 12 (12 hours before) - after this, cancellation penalty applies
}

export interface OperationalPolicies {
    noShow: NoShowPolicy;
    reservation: ReservationPolicy;
}

interface SettingsContextType {
    categories: ClassCategory[];
    rooms: Room[];
    policies: OperationalPolicies;

    // Actions
    addCategory: (category: Omit<ClassCategory, 'id'>) => void;
    updateCategory: (id: TSID, updates: Partial<ClassCategory>) => void;
    deleteCategory: (id: TSID) => void;

    addRoom: (room: Omit<Room, 'id'>) => void;
    updateRoom: (id: TSID, updates: Partial<Room>) => void;
    deleteRoom: (id: TSID) => void;

    updatePolicies: (updates: Partial<OperationalPolicies>) => void;
}

// --- Initial Data ---

const INITIAL_CATEGORIES: ClassCategory[] = [
    { id: 'CAT_01', name: 'Yoga', color: 'indigo' },
    { id: 'CAT_02', name: 'Pilates', color: 'grape' },
    { id: 'CAT_03', name: 'PT', color: 'teal' },
];

const INITIAL_POLICIES: OperationalPolicies = {
    noShow: {
        enabled: true,
        penaltyCount: 1,
    },
    reservation: {
        openBeforeHours: 168, // 7 days
        cancelBeforeHours: 6,
    },
};

// --- Context ---

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    // State
    const [categories, setCategories] = useState<ClassCategory[]>(INITIAL_CATEGORIES);
    const [rooms, setRooms] = useState<Room[]>(getRooms()); // Initialize with existing mock rooms
    const [policies, setPolicies] = useState<OperationalPolicies>(INITIAL_POLICIES);

    // Helpers
    const generateId = (prefix: string) => `${prefix}_${Date.now()}`; // Simple ID gen for client-side

    // Actions
    const addCategory = (category: Omit<ClassCategory, 'id'>) => {
        const newCategory = { ...category, id: generateId('CAT') };
        setCategories(prev => [...prev, newCategory]);
    };

    const updateCategory = (id: TSID, updates: Partial<ClassCategory>) => {
        setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
    };

    const deleteCategory = (id: TSID) => {
        setCategories(prev => prev.filter(cat => cat.id !== id));
    };

    const addRoom = (room: Omit<Room, 'id'>) => {
        const newRoom = { ...room, id: generateId('ROOM') };
        setRooms(prev => [...prev, newRoom]);
    };

    const updateRoom = (id: TSID, updates: Partial<Room>) => {
        setRooms(prev => prev.map(room => room.id === id ? { ...room, ...updates } : room));
    };

    const deleteRoom = (id: TSID) => {
        setRooms(prev => prev.filter(room => room.id !== id));
    };

    const updatePolicies = (updates: Partial<OperationalPolicies>) => {
        setPolicies(prev => ({ ...prev, ...updates }));
    };

    const value = {
        categories,
        rooms,
        policies,
        addCategory,
        updateCategory,
        deleteCategory,
        addRoom,
        updateRoom,
        deleteRoom,
        updatePolicies,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
