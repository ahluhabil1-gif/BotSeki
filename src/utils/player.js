const { AudioPlayer, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const spotify = require('spotify-url-info');
const soundcloud = require('soundcloud-scraper');

class Player {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.queues = new Map();
        this.players = new Map();
    }

    async play(guildId, voiceChannel, query) {
        try {
            const track = await this.searchTrack(query);
            if (!track) return null;

            if (!this.queues.has(guildId)) {
                this.queues.set(guildId, []);
            }

            this.queues.get(guildId).push(track);

            if (!this.players.has(guildId)) {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guildId,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });

                const player = createAudioPlayer();
                connection.subscribe(player);
                this.players.set(guildId, { connection, player });

                connection.on(VoiceConnectionStatus.Disconnected, async () => {
                    try {
                        await Promise.race([
                            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                        ]);
                    } catch (error) {
                        connection.destroy();
                        this.queues.delete(guildId);
                        this.players.delete(guildId);
                    }
                });
            }

            if (this.queues.get(guildId).length === 1) {
                this.playNext(guildId);
            }

            return track;
        } catch (error) {
            console.error('Error playing track:', error);
            return null;
        }
    }

    async searchTrack(query) {
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            return await this.getYouTubeTrack(query);
        } else if (query.includes('spotify.com')) {
            return await this.getSpotifyTrack(query);
        } else if (query.includes('soundcloud.com')) {
            return await this.getSoundCloudTrack(query);
        } else {
            return await this.searchYouTube(query);
        }
    }

    async getYouTubeTrack(url) {
        try {
            const info = await ytdl.getInfo(url);
            return {
                title: info.videoDetails.title,
                url: info.videoDetails.video_url,
                duration: this.formatDuration(parseInt(info.videoDetails.lengthSeconds)),
                thumbnail: info.videoDetails.thumbnails[0].url,
                platform: 'YouTube'
            };
        } catch (error) {
            console.error('Error getting YouTube track:', error);
            return null;
        }
    }

    async searchYouTube(query) {
        try {
            const searchResult = await yts(query);
            if (searchResult.videos.length > 0) {
                const video = searchResult.videos[0];
                return {
                    title: video.title,
                    url: video.url,
                    duration: video.duration.toString(),
                    thumbnail: video.thumbnail,
                    platform: 'YouTube'
                };
            }
            return null;
        } catch (error) {
            console.error('Error searching YouTube:', error);
            return null;
        }
    }

    async getSpotifyTrack(url) {
        try {
            const data = await spotify.getData(url);
            const searchQuery = `${data.name} ${data.artists.map(artist => artist.name).join(' ')}`;
            return await this.searchYouTube(searchQuery);
        } catch (error) {
            console.error('Error getting Spotify track:', error);
            return await this.searchYouTube(url);
        }
    }

    async getSoundCloudTrack(url) {
        try {
            const client = new soundcloud.Client();
            const song = await client.getSongInfo(url);
            const searchQuery = `${song.title} ${song.artist}`;
            return await this.searchYouTube(searchQuery);
        } catch (error) {
            console.error('Error getting SoundCloud track:', error);
            return await this.searchYouTube(url);
        }
    }

    async playNext(guildId) {
        const queue = this.queues.get(guildId);
        const playerData = this.players.get(guildId);

        if (!queue || queue.length === 0 || !playerData) {
            if (playerData) {
                playerData.connection.destroy();
                this.players.delete(guildId);
            }
            this.queues.delete(guildId);
            return;
        }

        const track = queue[0];
        try {
            const stream = ytdl(track.url, { 
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });

            const resource = createAudioResource(stream);
            playerData.player.play(resource);

            playerData.player.on('idle', () => {
                queue.shift();
                this.playNext(guildId);
            });

        } catch (error) {
            console.error('Error playing track:', error);
            queue.shift();
            this.playNext(guildId);
        }
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    skip(guildId) {
        const playerData = this.players.get(guildId);
        if (playerData) {
            playerData.player.stop();
            return true;
        }
        return false;
    }

    stop(guildId) {
        const queue = this.queues.get(guildId);
        const playerData = this.players.get(guildId);

        if (queue) queue.length = 0;
        if (playerData) {
            playerData.player.stop();
            playerData.connection.destroy();
        }

        this.queues.delete(guildId);
        this.players.delete(guildId);
    }

    getQueue(guildId) {
        return this.queues.get(guildId) || [];
    }
}

module.exports = { Player };