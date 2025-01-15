import { Command } from '../../discord/Command';
import { Message, EmbedBuilder } from 'discord.js';
import { getTokenChart } from './utils/solanatracker';
import { backtest, type BacktestResult } from './utils/backtest-utils';
import { calculateEMA, calculateRSI, calculateBollingerBands } from './utils/technical-analysis';
function formatBacktestEmbed(results: BacktestResult[], address: string, currentPrice: number, prices: number[], volumes: number[], timeframes: number[]): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🤖 Scalp Strategy Backtest Results')
        .setDescription(`Token Address: \`${address}\`\nTested last 500 candles`)
        .setTimestamp();

    // Sort results by total PnL
    const sortedResults = results.sort((a, b) => b.performance.totalPnl - a.performance.totalPnl);
    const bestStrategy = sortedResults[0];

    // Get current signal based on best strategy
    const currentSignal = getCurrentSignal(bestStrategy, prices, volumes, timeframes);
    
    // Best Strategy Summary
    embed.addFields({
        name: '🏆 Best Strategy',
        value: [
            `Strategy: ${bestStrategy.strategy} (${bestStrategy.entryType})`,
            `Take Profit: ${bestStrategy.params.tp}%`,
            `Stop Loss: ${bestStrategy.params.sl}%`,
            `Win Rate: ${bestStrategy.performance.winRate.toFixed(2)}%`,
            `Total PnL: ${bestStrategy.performance.totalPnl.toFixed(2)}%`,
            `Trades: ${bestStrategy.performance.trades}`,
            `Average ROI: ${bestStrategy.performance.avgRoi.toFixed(2)}%`,
            `Max Drawdown: ${bestStrategy.performance.maxDrawdown.toFixed(2)}%`
        ].join('\n')
    });

    // Current Signal and Levels
    embed.addFields({
        name: '🎯 Current Trading Setup',
        value: [
            `Current Price: $${currentPrice.toFixed(6)}`,
            `Signal: ${currentSignal.signal}`,
            `Entry Zone: $${currentSignal.entry.toFixed(6)} (${currentSignal.entryPercent.toFixed(2)}% from current)`,
            `Take Profit: $${currentSignal.tp.toFixed(6)} (${bestStrategy.params.tp}%)`,
            `Stop Loss: $${currentSignal.sl.toFixed(6)} (${bestStrategy.params.sl}%)`,
            `Confidence: ${currentSignal.confidence}%`
        ].join('\n')
    });

    // Top 3 Strategies Comparison
    const topStrategies = sortedResults.slice(0, 3);
    embed.addFields({
        name: '🔍 Top 3 Strategies Comparison',
        value: topStrategies.map((result, index) => 
            `${index + 1}. ${result.strategy} (${result.entryType})\n` +
            `   TP: ${result.params.tp}% | SL: ${result.params.sl}%\n` +
            `   Win Rate: ${result.performance.winRate.toFixed(2)}% | PnL: ${result.performance.totalPnl.toFixed(2)}%`
        ).join('\n\n')
    });

    return embed;
}

function getCurrentSignal(bestStrategy: BacktestResult, prices: number[], volumes: number[], timeframes: number[]) {
    const currentPrice = prices[prices.length - 1];
    let signal = 'NEUTRAL';
    let confidence = 0;
    let entry = currentPrice;
    let entryPercent = 0;

    // Calculate signal based on strategy type
    if (bestStrategy.strategy === 'EMA') {
        const fastEMA = calculateEMA(prices, bestStrategy.params.emaFast!);
        const slowEMA = calculateEMA(prices, bestStrategy.params.emaSlow!);
        if (fastEMA[fastEMA.length - 1] > slowEMA[slowEMA.length - 1]) {
            signal = 'BUY';
            confidence = 70;
        }
    } else if (bestStrategy.strategy === 'RSI') {
        const rsi = calculateRSI(prices);
        if (rsi < bestStrategy.params.rsiThreshold!) {
            signal = 'BUY';
            confidence = 80;
            entryPercent = -1; // Suggest entry 1% below current price
            entry = currentPrice * 0.99;
        }
    } else if (bestStrategy.strategy === 'BB') {
        const bb = calculateBollingerBands(prices);
        if (currentPrice < bb.lower) {
            signal = 'BUY';
            confidence = 75;
            entry = bb.lower;
            entryPercent = ((entry - currentPrice) / currentPrice) * 100;
        }
    }

    return {
        signal,
        confidence,
        entry,
        entryPercent,
        tp: entry * (1 + bestStrategy.params.tp/100),
        sl: entry * (1 - bestStrategy.params.sl/100)
    };
}

export const backtestscalp: Command = {
    name: 'backtest-scalp',
    handler: async (message: Message) => {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return "Please provide a token address. Usage: !backtest-scalp <token_address>";
        }

        const address = args[1];
        try {
            const chartData = await getTokenChart(address, {
                type: '1m',
                time_from: Math.floor(Date.now()/1000) - (60 * 500) // Last 500 minutes
            });
            
            const prices = chartData.oclhv.map(d => d.close);
            const timeframes = chartData.oclhv.map(d => d.time);

            // Test different strategies and parameters
            const results: BacktestResult[] = [];

            // Test EMA strategies
            const emaCombinations = [
                { fast: 7, slow: 21 },
                { fast: 9, slow: 21 },
                { fast: 12, slow: 26 }
            ];

            for (const ema of emaCombinations) {
                for (const tp of [3, 5, 7]) {
                    for (const sl of [1, 2, 3]) {
                        results.push(backtest(prices, timeframes, 'EMA', {
                            tp,
                            sl,
                            emaFast: ema.fast,
                            emaSlow: ema.slow
                        }));
                    }
                }
            }

            // Test RSI strategies
            for (const rsiThreshold of [25, 30]) {
                for (const tp of [5, 7, 10]) {
                    for (const sl of [2, 3]) {
                        results.push(backtest(prices, timeframes, 'RSI', {
                            tp,
                            sl,
                            rsiThreshold
                        }));
                    }
                }
            }

            // Test BB strategies
            for (const tp of [3, 5, 7]) {
                for (const sl of [1, 2, 3]) {
                    results.push(backtest(prices, timeframes, 'BB', { tp, sl }));
                }
            }

            const currentPrice = prices[prices.length - 1];
            return formatBacktestEmbed(results, address, currentPrice, prices, chartData.oclhv.map(d => d.volume), timeframes);
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Error running backtest. Please check the address and try again.')
                .setTimestamp();
            return errorEmbed;
        }
    }
}; 