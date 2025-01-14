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

interface TokenExtensions {
    twitter?: string;
    telegram?: string;
}

interface TokenCreator {
    name: string;
    site: string;
}

interface TokenInfo {
    name: string;
    symbol: string;
    mint: string;
    uri: string;
    decimals: number;
    image: string;
    description: string;
    extensions: TokenExtensions;
    tags: string[];
    creator: TokenCreator;
    hasFileMetaData: boolean;
}

interface PoolLiquidity {
    quote: number;
    usd: number;
}

interface PoolInfo {
    liquidity: PoolLiquidity;
    price: PoolLiquidity;
    tokenSupply: number;
    lpBurn: number;
    tokenAddress: string;
    marketCap: PoolLiquidity;
    market: string;
    quoteToken: string;
    decimals: number;
    security: {
        freezeAuthority: string;
        mintAuthority: string;
    };
    lastUpdated: number;
    createdAt: number;
    poolId: string;
}

interface PriceChangeEvent {
    priceChangePercentage: number;
}

interface TokenEvents {
    "1m": PriceChangeEvent;
    "5m": PriceChangeEvent;
    "15m": PriceChangeEvent;
    "30m": PriceChangeEvent;
    "1h": PriceChangeEvent;
    "2h": PriceChangeEvent;
    "3h": PriceChangeEvent;
    "4h": PriceChangeEvent;
    "5h": PriceChangeEvent;
    "6h": PriceChangeEvent;
    "12h": PriceChangeEvent;
    "24h": PriceChangeEvent;
}

interface RiskInfo {
    rugged: boolean;
    risks: Array<{
        name: string;
        description: string;
        level: string;
        score: number;
    }>;
    score: number;
}

interface TokenDetailsResponse {
    token: TokenInfo;
    pools: PoolInfo[];
    events: TokenEvents;
    risk: RiskInfo;
    buys: number;
    sells: number;
    txns: number;
}

export interface TokenPnlInfo {
    holding: number;
    held: number;
    sold: number;
    realized: number;
    unrealized: number;
    total: number;
    total_sold: number;
    total_invested: number;
    average_buy_amount: number;
    current_value: number;
    cost_basis: number;
}

interface PnlSummary {
    realized: number;
    unrealized: number;
    total: number;
    totalInvested: number;
    averageBuyAmount: number;
    totalWins: number;
    totalLosses: number;
    winPercentage: number;
    lossPercentage: number;
}

interface PnlResponse {
    tokens: Record<string, TokenPnlInfo>;
    summary: PnlSummary;
}

export interface OHLCVData {
    open: number;
    close: number;
    low: number;
    high: number;
    volume: number;
    time: number;
}

interface ChartResponse {
    oclhv: OHLCVData[];
}

interface ChartParams {
    type?: string;
    time_from?: number;
    time_to?: number;
    marketCap?: boolean;
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

export async function getTokenDetails(address: string): Promise<TokenDetailsResponse> {
    try {
        const authHeader = { 'x-api-key': API_KEY } as HeadersInit;
        const response = await fetch(`${BASE_URL}/tokens/${address}`, {
            headers: authHeader
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data as TokenDetailsResponse;
    } catch (error) {
        console.error('Error fetching token details:', error);
        throw error;
    }
}

// Helper function to format token details into a readable string
export function formatTokenDetails(data: TokenDetailsResponse): string {
    const token = data.token;
    const mainPool = data.pools[0];
    const events = data.events;
    const risk = data.risk;
    
    // Format risk details
    const riskDetails = risk.risks.map(risk => 
        `• ${risk.name}: ${risk.description} (Level: ${risk.level})`
    ).join('\n');
    
    return [
        `📝 Name: ${token.name} (${token.symbol})`,
        `🏷️ Address: ${token.mint}`,
        `📊 Decimals: ${token.decimals}`,
        mainPool ? [
            `💰 Price: $${mainPool.price.usd.toFixed(6)}`,
            `💧 Liquidity: $${mainPool.liquidity.usd.toLocaleString()}`,
            `📈 Market Cap: $${mainPool.marketCap.usd.toLocaleString()}`
        ].join('\n') : '',
        ``,
        `📈 Price Changes:`,
        `• 1h: ${events["1h"].priceChangePercentage.toFixed(2)}%`,
        `• 24h: ${events["24h"].priceChangePercentage.toFixed(2)}%`,
        ``,
        `🔗 Links:`,
        token.extensions.twitter ? `• Twitter: ${token.extensions.twitter}` : '',
        token.extensions.telegram ? `• Telegram: ${token.extensions.telegram}` : '',
        ``,
        `⚠️ Risk Analysis:`,
        `• Overall Score: ${risk.score}/10`,
        `• Rugged: ${risk.rugged ? '⛔️ Yes' : '✅ No'}`,
        riskDetails ? `\nRisk Factors:\n${riskDetails}` : ''
    ].filter(Boolean).join('\n');
}

export async function getWalletPnl(wallet: string): Promise<PnlResponse> {
    try {
        const authHeader = { 'x-api-key': API_KEY } as HeadersInit;
        const response = await fetch(`${BASE_URL}/pnl/${wallet}`, {
            headers: authHeader
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data as PnlResponse;
    } catch (error) {
        console.error('Error fetching wallet PNL:', error);
        throw error;
    }
}

export async function getTokenChart(
    address: string, 
    params: ChartParams = {}
): Promise<ChartResponse> {
    try {
        const queryParams = new URLSearchParams();
        if (params.type) queryParams.append('type', params.type);
        if (params.time_from) queryParams.append('time_from', params.time_from.toString());
        if (params.time_to) queryParams.append('time_to', params.time_to.toString());
        if (params.marketCap) queryParams.append('marketCap', 'true');

        const url = `${BASE_URL}/chart/${address}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const authHeader = { 'x-api-key': API_KEY } as HeadersInit;
        const response = await fetch(url, { headers: authHeader });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data as ChartResponse;
    } catch (error) {
        console.error('Error fetching chart data:', error);
        throw error;
    }
}
