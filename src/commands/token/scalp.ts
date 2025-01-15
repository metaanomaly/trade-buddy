import { Command } from '../../discord/Command';
import { Message, EmbedBuilder } from 'discord.js';
import { getTokenChart } from './utils/solanatracker';
import { analyzeScalpSignal, type ScalpAnalysis } from './utils/scalp-analysis';

function getSignalColor(signal: string): number {
    switch (signal) {
        case 'STRONG_BUY': return 0x00ff00;
        case 'BUY': return 0x90EE90;
        case 'STRONG_SELL': return 0xff0000;
        case 'SELL': return 0xFFCCCB;
        default: return 0xFFFF00;
    }
}

function formatScalpEmbed(analysis: ScalpAnalysis, currentPrice: number): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(getSignalColor(analysis.signal.type))
        .setTitle('🎯 Scalp Trading Analysis')
        .setDescription(`Current Price: $${currentPrice.toFixed(6)}`)
        .setTimestamp();

    // Signal and Confidence
    embed.addFields({
        name: '📊 Signal Analysis',
        value: [
            `Signal: ${analysis.signal.type.replace('_', ' ')}`,
            `Confidence: ${analysis.signal.confidence}%`,
            '',
            '🔍 Reasons:',
            analysis.signal.reasons.join('\n')
        ].join('\n')
    });

    // Key Levels
    embed.addFields({
        name: '📍 Key Levels',
        value: analysis.levels.map(level => 
            `${level.type === 'ENTRY' ? '⭐' : level.type === 'TP' ? '🎯' : '🛑'} ${level.type}: $${level.price.toFixed(6)} (${level.percentage.toFixed(2)}%) [${level.confidence}% confidence]`
        ).join('\n')
    });

    // Technical Metrics
    embed.addFields({
        name: '📐 Technical Metrics',
        value: [
            `RSI: ${analysis.metrics.rsi.toFixed(2)}`,
            `MACD: ${analysis.metrics.macd.histogram > 0 ? '📈' : '📉'} ${analysis.metrics.macd.histogram.toFixed(6)}`,
            `EMAs: Fast=${analysis.metrics.ema.fast.toFixed(6)} / Slow=${analysis.metrics.ema.slow.toFixed(6)}`,
            `BB Middle: $${analysis.metrics.bb.middle.toFixed(6)}`,
            `Momentum: ${analysis.metrics.momentum.priceChange > 0 ? '📈' : '📉'} ${analysis.metrics.momentum.priceChange.toFixed(2)}%`,
            `Volume Spike: ${analysis.metrics.momentum.volumeSpike.toFixed(2)}x`
        ].join('\n')
    });

    return embed;
}

export const scalp: Command = {
    name: 'scalp',
    handler: async (message: Message) => {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return "Please provide a token address. Usage: !scalp <token_address>";
        }

        const address = args[1];
        try {
            const chartData = await getTokenChart(address, {
                type: '1m',
                time_from: Math.floor(Date.now()/1000) - (60 * 30) // Last 30 minutes
            });
            
            const prices = chartData.oclhv.map(d => d.close);
            const volumes = chartData.oclhv.map(d => d.volume);
            const timeframes = chartData.oclhv.map(d => d.time);
            const analysis = analyzeScalpSignal(prices, volumes, timeframes);
            
            return formatScalpEmbed(analysis, prices[prices.length - 1]);
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Error analyzing token for scalping. Please check the address and try again.')
                .setTimestamp();
            return errorEmbed;
        }
    }
}; 