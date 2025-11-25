const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('./utils/player');
const fs = require('fs');
const path = require('path');

class MusicBot extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.commands = new Collection();
        this.config = require('../config/config.json');
        this.player = new Player(this, this.config);
    }

    async start() {
        await this.loadCommands();
        await this.loadEvents();
        
        await this.login(this.config.token);
        console.log('🤖 Bot musik berhasil dijalankan!');
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            this.commands.set(command.name, command);
        }
    }

    async loadEvents() {
        const eventsPath = path.join(__dirname, 'events');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const event = require(path.join(eventsPath, file));
            if (event.once) {
                this.once(event.name, (...args) => event.execute(...args, this));
            } else {
                this.on(event.name, (...args) => event.execute(...args, this));
            }
        }
    }
}

const bot = new MusicBot();
bot.start();