module.exports = {
    name: 'queue',
    description: 'Menampilkan daftar antrian lagu',
    async execute(message, args, client) {
        const queue = client.player.getQueue(message.guild.id);
        
        if (!queue || queue.length === 0) {
            return message.reply('📪 Queue kosong!');
        }

        const queueList = queue.slice(0, 10).map((track, index) => 
            `**${index + 1}.** ${track.title} (${track.duration})`
        ).join('\n');

        const embed = {
            color: 0x0099ff,
            title: '📋 Daftar Antrian',
            description: queueList,
            timestamp: new Date()
        };

        message.reply({ embeds: [embed] });
    }
};