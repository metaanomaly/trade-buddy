import { Command } from '../discord/Command';
import { Message, EmbedBuilder } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

interface CommandConfig {
    name: string;
    description: string;
    source: string;
}

interface CommandsConfig {
    commands: CommandConfig[];
}

export const list: Command = {
    name: 'list',
    description: 'Show all available commands',
    handler: async (message: Message) => {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Available Commands')
            .setDescription('Here are all available commands:')
            .setTimestamp();

        try {
            const configPath = path.join(process.cwd(), 'commands.json');
            const configContent = fs.readFileSync(configPath, 'utf-8');
            const config: CommandsConfig = JSON.parse(configContent);
            
            const commandList = config.commands
                .map(cmd => `\`!${cmd.name}\`: ${cmd.description}`)
                .join('\n');

            embed.addFields({
                name: 'Commands',
                value: commandList
            });

        } catch (error) {
            embed.setColor('#ff0000')
                .setDescription('Error loading commands list');
        }

        return embed;
    }
};