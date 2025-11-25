module.exports = {
    name: 'play',
    description: 'Memutar musik dari YouTube, Spotify, atau SoundCloud',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Anda harus berada di voice channel!');
        }

        if (!args.length) {
            return message.reply('❌ Mohon berikan URL atau judul lagu!');
        }

        const query = args.join(' ');
        
        const searchingMsg = await message.reply('🔍 Mencari track...');
        
        try {
            const track = await client.player.play(message.guild.id, voiceChannel, query);
            
            if (track) {
                const embed = {
                    color: 0x0099ff,
                    title: '🎵 Ditambahkan ke Queue',
                    fields: [
                        { name: 'Judul', value: track.title.length > 256 ? track.title.substring(0, 253) + '...' : track.title, inline: false },
                        { name: 'Durasi', value: track.duration, inline: true },
                        { name: 'Platform', value: track.platform, inline: true }
                    ],
                    thumbnail: { url: track.thumbnail },
                    timestamp: new Date()
                };
                await searchingMsg.edit({ content: '', embeds: [embed] });
            } else {
                await searchingMsg.edit('❌ Track tidak ditemukan!');
            }
        } catch (error) {
            console.error(error);
            await searchingMsg.edit('❌ Terjadi error saat memutar musik!');
        }
    }
};