interface TokenPriceResponse {
    price: number;
    liquidity: number;
    marketCap: number;
    lastUpdated: number;
}

interface BuyerInfo {
    wallet: string;
    total: number;
}

const BASE_URL = 'https://data.solanatracker.io';
const API_KEY = process.env.SOLANATRACKER_API_KEY;

if (!API_KEY) {
    throw new Error('SOLANATRACKER_API_KEY is not set in environment variables');
}

export async function getTokenPrice(address: string): Promise<TokenPriceResponse> {
    try {
        const authHeader = { 'x-api-key': API_KEY } as HeadersInit;
        const response = await fetch(`${BASE_URL}/price?token=${address}`, {
            headers: authHeader
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data as TokenPriceResponse;
    } catch (error) {
        console.error('Error fetching token price:', error);
        throw error;
    }
}

// Helper function to format the price data into a readable string
export function formatTokenPriceData(data: TokenPriceResponse): string {
    return [
        `💰 Price: $${data.price.toFixed(6)}`,
        `💧 Liquidity: $${data.liquidity.toLocaleString()}`,
        `📊 Market Cap: $${data.marketCap.toLocaleString()}`,
        `🕒 Last Updated: ${new Date(data.lastUpdated).toLocaleString()}`
    ].join('\n');
}

export async function getFirstTokenBuyers(address: string): Promise<BuyerInfo[]> {
    try {
        const authHeader = { 'x-api-key': API_KEY } as HeadersInit;
        const response = await fetch(`${BASE_URL}/first-buyers/${address}`, {
            headers: authHeader
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data as BuyerInfo[];
    } catch (error) {
        console.error('Error fetching first buyers:', error);
        throw error;
    }
}
