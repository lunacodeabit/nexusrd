import { useState, useCallback } from 'react';
import {
    getPaymentPlanHistory,
    type PaymentPlanRecord
} from '../services/paymentPlanHistoryService';

interface UsePaymentPlanHistoryReturn {
    history: PaymentPlanRecord[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    currentPage: number;
    totalPages: number;
    goToPage: (page: number) => void;
    refresh: () => Promise<void>;
}

const PAGE_SIZE = 20;

export function usePaymentPlanHistory(): UsePaymentPlanHistoryReturn {
    const [history, setHistory] = useState<PaymentPlanRecord[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTermState] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchHistory = useCallback(async (page: number = 1, search: string = '') => {
        setIsLoading(true);
        setError(null);

        const offset = (page - 1) * PAGE_SIZE;
        const result = await getPaymentPlanHistory({
            limit: PAGE_SIZE,
            offset,
            searchTerm: search
        });

        if (result.error) {
            setError(result.error);
        } else {
            setHistory(result.data);
            setTotalCount(result.count);
        }

        setIsLoading(false);
    }, []);

    const setSearchTerm = useCallback((term: string) => {
        setSearchTermState(term);
        setCurrentPage(1);
        fetchHistory(1, term);
    }, [fetchHistory]);

    const goToPage = useCallback((page: number) => {
        setCurrentPage(page);
        fetchHistory(page, searchTerm);
    }, [fetchHistory, searchTerm]);

    const refresh = useCallback(async () => {
        await fetchHistory(currentPage, searchTerm);
    }, [fetchHistory, currentPage, searchTerm]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return {
        history,
        totalCount,
        isLoading,
        error,
        searchTerm,
        setSearchTerm,
        currentPage,
        totalPages,
        goToPage,
        refresh
    };
}
