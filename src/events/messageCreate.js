module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.content.startsWith(client.config.prefix)) return;

        const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(error);
            message.reply('❌ Terjadi error saat menjalankan command!');
        }
    }
};