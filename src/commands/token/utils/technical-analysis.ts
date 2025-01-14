export function calculateEMA(prices: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const ema = [prices[0]];
    
    for (let i = 1; i < prices.length; i++) {
        ema.push((prices[i] - ema[i-1]) * multiplier + ema[i-1]);
    }
    return ema;
}

export function calculateRSI(prices: number[], period: number = 14): number {
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
        const difference = prices[i] - prices[i-1];
        if (difference >= 0) {
            gains += difference;
        } else {
            losses -= difference;
        }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    const lastPrice = prices[prices.length - 1];
    const secondLastPrice = prices[prices.length - 2];
    const currentGain = Math.max(lastPrice - secondLastPrice, 0);
    const currentLoss = Math.max(secondLastPrice - lastPrice, 0);
    
    avgGain = (avgGain * 13 + currentGain) / 14;
    avgLoss = (avgLoss * 13 + currentLoss) / 14;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
    const sma = prices.slice(-period).reduce((a, b) => a + b) / period;
    const squaredDifferences = prices.slice(-period).map(x => Math.pow(x - sma, 2));
    const variance = squaredDifferences.reduce((a, b) => a + b) / period;
    const standardDeviation = Math.sqrt(variance);
    
    return {
        middle: sma,
        upper: sma + (standardDeviation * stdDev),
        lower: sma - (standardDeviation * stdDev)
    };
}

export function calculateMACD(prices: number[]) {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
    const signalLine = calculateEMA([macdLine], 9)[0];
    
    return {
        macd: macdLine,
        signal: signalLine,
        histogram: macdLine - signalLine
    };
}