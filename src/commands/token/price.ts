import { Command } from '../../discord/Command';
import { Message } from 'discord.js';
import { getTokenPrice, formatTokenPriceData } from './utils/solanatracker';

export const price: Command = {
    name: 'price',
    handler: async (message: Message) => {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return "Please provide a token address. Usage: !price <token_address>";
        }

        const address = args[1];
        try {
            const priceData = await getTokenPrice(address);
            return formatTokenPriceData(priceData);
        } catch (error) {
            return "Error fetching token price. Please check the address and try again.";
        }
    }
}