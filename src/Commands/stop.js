module.exports = {
    name: 'stop',
    description: 'Menghentikan musik dan membersihkan queue',
    async execute(message, args, client) {
        client.player.stop(message.guild.id);
        message.reply('🛑 Musik dihentikan dan queue dibersihkan!');
    }
};