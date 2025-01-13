import { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";

export interface Command {
    name: string;
    handler: (message: Message) => Promise<string | EmbedBuilder>;
}