
const API_URL = '/api';

export interface PlantSummary {
    id: string; // plant_code
    name: string;
    capacity: number;
    today_generation: number;
    total_generation: number;
    year_generation: number;
    co2_avoided: number;
    status: 'active' | 'inactive' | 'warning';
    location: string;
}

export const plantService = {
    getPlantsSummary: async (): Promise<PlantSummary[]> => {
        try {
            const response = await fetch(`${API_URL}/plants`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching plant summary:', error);
            throw error;
        }
    },

    getPlantDetails: async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/plants/${encodeURIComponent(id)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching plant details:', error);
            throw error;
        }
    },

    getFinancialHistory: async () => {
        try {
            const response = await fetch(`${API_URL}/plants/history`);
            if (!response.ok) throw new Error('Failed to fetch history');
            return await response.json();
        } catch (error) {
            console.error('Error fetching financial history:', error);
            throw error;
        }
    },

    getInvestmentSummary: async () => {
        try {
            const response = await fetch(`${API_URL}/plants/investment-summary`);
            if (!response.ok) throw new Error('Failed to fetch investment summary');
            return await response.json();
        } catch (error) {
            console.error('Error fetching investment summary:', error);
            throw error;
        }
    },

    getGenerationHistory: async () => {
        try {
            const response = await fetch(`${API_URL}/plants/generation-history`);
            if (!response.ok) throw new Error('Failed to fetch generation history');
            return await response.json();
        } catch (error) {
            console.error('Error fetching generation history:', error);
            throw error;
        }
    },

    getEnergyDistribution: async () => {
        try {
            const response = await fetch(`${API_URL}/plants/energy-distribution`);
            if (!response.ok) throw new Error('Failed to fetch energy distribution');
            return await response.json();
        } catch (error) {
            console.error('Error fetching energy distribution:', error);
            throw error;
        }
    }

};
