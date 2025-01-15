import { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";

export interface Command {
    name: string;
    description?: string;
    handler: (message: Message) => Promise<string | EmbedBuilder | {
        content?: string;
        embeds?: EmbedBuilder[];
        files?: any[];
    }>;
}