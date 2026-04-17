'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'poshanpoint_cart';

const initialState = {
    items: [],
    totalItems: 0,
    totalAmount: 0,
};

function calculateTotals(items) {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.itemTotal, 0);
    return { totalItems, totalAmount: Math.round(totalAmount * 100) / 100 };
}

function calculateItemTotal(item) {
    const basePrice = item.basePrice || 0;
    const baseExtra = item.selectedBase?.price || 0;
    const liquidExtra = item.selectedLiquid?.price || 0;
    const addOnsTotal = (item.selectedAddOns || []).reduce((sum, a) => sum + (a.price || 0), 0);
    return (basePrice + baseExtra + liquidExtra + addOnsTotal) * item.quantity;
}

function cartReducer(state, action) {
    let newItems;

    switch (action.type) {
        case 'ADD_ITEM': {
            const newItem = {
                ...action.payload,
                cartId: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                itemTotal: calculateItemTotal(action.payload),
            };
            newItems = [...state.items, newItem];
            const totals = calculateTotals(newItems);
            return { items: newItems, ...totals };
        }

        case 'REMOVE_ITEM': {
            newItems = state.items.filter((item) => item.cartId !== action.payload);
            const totals = calculateTotals(newItems);
            return { items: newItems, ...totals };
        }

        case 'UPDATE_QUANTITY': {
            newItems = state.items.map((item) => {
                if (item.cartId === action.payload.cartId) {
                    const updated = { ...item, quantity: action.payload.quantity };
                    updated.itemTotal = calculateItemTotal(updated);
                    return updated;
                }
                return item;
            });
            const totals2 = calculateTotals(newItems);
            return { items: newItems, ...totals2 };
        }

        case 'CLEAR_CART':
            return { ...initialState };

        case 'LOAD_CART':
            return action.payload;

        default:
            return state;
    }
}

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.items && parsed.items.length > 0) {
                    dispatch({ type: 'LOAD_CART', payload: parsed });
                }
            }
        } catch (e) {
            console.error('Failed to load cart:', e);
        }
    }, []);

    // Save cart to localStorage on changes
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save cart:', e);
        }
    }, [state]);

    const addItem = (item) => dispatch({ type: 'ADD_ITEM', payload: item });
    const removeItem = (cartId) => dispatch({ type: 'REMOVE_ITEM', payload: cartId });
    const updateQuantity = (cartId, quantity) =>
        dispatch({ type: 'UPDATE_QUANTITY', payload: { cartId, quantity } });
    const clearCart = () => dispatch({ type: 'CLEAR_CART' });

    return (
        <CartContext.Provider value={{ ...state, addItem, removeItem, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
}
