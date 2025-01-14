import { 
    calculateEMA, 
    calculateRSI, 
    calculateBollingerBands, 
    calculateMACD 
} from './technical-analysis';

interface ScalpSignal {
    type: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
    confidence: number;
    reasons: string[];
}

interface PriceLevel {
    price: number;
    type: 'ENTRY' | 'TP' | 'SL';
    confidence: number;
    percentage: number;
}

interface ScalpAnalysis {
    signal: ScalpSignal;
    levels: PriceLevel[];
    metrics: {
        rsi: number;
        macd: {
            value: number;
            signal: number;
            histogram: number;
        };
        ema: {
            fast: number;
            slow: number;
        };
        bb: {
            upper: number;
            middle: number;
            lower: number;
        };
    };
}

function analyzeScalpSignal(prices: number[], volumes: number[]): ScalpAnalysis {
    const rsi = calculateRSI(prices, 14);
    const bb = calculateBollingerBands(prices, 20, 2);
    const macd = calculateMACD(prices);
    const ema9 = calculateEMA(prices, 9);
    const ema21 = calculateEMA(prices, 21);
    
    const currentPrice = prices[prices.length - 1];
    const lastVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
    
    const reasons: string[] = [];
    let signalType: ScalpSignal['type'] = 'NEUTRAL';
    let confidence = 0;
    
    // Trend Analysis
    if (ema9[ema9.length - 1] > ema21[ema21.length - 1]) {
        reasons.push("🔼 Short-term trend is bullish (EMA9 > EMA21)");
        confidence += 20;
    } else {
        reasons.push("🔽 Short-term trend is bearish (EMA9 < EMA21)");
        confidence -= 20;
    }
    
    // RSI Analysis
    if (rsi < 30) {
        reasons.push("💚 RSI indicates oversold conditions");
        confidence += 25;
    } else if (rsi > 70) {
        reasons.push("❌ RSI indicates overbought conditions");
        confidence -= 25;
    }
    
    // MACD Analysis
    if (macd.histogram > 0 && macd.histogram > macd.signal) {
        reasons.push("📈 MACD shows increasing momentum");
        confidence += 15;
    } else if (macd.histogram < 0 && macd.histogram < macd.signal) {
        reasons.push("📉 MACD shows decreasing momentum");
        confidence -= 15;
    }
    
    // Volume Analysis
    if (lastVolume > avgVolume * 1.5) {
        reasons.push("📊 Volume is significantly above average");
        confidence += 15;
    }
    
    // Bollinger Bands Analysis
    if (currentPrice < bb.lower) {
        reasons.push("🎯 Price below lower Bollinger Band - potential bounce");
        confidence += 25;
    } else if (currentPrice > bb.upper) {
        reasons.push("⚠️ Price above upper Bollinger Band - potential reversal");
        confidence -= 25;
    }
    
    // Determine Signal Type based on confidence
    if (confidence >= 60) signalType = 'STRONG_BUY';
    else if (confidence >= 30) signalType = 'BUY';
    else if (confidence <= -60) signalType = 'STRONG_SELL';
    else if (confidence <= -30) signalType = 'SELL';
    
    // Calculate potential entry/exit levels
    const levels: PriceLevel[] = [
        {
            price: bb.lower,
            type: 'ENTRY',
            confidence: 80,
            percentage: 0
        },
        {
            price: bb.upper,
            type: 'TP',
            confidence: 70,
            percentage: ((bb.upper - currentPrice) / currentPrice) * 100
        },
        {
            price: bb.lower * 0.95,
            type: 'SL',
            confidence: 60,
            percentage: ((bb.lower * 0.95 - currentPrice) / currentPrice) * 100
        }
    ];

    return {
        signal: {
            type: signalType,
            confidence: Math.abs(confidence),
            reasons
        },
        levels,
        metrics: {
            rsi,
            macd: {
                value: macd.macd,
                signal: macd.signal,
                histogram: macd.histogram
            },
            ema: {
                fast: ema9[ema9.length - 1],
                slow: ema21[ema21.length - 1]
            },
            bb
        }
    };
}

export { analyzeScalpSignal, type ScalpAnalysis }; 