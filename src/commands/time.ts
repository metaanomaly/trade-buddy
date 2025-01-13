import { Command } from '../discord/Command';
import { Message } from 'discord.js';

export const time: Command = {
    name: 'time',
    handler: async (message: Message) => {
        return "The current time is: " + new Date().toISOString();
    }
}