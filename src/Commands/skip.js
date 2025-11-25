module.exports = {
    name: 'skip',
    description: 'Skip lagu saat ini',
    async execute(message, args, client) {
        const success = client.player.skip(message.guild.id);
        
        if (success) {
            message.reply('⏭️ Melompati lagu saat ini...');
        } else {
            message.reply('❌ Tidak ada lagu yang diputar!');
        }
    }
};