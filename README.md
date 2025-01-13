# Trade Buddy
<div align="center">
    <img src="./media/buddy.jpg" alt="TradeBuddy" style="max-width: 50%; height: auto;">
    <br><br>
    <strong><em>Build your own TradeBuddy 👦🏻📱</em></strong>
    <br>
    <em><strong>⚠️ TradeBuddy is a work in progress</strong></em>
</div>



# Introduction

TradeBuddy is a (still-in-development) Discord framework bot that helps you build custom Discord bots to help you with your trading in the trenches.

# Installation

## Clone the repository

```bash
git clone https://github.com/metaanomaly/trade-buddy.git
```

## Install dependencies & build the project

```bash
pnpm install && pnpm build
```

## Run the project

```bash
pnpm start
```


# How to create custom commands

To create custom commands, you can create a new file in the `src/commands` directory.

Each command should be a class that extends the `Command` class.

Each command should have a `handler` function that takes a `Message` object as an argument and returns a string or an `EmbedBuilder` object.

## Example

```ts
import { Command } from '../discord/Command';

export class MyCommand extends Command {
    name = 'my-command';
    handler(message: Message): string | EmbedBuilder {
        return 'Hello, world!';
    }
}
```

When you run the project, the bot will automatically load all commands in the `src/commands` directory.

To use the command, you can use the `!my-command` command in your Discord server.


# How to create a discord bot

To create a discord bot you can follow the instructions [here](https://www.ionos.com/digitalguide/server/know-how/creating-discord-bot/).


Author: [MetaAnomaly](https://github.com/metaanomaly)
