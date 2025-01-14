import { Command } from '../../discord/Command';
import { Message, EmbedBuilder } from 'discord.js';
import { getWalletPnl, TokenPnlInfo } from './utils/solanatracker';

function formatPnlEmbed(wallet: string, pnlData: any): EmbedBuilder {
    const { summary } = pnlData;
    
    const embed = new EmbedBuilder()
        .setColor(summary.total >= 0 ? '#00ff00' : '#ff0000')
        .setTitle('💰 Wallet PNL Analysis')
        .setDescription(`Analysis for wallet: \`${wallet}\``)
        .setTimestamp();

    // Add summary statistics
    embed.addFields({
        name: '📊 Overall Performance',
        value: [
            `💵 Total PNL: $${summary.total.toFixed(2)}`,
            `📈 Realized: $${summary.realized.toFixed(2)}`,
            `📉 Unrealized: $${summary.unrealized.toFixed(2)}`,
            `💰 Total Invested: $${summary.totalInvested.toFixed(2)}`,
            `🎯 Average Buy: $${summary.averageBuyAmount.toFixed(2)}`
        ].join('\n')
    });

    // Add win/loss statistics
    embed.addFields({
        name: '🎮 Win/Loss Stats',
        value: [
            `✅ Wins: ${summary.totalWins} (${summary.winPercentage.toFixed(1)}%)`,
            `❌ Losses: ${summary.totalLosses} (${summary.lossPercentage.toFixed(1)}%)`
        ].join('\n')
    });

    // Add top performing tokens if any
    const tokens = Object.entries(pnlData.tokens)
        .sort((a, b) => (b[1] as TokenPnlInfo).total - (a[1] as TokenPnlInfo).total)
        .slice(0, 5);

    if (tokens.length > 0) {
        const tokenList = tokens.map(([address, data]: [string, any]) => 
            `• \`${address}\`: $${data.total.toFixed(2)} (R: $${data.realized.toFixed(2)} | U: $${data.unrealized.toFixed(2)})`
        ).join('\n');

        embed.addFields({
            name: '🏆 Top Performing Tokens',
            value: tokenList
        });
    }

    return embed;
}

export const pnl: Command = {
    name: 'pnl',
    handler: async (message: Message) => {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return "Please provide a wallet address. Usage: !pnl <wallet_address>";
        }

        const wallet = args[1];
        try {
            const pnlData = await getWalletPnl(wallet);
            return formatPnlEmbed(wallet, pnlData);
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Error fetching wallet PNL. Please check the address and try again.')
                .setTimestamp();
            return errorEmbed;
        }
    }
}; 