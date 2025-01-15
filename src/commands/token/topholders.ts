import { Command } from '../../discord/Command';
import { Message, EmbedBuilder } from 'discord.js';
import { getTopHolders } from './utils/solanatracker';

function formatHoldersEmbed(holders: Array<{
    address: string;
    amount: number;
    percentage: number;
    value: { quote: number; usd: number; }
}>, address: string): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('👥 Top Token Holders')
        .setDescription(`Token Address: \`${address}\``)
        .setTimestamp();

    if (holders.length === 0) {
        embed.addFields({ 
            name: 'No Results', 
            value: 'No holders found for this token' 
        });
        return embed;
    }

    holders.slice(0, 10).forEach((holder, index) => {
        embed.addFields({
            name: `#${index + 1} Holder`,
            value: [
                `💼 [View Wallet](https://solscan.io/account/${holder.address}#portfolio)`,
                `💰 Amount: ${holder.amount.toLocaleString()} tokens`,
                `📊 Percentage: ${holder.percentage.toFixed(2)}%`,
                `💵 Value: $${holder.value.usd.toLocaleString()}`
            ].join('\n')
        });
    });

    embed.setFooter({ 
        text: `Showing top ${Math.min(10, holders.length)} holders`
    });

    return embed;
}

export const topholders: Command = {
    name: 'topholders',
    handler: async (message: Message) => {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return "Please provide a token address. Usage: !topholders <token_address>";
        }

        const address = args[1];
        try {
            const holders = await getTopHolders(address);
            return formatHoldersEmbed(holders, address);
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Error fetching top holders. Please check the address and try again.')
                .setTimestamp();
            return errorEmbed;
        }
    }
}; 