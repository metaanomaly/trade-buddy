import { Command } from '../../discord/Command';
import { Message, EmbedBuilder } from 'discord.js';
import { getTokenChart, OHLCVData } from './utils/solanatracker';
import { 
    calculateRSI, 
    calculateBollingerBands, 
    calculateMACD, 
    calculateEMA 
} from './utils/technical-analysis';

function analyzeTechnicals(data: OHLCVData[]): EmbedBuilder {
    const closePrices = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    
    const rsi = calculateRSI(closePrices);
    const bb = calculateBollingerBands(closePrices);
    const macd = calculateMACD(closePrices);
    const ema9 = calculateEMA(closePrices, 9);
    const ema21 = calculateEMA(closePrices, 21);
    
    const currentPrice = closePrices[closePrices.length - 1];
    const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
    const lastVolume = volumes[volumes.length - 1];
    
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📊 Technical Analysis Report')
        .setTimestamp();

    // Price Action
    embed.addFields({
        name: '💰 Price Action',
        value: [
            `Current Price: $${currentPrice.toFixed(6)}`,
            `EMA(9): $${ema9[ema9.length - 1].toFixed(6)}`,
            `EMA(21): $${ema21[ema21.length - 1].toFixed(6)}`,
            `Trend: ${currentPrice > ema21[ema21.length - 1] ? '📈 Bullish' : '📉 Bearish'}`
        ].join('\n')
    });

    // Momentum
    embed.addFields({
        name: '🔄 Momentum',
        value: [
            `RSI(14): ${rsi.toFixed(2)} ${rsi > 70 ? '⚠️ Overbought' : rsi < 30 ? '⚠️ Oversold' : '✅ Neutral'}`,
            `MACD: ${macd.histogram > 0 ? '📈 Bullish' : '📉 Bearish'} (${macd.histogram.toFixed(6)})`
        ].join('\n')
    });

    // Volatility
    embed.addFields({
        name: '📊 Volatility',
        value: [
            `Upper BB: $${bb.upper.toFixed(6)}`,
            `Middle BB: $${bb.middle.toFixed(6)}`,
            `Lower BB: $${bb.lower.toFixed(6)}`
        ].join('\n')
    });

    // Volume Analysis
    embed.addFields({
        name: '📈 Volume',
        value: `${lastVolume > avgVolume ? '📈 Above' : '📉 Below'} Average (${((lastVolume/avgVolume)*100).toFixed(2)}% of avg)`
    });

    return embed;
}

export const ta: Command = {
    name: 'ta',
    handler: async (message: Message) => {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return "Please provide a token address. Usage: !ta <token_address>";
        }

        const address = args[1];
        try {
            const chartData = await getTokenChart(address, {
                type: '5m',
                time_from: Math.floor(Date.now()/1000) - (60 * 60 * 24) // Last 24h
            });
            
            return analyzeTechnicals(chartData.oclhv);
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Error analyzing token. Please check the address and try again.')
                .setTimestamp();
            return errorEmbed;
        }
    }
}; 