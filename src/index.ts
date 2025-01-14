import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { config } from 'dotenv';
import { Command } from './discord/Command';
import { logger } from './utils/Logger';

config(); // Load environment variables

async function loadCommands(): Promise<Map<string, Command>> {
    const commands = await import('./commands');
    const commandMap = new Map<string, Command>();
    for (const command of Object.values(commands)) {
        commandMap.set('!' + command.name, command);
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