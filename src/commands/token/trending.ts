import { Command } from '../../discord/Command';
import { Message, EmbedBuilder } from 'discord.js';
import { getTrendingTokens, VALID_TIMEFRAMES, TimeFrame } from './utils/solanatracker';

function formatTrendingEmbed(tokens: any[], timeframe: TimeFrame): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🔥 Trending Tokens')
        .setDescription(`Top trending tokens in the last ${timeframe}`)
        .setTimestamp();

    tokens.slice(0, 10).forEach((data, index) => {
        const { token, pools, events } = data;
        const mainPool = pools[0];
        const priceChange = events[timeframe]?.priceChangePercentage || 0;
        
        embed.addFields({
            name: `${index + 1}. ${token.name} (${token.symbol})`,
            value: [
                `💰 Price: $${mainPool?.price?.usd.toFixed(6) || 'N/A'}`,
                `📈 Change: ${priceChange.toFixed(2)}%`,
                `💧 Liquidity: $${mainPool?.liquidity?.usd.toLocaleString() || 'N/A'}`,
                `🏷️ Address: \`${token.mint}\``
            ].join('\n')
        });
    });

    return embed;
}

export const trending: Command = {
    name: 'trending',
    handler: async (message: Message) => {
        const args = message.content.split(' ');
        const timeframe = (args[1] || '6h') as TimeFrame;

        if (!VALID_TIMEFRAMES.includes(timeframe)) {
            return `Invalid timeframe. Available timeframes: ${VALID_TIMEFRAMES.join(', ')}`;
        }

        try {
            const trendingTokens = await getTrendingTokens(timeframe);
            return formatTrendingEmbed(trendingTokens, timeframe);
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Error fetching trending tokens. Please try again.')
                .setTimestamp();
            return errorEmbed;
        }
    }
}; 