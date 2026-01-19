'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TSID } from '@/lib/mock-data';

// --- Types ---

export type ProductType = '1:1' | 'GROUP';

export interface TicketProduct {
    id: TSID;
    name: string; // "10 Session Basic", "3 Month Pass"
    type: ProductType;
    sessionCount: number; // 10, 30, etc.
    durationDays: number; // Validity period in days
    price: number; // 300000
    description?: string;
    isActive: boolean;
}

export interface Transaction {
    id: TSID;
    memberId: TSID;
    memberName: string;
    productId: TSID;
    productName: string;
    amount: number;
    method: 'CARD' | 'CASH' | 'TRANSFER';
    status: 'PAID' | 'REFUNDED';
    paidAt: Date;
}

interface FinanceContextType {
    products: TicketProduct[];
    transactions: Transaction[];

    // Actions
    addProduct: (product: Omit<TicketProduct, 'id' | 'isActive'>) => void;
    updateProduct: (id: TSID, data: Partial<TicketProduct>) => void;
    toggleProductStatus: (id: TSID) => void;

    // Payment
    processPayment: (
        memberId: TSID,
        memberName: string,
        productId: TSID,
        method: 'CARD' | 'CASH' | 'TRANSFER'
    ) => Transaction; // Returns the created tx
}

// --- Initial Data ---

const MOCK_PRODUCTS: TicketProduct[] = [
    { id: 'PROD_01', name: '1:1 필라테스 10회', type: '1:1', sessionCount: 10, durationDays: 60, price: 700000, isActive: true },
    { id: 'PROD_02', name: '1:1 필라테스 30회', type: '1:1', sessionCount: 30, durationDays: 120, price: 1800000, isActive: true },
    { id: 'PROD_03', name: '그룹 레슨 1개월 (주3회)', type: 'GROUP', sessionCount: 12, durationDays: 30, price: 150000, isActive: true },
    { id: 'PROD_04', name: '그룹 레슨 3개월 (이벤트)', type: 'GROUP', sessionCount: 36, durationDays: 90, price: 390000, isActive: true },
];

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 'TX_01', memberId: 'USER_01', memberName: '김철수', productId: 'PROD_03', productName: '그룹 레슨 1개월', amount: 150000, method: 'CARD', status: 'PAID', paidAt: new Date(2025, 0, 15) },
    { id: 'TX_02', memberId: 'USER_02', memberName: '이영희', productId: 'PROD_01', productName: '1:1 필라테스 10회', amount: 700000, method: 'TRANSFER', status: 'PAID', paidAt: new Date(2025, 0, 18) },
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<TicketProduct[]>(MOCK_PRODUCTS);
    const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

    const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const addProduct = (data: Omit<TicketProduct, 'id' | 'isActive'>) => {
        const newProduct: TicketProduct = {
            ...data,
            id: generateId('PROD'),
            isActive: true,
        };
        setProducts(prev => [...prev, newProduct]);
    };

    const updateProduct = (id: TSID, data: Partial<TicketProduct>) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    };

    const toggleProductStatus = (id: TSID) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
    };

    const processPayment = (
        memberId: TSID,
        memberName: string,
        productId: TSID,
        method: 'CARD' | 'CASH' | 'TRANSFER'
    ) => {
        const product = products.find(p => p.id === productId);
        if (!product) throw new Error('Product not found');

        const newTx: Transaction = {
            id: generateId('TX'),
            memberId,
            memberName,
            productId,
            productName: product.name,
            amount: product.price,
            method,
            status: 'PAID',
            paidAt: new Date(),
        };

        setTransactions(prev => [newTx, ...prev]);
        return newTx;
    };

    const value = {
        products, transactions,
        addProduct, updateProduct, toggleProductStatus,
        processPayment
    };

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
}

export function useFinance() {
    const context = useContext(FinanceContext);
    if (!context) throw new Error('useFinance must be used within FinanceProvider');
    return context;
}
