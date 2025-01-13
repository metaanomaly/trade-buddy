import { Command } from '../../discord/Command';
import { Message, EmbedBuilder } from 'discord.js';
import { getTokenDetails } from './utils/solanatracker';

function getRiskLevelColor(score: number): number {
    if (score <= 2) return 0x00ff00; // Green
    if (score <= 5) return 0xffff00; // Yellow
    return 0xff0000; // Red
}

function formatRiskEmbed(address: string, tokenData: any): EmbedBuilder {
    const { token, risk } = tokenData;
    
    const embed = new EmbedBuilder()
        .setColor(getRiskLevelColor(risk.score))
        .setTitle('🔍 Token Risk Analysis')
        .setDescription(`Analysis for ${token.name} (${token.symbol})\nAddress: \`${address}\``)
        .setTimestamp();

    // Add basic token info
    embed.addFields({
        name: '📝 Basic Info',
        value: [
            `Name: ${token.name}`,
            `Symbol: ${token.symbol}`,
            `Decimals: ${token.decimals}`,
            token.creator?.name ? `Creator: ${token.creator.name}` : null,
            token.creator?.site ? `Website: ${token.creator.site}` : null
        ].filter(Boolean).join('\n')
    });

    // Add risk score and rugged status
    embed.addFields({
        name: '⚠️ Risk Score',
        value: `${risk.score}/10 ${risk.rugged ? '⛔️ TOKEN IS RUGGED' : ''}`,
        inline: true
    });

    // Add transaction metrics
    embed.addFields({
        name: '📊 Activity',
        value: `Buys: ${tokenData.buys}\nSells: ${tokenData.sells}\nTotal Txns: ${tokenData.txns}`,
        inline: true
    });

    // Add detailed risk factors if any
    if (risk.risks.length > 0) {
        const riskFactors = risk.risks.map(r => 
            `• ${r.name} (${r.level})\n  ${r.description}`
        ).join('\n\n');
        
        embed.addFields({
            name: '🚨 Risk Factors',
            value: riskFactors
        });
    }

    return embed;
}

export const check: Command = {
    name: 'check',
    handler: async (message: Message) => {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return "Please provide a token address. Usage: !check <token_address>";
        }

        const address = args[1];
        try {
            const tokenData = await getTokenDetails(address);
            return formatRiskEmbed(address, tokenData);
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('Error fetching token data. Please check the address and try again.')
                .setTimestamp();
            return errorEmbed;
        }
    }
} 