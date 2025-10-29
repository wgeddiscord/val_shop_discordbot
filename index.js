const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const canvas = require('canvas');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Base de données SQLite pour stocker les comptes liés
const db = new sqlite3.Database('./accounts.db');

// Création de la table si elle n'existe pas
db.run(`CREATE TABLE IF NOT EXISTS linked_accounts (
    discord_id TEXT PRIMARY KEY,
    riot_username TEXT,
    riot_password TEXT,
    region TEXT
)`);

// API Riot Games
class ValorantAPI {
    constructor() {
        this.baseURL = 'https://valorant-api.com/v1';
        this.riotAuthURL = 'https://auth.riotgames.com';
    }

    async authenticate(username, password) {
        try {
            const response = await axios.post(`${this.riotAuthURL}/authorize`, {
                client_id: 'play-valorant-web-prod',
                nonce: '1',
                redirect_uri: 'https://playvalorant.com/opt_in',
                response_type: 'token id_token'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Simulation d'authentification (à adapter avec l'API réelle)
            return {
                success: true,
                accessToken: 'mock_token',
                entitlements: 'mock_entitlements',
                puuid: 'mock_puuid'
            };
        } catch (error) {
            console.error('Erreur d\'authentification:', error);
            return { success: false, error: error.message };
        }
    }

    async getStore(accessToken, entitlements, puuid) {
        try {
            // Simulation de récupération de la boutique (à adapter avec l'API réelle)
            const mockStore = {
                skins: [
                    { name: 'Skin Phantom', price: 1775, icon: 'https://media.valorant-api.com/weaponskin/1a4a6e29-428c-0785-c523-19799b5e99b5/displayicon.png' },
                    { name: 'Skin Vandal', price: 2175, icon: 'https://media.valorant-api.com/weaponskin/9c0e4377-4442-709e-b893-b415d4984ebb/displayicon.png' },
                    { name: 'Skin Operator', price: 1775, icon: 'https://media.valorant-api.com/weaponskin/5a78212c-4499-4438-93b2-2c6283b4ba74/displayicon.png' },
                    { name: 'Skin Knife', price: 3550, icon: 'https://media.valorant-api.com/weaponskin/e336c4b8-418d-9340-d77f-7a9e4cfe0702/displayicon.png' }
                ]
            };
            return { success: true, data: mockStore };
        } catch (error) {
            console.error('Erreur récupération boutique:', error);
            return { success: false, error: error.message };
        }
    }
}

const valorantAPI = new ValorantAPI();

// Commande slash pour lier le compte
async function createLinkCommand() {
    const command = new SlashCommandBuilder()
        .setName('link-account')
        .setDescription('Lier votre compte Riot Games Valorant')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Votre nom d\'utilisateur Riot Games')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('password')
                .setDescription('Votre mot de passe Riot Games')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('region')
                .setDescription('Votre région (eu, na, ap, kr)')
                .setRequired(true)
                .addChoices(
                    { name: 'Europe', value: 'eu' },
                    { name: 'Amérique du Nord', value: 'na' },
                    { name: 'Asie-Pacifique', value: 'ap' },
                    { name: 'Corée', value: 'kr' }
                ));

    return command.toJSON();
}

// Commande slash pour voir la boutique
async function createStoreCommand() {
    const command = new SlashCommandBuilder()
        .setName('boutique')
        .setDescription('Afficher votre boutique Valorant quotidienne');

    return command.toJSON();
}

// Générer une image de la boutique
async function generateStoreImage(storeData) {
    const width = 800;
    const height = 600;
    const canvasInstance = canvas.createCanvas(width, height);
    const ctx = canvasInstance.getContext('2d');

    // Fond
    ctx.fillStyle = '#0f1923';
    ctx.fillRect(0, 0, width, height);

    // Titre
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('BOUTIQUE QUOTIDIENNE VALORANT', 50, 50);

    // Afficher les skins
    let y = 120;
    for (const skin of storeData.skins) {
        ctx.fillStyle = '#ff4654';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(skin.name, 50, y);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText(`${skin.price} VP`, 50, y + 30);
        
        y += 100;
    }

    return canvasInstance.toBuffer();
}

// Enregistrement des commandes slash
client.once('ready', async () => {
    console.log(`Bot connecté en tant que ${client.user.tag}!`);

    // Enregistrer les commandes slash
    const commands = [
        await createLinkCommand(),
        await createStoreCommand()
    ];

    try {
        await client.application.commands.set(commands);
        console.log('Commandes slash enregistrées avec succès!');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes:', error);
    }

    // Démarrer le cron job pour l'envoi automatique à 2h du matin (heure française)
    cron.schedule('0 2 * * *', async () => {
        console.log('Envoi automatique de la boutique à 2h du matin');
        await sendDailyStoreToAllUsers();
    }, {
        timezone: 'Europe/Paris'
    });
});

// Gestion des interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'link-account') {
        await handleLinkAccount(interaction);
    } else if (interaction.commandName === 'boutique') {
        await handleStoreCommand(interaction);
    }
});

async function handleLinkAccount(interaction) {
    const username = interaction.options.getString('username');
    const password = interaction.options.getString('password');
    const region = interaction.options.getString('region');

    await interaction.deferReply({ ephemeral: true });

    // Test d'authentification
    const authResult = await valorantAPI.authenticate(username, password);
    
    if (!authResult.success) {
        await interaction.editReply('❌ Erreur d\'authentification. Vérifiez vos identifiants.');
        return;
    }

    // Sauvegarder dans la base de données
    db.run(`INSERT OR REPLACE INTO linked_accounts (discord_id, riot_username, riot_password, region) VALUES (?, ?, ?, ?)`,
        [interaction.user.id, username, password, region],
        function(err) {
            if (err) {
                console.error(err);
                interaction.editReply('❌ Erreur lors de la liaison du compte.');
            } else {
                interaction.editReply('✅ Compte Riot Games lié avec succès!');
            }
        }
    );
}

async function handleStoreCommand(interaction) {
    await interaction.deferReply();

    // Récupérer le compte lié
    db.get(`SELECT * FROM linked_accounts WHERE discord_id = ?`, [interaction.user.id], async (err, row) => {
        if (err) {
            console.error(err);
            await interaction.editReply('❌ Erreur lors de la récupération de votre compte.');
            return;
        }

        if (!row) {
            await interaction.editReply('❌ Vous n\'avez pas lié de compte Riot Games. Utilisez `/link-account` d\'abord.');
            return;
        }

        // Authentification et récupération de la boutique
        const authResult = await valorantAPI.authenticate(row.riot_username, row.riot_password);
        if (!authResult.success) {
            await interaction.editReply('❌ Erreur d\'authentification. Veuillez relier votre compte.');
            return;
        }

        const storeResult = await valorantAPI.getStore(authResult.accessToken, authResult.entitlements, authResult.puuid);
        if (!storeResult.success) {
            await interaction.editReply('❌ Erreur lors de la récupération de la boutique.');
            return;
        }

        // Générer et envoyer l'image
        const imageBuffer = await generateStoreImage(storeResult.data);
        
        const embed = new EmbedBuilder()
            .setTitle('🛍️ Boutique Valorant Quotidienne')
            .setColor('#ff4654')
            .setDescription('Voici votre boutique du jour!')
            .setImage('attachment://store.png')
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed],
            files: [{ attachment: imageBuffer, name: 'store.png' }]
        });
    });
}

async function sendDailyStoreToAllUsers() {
    db.all(`SELECT * FROM linked_accounts`, async (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des comptes:', err);
            return;
        }

        for (const account of rows) {
            try {
                const authResult = await valorantAPI.authenticate(account.riot_username, account.riot_password);
                if (!authResult.success) continue;

                const storeResult = await valorantAPI.getStore(authResult.accessToken, authResult.entitlements, authResult.puuid);
                if (!storeResult.success) continue;

                const imageBuffer = await generateStoreImage(storeResult.data);
                
                const user = await client.users.fetch(account.discord_id);
                if (user) {
                    const embed = new EmbedBuilder()
                        .setTitle('🛍️ Boutique Valorant - 2h du matin')
                        .setColor('#ff4654')
                        .setDescription('Voici votre boutique quotidienne!')
                        .setImage('attachment://store.png')
                        .setTimestamp();

                    await user.send({
                        embeds: [embed],
                        files: [{ attachment: imageBuffer, name: 'store.png' }]
                    });
                }
            } catch (error) {
                console.error(`Erreur envoi boutique à ${account.discord_id}:`, error);
            }
        }
    });
}

client.login(process.env.DISCORD_TOKEN);
