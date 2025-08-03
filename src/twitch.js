const axios = require('axios');

class TwitchAPI {
    constructor() {
        this.clientId = process.env.TWITCH_CLIENT_ID;
        this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
        this.accessToken = null;
        this.tokenExpiresAt = null;
    }

    async getAccessToken() {
        try {
            const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
                params: {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'client_credentials'
                }
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
            
            console.log('✅ Token Twitch ottenuto con successo');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Errore nell\'ottenere il token Twitch:', error.response?.data || error.message);
            throw error;
        }
    }

    async ensureValidToken() {
        if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
            await this.getAccessToken();
        }
        return this.accessToken;
    }

    async makeRequest(url, params = {}) {
        await this.ensureValidToken();

        try {
            const response = await axios.get(url, {
                headers: {
                    'Client-ID': this.clientId,
                    'Authorization': `Bearer ${this.accessToken}`
                },
                params: params
            });

            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                // Token scaduto, riprova
                this.accessToken = null;
                await this.ensureValidToken();
                
                const retryResponse = await axios.get(url, {
                    headers: {
                        'Client-ID': this.clientId,
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    params: params
                });

                return retryResponse.data;
            }
            throw error;
        }
    }

    async getUserData(username) {
        try {
            const data = await this.makeRequest('https://api.twitch.tv/helix/users', {
                login: username
            });

            return data.data[0] || null;
        } catch (error) {
            console.error(`❌ Errore nel recuperare i dati utente per ${username}:`, error.message);
            return null;
        }
    }

    async getStreamData(username) {
        try {
            // Prima ottieni i dati dell'utente
            const userData = await this.getUserData(username);
            if (!userData) {
                console.log(`⚠️ Utente ${username} non trovato`);
                return null;
            }

            // Poi ottieni i dati dello stream
            const streamData = await this.makeRequest('https://api.twitch.tv/helix/streams', {
                user_login: username
            });

            if (streamData.data && streamData.data.length > 0) {
                const stream = streamData.data[0];
                
                // Aggiungi i dati dell'utente ai dati dello stream
                stream.profile_image_url = userData.profile_image_url;
                
                return stream;
            }

            return null;
        } catch (error) {
            console.error(`❌ Errore nel recuperare i dati dello stream per ${username}:`, error.response?.data || error.message);
            return null;
        }
    }

    async getGameData(gameId) {
        try {
            const data = await this.makeRequest('https://api.twitch.tv/helix/games', {
                id: gameId
            });

            return data.data[0] || null;
        } catch (error) {
            console.error(`❌ Errore nel recuperare i dati del gioco ${gameId}:`, error.message);
            return null;
        }
    }
}

module.exports = TwitchAPI;
