import { calculateRSI, calculateBollingerBands, calculateMACD, calculateEMA } from './technical-analysis';

interface BacktestResult {
    strategy: string;
    entryType: string;
    params: {
        tp: number;
        sl: number;
        emaFast?: number;
        emaSlow?: number;
        rsiThreshold?: number;
    };
    performance: {
        trades: number;
        winRate: number;
        avgRoi: number;
        totalPnl: number;
        maxDrawdown: number;
    };
}

interface Trade {
    entry: number;
    exit: number;
    entryTime: number;
    exitTime: number;
    pnl: number;
    type: 'WIN' | 'LOSS';
}

function backtest(
    prices: number[],
    timeframes: number[],
    strategy: 'EMA' | 'RSI' | 'BB',
    params: {
        tp: number;
        sl: number;
        emaFast?: number;
        emaSlow?: number;
        rsiThreshold?: number;
    }
): BacktestResult {
    const trades: Trade[] = [];
    let inPosition = false;
    let entryPrice = 0;
    let entryTime = 0;

    for (let i = 50; i < prices.length; i++) {
        const currentPrice = prices[i];
        const currentTime = timeframes[i];

        // Entry logic based on strategy
        if (!inPosition) {
            let shouldEnter = false;

            if (strategy === 'EMA' && params.emaFast && params.emaSlow) {
                const fastEMA = calculateEMA(prices.slice(0, i), params.emaFast);
                const slowEMA = calculateEMA(prices.slice(0, i), params.emaSlow);
                shouldEnter = fastEMA[fastEMA.length - 1] > slowEMA[slowEMA.length - 1] &&
                             fastEMA[fastEMA.length - 2] <= slowEMA[slowEMA.length - 2];
            } else if (strategy === 'RSI' && params.rsiThreshold) {
                const rsi = calculateRSI(prices.slice(0, i));
                shouldEnter = rsi < params.rsiThreshold;
            } else if (strategy === 'BB') {
                const bb = calculateBollingerBands(prices.slice(0, i));
                shouldEnter = currentPrice < bb.lower;
            }

            if (shouldEnter) {
                inPosition = true;
                entryPrice = currentPrice;
                entryTime = currentTime;
            }
        }
        // Exit logic
        else {
            const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

            if (pnlPercent >= params.tp || pnlPercent <= -params.sl) {
                trades.push({
                    entry: entryPrice,
                    exit: currentPrice,
                    entryTime,
                    exitTime: currentTime,
                    pnl: pnlPercent,
                    type: pnlPercent > 0 ? 'WIN' : 'LOSS'
                });
                inPosition = false;
            }
        }
    }

    // Calculate performance metrics
    const winningTrades = trades.filter(t => t.type === 'WIN');
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const maxDrawdown = Math.min(...trades.map(t => t.pnl));

    return {
        strategy,
        entryType: getEntryTypeString(strategy, params),
        params,
        performance: {
            trades: trades.length,
            winRate: (winningTrades.length / trades.length) * 100,
            avgRoi: trades.length > 0 ? totalPnl / trades.length : 0,
            totalPnl,
            maxDrawdown
        }
    };
}

function getEntryTypeString(strategy: string, params: any): string {
    switch (strategy) {
        case 'EMA':
            return `EMA(${params.emaFast}/${params.emaSlow})`;
        case 'RSI':
            return `RSI < ${params.rsiThreshold}`;
        case 'BB':
            return 'BB Lower Touch';
        default:
            return strategy;
    }
}

export { backtest, type BacktestResult }; 