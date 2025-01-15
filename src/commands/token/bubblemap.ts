import { Command } from '../../discord/Command';
import { Message, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { getTrendingTokens, VALID_TIMEFRAMES, TimeFrame } from './utils/solanatracker';
import { generateBubbleChart } from './utils/bubble-chart';
import { logger } from '../../utils/Logger';

export const bubblemap: Command = {
    name: 'bubblemap',
    handler: async (message: Message) => {
        const args = message.content.split(' ');
        const timeframe = (args[1] || '6h') as TimeFrame;

        logger.debug(`Executing bubblemap command with timeframe: ${timeframe}`, 'BubbleMap');

        if (!VALID_TIMEFRAMES.includes(timeframe)) {
            logger.warn(`Invalid timeframe attempted: ${timeframe}`, 'BubbleMap');
            return `Invalid timeframe. Available timeframes: ${VALID_TIMEFRAMES.join(', ')}`;
        }

        try {
            logger.debug('Fetching trending tokens...', 'BubbleMap');
            const trendingTokens = await getTrendingTokens(timeframe);
            logger.debug(`Found ${trendingTokens.length} trending tokens`, 'BubbleMap');

            logger.debug('Generating bubble chart...', 'BubbleMap');
            const chartBuffer = await generateBubbleChart(trendingTokens, timeframe);
            logger.debug('Bubble chart generated successfully', 'BubbleMap');
            
            const attachment = new AttachmentBuilder(chartBuffer, {
                name: 'bubblemap.png'
            });
            logger.debug('Bubble map attachment created', 'BubbleMap');

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🗺️ Token Bubble Map')
                .setDescription(`Showing trending tokens for ${timeframe} timeframe\nBubble size represents market cap, color indicates price change`)
                .setImage('attachment://bubblemap.png')
                .setTimestamp();

            logger.debug('Bubble map embed created', 'BubbleMap');

            return {
                embeds: [embed],
                files: [attachment]
            };
        } catch (error) {
            logger.error('Failed to generate bubble map', error as Error, 'BubbleMap');
            return new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Error generating bubble map. Please try again.')
                .setTimestamp();
        }
    }
}; 