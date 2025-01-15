import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { config } from 'dotenv';
import { Command } from './discord/Command';
import { logger, LogLevel } from './utils/Logger';
import * as fs from 'fs';
import * as path from 'path';

config();


if (process.env.DEBUG === 'true') {
    logger.setLogLevel(LogLevel.DEBUG);
}

interface CommandConfig {
    name: string;
    description: string;
    source: string;
}

interface CommandsConfig {
    commands: CommandConfig[];
}

async function loadCommands(): Promise<Map<string, Command>> {
    const commandMap = new Map<string, Command>();
    
    try {
        const configPath = path.join(process.cwd(), 'commands.json');
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const config: CommandsConfig = JSON.parse(configContent);
        
        for (const cmdConfig of config.commands) {
            try {
                const commandModule = await import(cmdConfig.source);
                const command = commandModule[cmdConfig.name];
                if (command) {
                    command.description = cmdConfig.description; // Add description to command object
                    commandMap.set('!' + cmdConfig.name, command);
                    logger.debug(`Loaded command: !${cmdConfig.name}`, 'Commands');
                }
            } catch (error) {
                logger.error(`Failed to load command ${cmdConfig.name}`, error as Error, 'Commands');
            }
        }
    } catch (error) {
        logger.error('Failed to load commands.json', error as Error, 'Commands');
    }
    
    return commandMap;
}

(async () => {
    const commands = await loadCommands();
    logger.info(`Loaded ${commands.size} commands`, 'Startup');
    for (const command of commands.values()) {
        logger.debug(`Registered command: !${command.name}`, 'Commands');
    }

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent
        ]
    });

    client.on("messageCreate", async (message) => {
        if (message.content && !message.author.bot) {
            const commandName = message.content.split(' ')[0];
            if (commands.has(commandName)) {
                logger.command(
                    message.author.username,
                    commandName,
                    message.guild?.name
                );

                try {
                    const command = commands.get(commandName);
                    if (command) {
                        const response = await command.handler(message);
                        if (response instanceof EmbedBuilder) {
                            await message.channel.send({ 
                                embeds: [response], 
                                reply: { messageReference: message.id } 
                            });
                        } else {
                            await message.channel.send({ 
                                content: response, 
                                reply: { messageReference: message.id } 
                            });
                        }
                    }
                } catch (error) {
                    logger.error(
                        `Failed to execute command ${commandName}`,
                        error as Error,
                        'Command'
                    );
                }
            }
        }
    });

    client.login(process.env.DISCORD_TOKEN)
        .then(() => logger.info('Bot successfully connected to Discord', 'Startup'))
        .catch(error => logger.error('Failed to connect to Discord', error, 'Startup'));
})();