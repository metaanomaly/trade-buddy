import { calculateRSI, calculateBollingerBands, calculateMACD, calculateEMA } from './technical-analysis';

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
        momentum: {
            priceChange: number;
            volumeSpike: number;
        };
    };
}

function analyzeScalpSignal(
    prices: number[], 
    volumes: number[],
    timeframes: number[] // Unix timestamps for each candle
): ScalpAnalysis {
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
    
    // Calculate price momentum
    const priceChange = ((currentPrice - prices[prices.length - 2]) / prices[prices.length - 2]) * 100;
    const volumeSpike = lastVolume / avgVolume;
    
    // Time-based analysis
    const currentTime = timeframes[timeframes.length - 1];
    const hourOfDay = new Date(currentTime * 1000).getUTCHours();
    
    // Adjust for high-activity trading hours (e.g., US market hours)
    const isActiveHours = hourOfDay >= 13 && hourOfDay <= 21; // 13-21 UTC (9am-5pm EST)
    if (isActiveHours) {
        confidence += 10;
        reasons.push("⏰ Trading during active market hours");
    }
    
    // Enhanced Trend Analysis with price action
    if (ema9[ema9.length - 1] > ema21[ema21.length - 1]) {
        if (priceChange > 3) { // Strong momentum
            reasons.push("🚀 Strong bullish momentum with EMA confirmation");
            confidence += 30;
        } else {
            reasons.push("🔼 Bullish trend (EMA9 > EMA21)");
            confidence += 20;
        }
    } else {
        if (priceChange < -3) {
            reasons.push("💥 Strong bearish momentum with EMA confirmation");
            confidence -= 30;
        } else {
            reasons.push("🔽 Bearish trend (EMA9 < EMA21)");
            confidence -= 20;
        }
    }
    
    // Enhanced Volume Analysis
    if (volumeSpike > 2.5) {
        reasons.push("🌊 Extreme volume spike detected");
        confidence += 25;
    } else if (volumeSpike > 1.5) {
        reasons.push("📊 Volume above average");
        confidence += 15;
    } else if (volumeSpike < 0.5) {
        reasons.push("⚠️ Volume below average - low liquidity");
        confidence -= 15;
    }
    
    // RSI with volume confirmation
    if (rsi < 30 && volumeSpike > 1.2) {
        reasons.push("💚 Strong oversold conditions with volume support");
        confidence += 35;
    } else if (rsi > 70 && volumeSpike > 1.2) {
        reasons.push("❌ Strong overbought conditions with volume confirmation");
        confidence -= 35;
    }
    
    // MACD Analysis with momentum
    if (macd.histogram > 0 && macd.histogram > macd.signal) {
        if (priceChange > 2) {
            reasons.push("📈 Strong MACD momentum with price confirmation");
            confidence += 25;
        } else {
            reasons.push("📈 MACD shows increasing momentum");
            confidence += 15;
        }
    } else if (macd.histogram < 0 && macd.histogram < macd.signal) {
        if (priceChange < -2) {
            reasons.push("📉 Strong bearish MACD with price confirmation");
            confidence -= 25;
        } else {
            reasons.push("📉 MACD shows decreasing momentum");
            confidence -= 15;
        }
    }
    
    // Dynamic Bollinger Bands Analysis
    const bbWidth = (bb.upper - bb.lower) / bb.middle; // Volatility measure
    if (currentPrice < bb.lower && volumeSpike > 1.2) {
        reasons.push("🎯 Strong oversold with volume confirmation");
        confidence += 30;
    } else if (currentPrice > bb.upper && volumeSpike > 1.2) {
        reasons.push("⚠️ Strong overbought with volume confirmation");
        confidence -= 30;
    }
    
    // Volatility-based confidence adjustment
    if (bbWidth > 0.1) { // High volatility
        confidence *= 0.8; // Reduce confidence in volatile conditions
        reasons.push("🌋 High volatility - reducing confidence");
    }
    
    // Determine Signal Type based on adjusted confidence
    if (confidence >= 70) signalType = 'STRONG_BUY';
    else if (confidence >= 40) signalType = 'BUY';
    else if (confidence <= -70) signalType = 'STRONG_SELL';
    else if (confidence <= -40) signalType = 'SELL';
    
    // Dynamic take profit and stop loss based on volatility
    const volatilityFactor = Math.max(1, bbWidth * 10);
    const levels: PriceLevel[] = [
        {
            price: currentPrice * (1 - 0.02 * volatilityFactor),
            type: 'ENTRY',
            confidence: 80,
            percentage: -2 * volatilityFactor
        },
        {
            price: currentPrice * (1 + 0.05 * volatilityFactor),
            type: 'TP',
            confidence: 70,
            percentage: 5 * volatilityFactor
        },
        {
            price: currentPrice * (1 - 0.03 * volatilityFactor),
            type: 'SL',
            confidence: 60,
            percentage: -3 * volatilityFactor
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
            bb,
            momentum: {
                priceChange,
                volumeSpike
            }
        }
    };
}

export { analyzeScalpSignal, type ScalpAnalysis };