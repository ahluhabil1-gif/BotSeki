module.exports = {
    name: 'nowplaying',
    description: 'Menampilkan lagu yang sedang diputar',
    async execute(message, args, client) {
        const queue = client.player.getQueue(message.guild.id);
        
        if (!queue || queue.length === 0) {
            return message.reply('❌ Tidak ada lagu yang sedang diputar!');
        }

        const currentTrack = queue[0];
        const embed = {
            color: 0x00ff00,
            title: '🎵 Sedang Diputar',
            fields: [
                { name: 'Judul', value: currentTrack.title, inline: false },
                { name: 'Durasi', value: currentTrack.duration, inline: true },
                { name: 'Platform', value: currentTrack.platform, inline: true }
            ],
            thumbnail: { url: currentTrack.thumbnail },
            timestamp: new Date()
        };

        message.reply({ embeds: [embed] });
    }
};