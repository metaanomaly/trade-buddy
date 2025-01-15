import { Command } from '../../discord/Command';
import { Message, EmbedBuilder } from 'discord.js';
import { getFirstTokenBuyers } from './utils/solanatracker';

function formatBuyersEmbed(buyers: Array<{ wallet: string; total: number }>, address: string): EmbedBuilder {
    const filteredBuyers = buyers.filter(buyer => buyer.total > 10000);
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🌟 First Buyers Analysis')
        .setDescription(`Token Address: \`${address}\``)
        .setTimestamp();

    if (filteredBuyers.length === 0) {
        embed.addFields({ 
            name: 'No Results', 
            value: 'No buyers found with PNL > 10000 USD' 
        });
        return embed;
    }

    filteredBuyers.forEach((buyer, index) => {
        const pnl = Math.round(buyer.total);
        embed.addFields({
            name: `Buyer #${index + 1}`,
            value: `💼 [View Wallet](https://gmgn.ai/sol/address/${buyer.wallet})\n💰 PNL: ${pnl} USD`
        });
    });

    embed.setFooter({ 
        text: `Found ${filteredBuyers.length} buyers with PNL > 10000 USD`
    });

    return embed;
}

export const firstbuyers: Command = {
    name: 'firstbuyers',
    handler: async (message: Message) => {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return "Please provide a token address. Usage: !firstbuyers <token_address>";
        }

        const address = args[1];
        try {
            const buyers = await getFirstTokenBuyers(address);
            return formatBuyersEmbed(buyers, address);
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Error fetching first buyers. Please check the address and try again.')
                .setTimestamp();
            return errorEmbed;
        }
    }
};
