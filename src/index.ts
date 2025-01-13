import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { config } from 'dotenv';
import { Command } from './discord/Command';

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
    console.log(`Loaded ${commands.size} commands`);
    for (const command of commands.values()) {
        console.log(`!${command.name}`);
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
        console.log(`${message.author.username}: ${message.content}`);

        if (message.content && !message.author.bot) {
            if (commands.has(message.content.split(' ')[0])) {
                // Process the command
                const command = commands.get(message.content.split(' ')[0]);
                if (command) {
                    const response = await command.handler(message);
                    // Send in reply-to message
                    if (response instanceof EmbedBuilder) {
                        message.channel.send({ embeds: [response], reply: { messageReference: message.id } });
                    } else {
                        message.channel.send({ content: response, reply: { messageReference: message.id } });
                    }
                }
            }
        }


    });

    client.login(process.env.DISCORD_TOKEN);
})();