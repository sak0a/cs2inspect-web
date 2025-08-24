// steamClient.ts
import SteamUser from 'steam-user';
import GlobalOffensive from 'globaloffensive';
import { EventEmitter } from 'events';

interface QueueItem {
    inspectData: InspectURLInfo;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timestamp: number;
}

class SteamClient extends EventEmitter {
    private static instance: SteamClient;
    private steamClient: SteamUser;
    private csgoClient: GlobalOffensive;
    private queue: QueueItem[] = [];
    private processing: boolean = false;
    private isReady: boolean = false;
    private readonly RATE_LIMIT_DELAY = 1500; // 1.5 seconds between requests
    private readonly MAX_QUEUE_SIZE = 100;
    private readonly QUEUE_TIMEOUT = 30000; // 30 seconds
    private readonly REQUEST_TIMEOUT = 10000;

    private constructor() {
        super();
        this.steamClient = new SteamUser();
        this.csgoClient = new GlobalOffensive(this.steamClient);
        this.setupEventHandlers();
    }

    public static getInstance(): SteamClient {
        if (!SteamClient.instance) {
            SteamClient.instance = new SteamClient();
        }
        return SteamClient.instance;
    }

    private setupEventHandlers(): void {
        this.steamClient.on('error', (err: Error) => {
            console.log('[Steam Client] Error:', err.message);
            this.emit('error', { type: 'steam', error: err });
        });

        this.steamClient.on('loggedOn', () => {
            console.log('[Steam Client] Logged into Steam');
            console.log('[Steam Client] Setting persona and playing CS2');
            this.steamClient.setPersona(SteamUser.EPersonaState.Online);
            this.steamClient.gamesPlayed([730]);
        });

        this.csgoClient.on('debug', (message: string) => {
            console.log('[CS2 Client] ', message);
        });

        this.csgoClient.on('connectedToGC', () => {
            this.isReady = true;
            console.log('[CS2 Client] Connected to CS2 Game Coordinator');

            // Connect to the specified server
            this.connectToServer('212.87.215.43:27016');

            this.emit('ready');
            this.processQueue();
        });

        this.csgoClient.on('disconnectedFromGC', (reason: any) => {
            console.log('[CS2 Client] Disconnected from CS2 Game Coordinator:', reason);
            this.isReady = false;
            this.emit('disconnected', reason);
        });

        this.csgoClient.on('inspectItemInfo', (item: any) => {
            console.log('[CS2 Client] Received item info:', item);
        });

        // Add event handlers for server connection
        this.csgoClient.on('connectionStatus', (status: any) => {
            console.log(`[CS2 Client] Server connection status: ${JSON.stringify(status)}`);
            this.emit('serverConnectionStatus', status);
        });

        this.steamClient.on('playingState', (blocked: boolean, playingApp: any) => {
            console.log(`[Steam Client] Playing state changed: blocked=${blocked}, playingApp=${playingApp}`);
        });
    }

    public async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const username = process.env.STEAM_USERNAME;
            const password = process.env.STEAM_PASSWORD;

            if (!username || !password) {
                reject(new Error('Steam credentials not found in environment variables'));
                return;
            }

            this.steamClient.logOn({
                accountName: username,
                password: password
            });


            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 30000);

            this.once('ready', () => {
                clearTimeout(timeout);
                resolve();
            });

            this.once('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    public async disconnect(): Promise<void> {
        // Clear any pending requests
        this.queue = [];
        this.isReady = false;
        this.steamClient.logOff();
    }

    public async inspectItem(inspectData: InspectURLInfo): Promise<any> {
        if (this.queue.length >= this.MAX_QUEUE_SIZE) {
            throw new Error('Inspection queue is full');
        }

        return new Promise((resolve, reject) => {
            // Add to queue
            this.queue.push({
                inspectData,
                resolve,
                reject,
                timestamp: Date.now()
            });

            // Start processing if not already running
            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            // Clean up expired items
            this.cleanExpiredItems();

            const item = this.queue[0];

            try {
                if (!this.isReady) {
                    throw new Error('CS2 client is not ready');
                }

                const itemData = await this.fetchItemInfo(item.inspectData);
                item.resolve(itemData);
            } catch (error) {
                item.reject(error);
            }

            // Remove processed item
            this.queue.shift();

            // Rate limiting delay
            if (this.queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
            }
        }

        this.processing = false;
    }

    private cleanExpiredItems(): void {
        const now = Date.now();
        const expiredItems = this.queue.filter(item => now - item.timestamp > this.QUEUE_TIMEOUT);

        expiredItems.forEach(item => {
            item.reject(new Error('Request timeout'));
            const index = this.queue.indexOf(item);
            if (index > -1) {
                this.queue.splice(index, 1);
            }
        });
    }

    private fetchItemInfo(inspectData: InspectURLInfo): Promise<any> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.csgoClient.removeListener('inspectItemInfo', handleInspectItemInfo);
                reject(new Error('Steam API request timed out after 10 seconds'));
            }, this.REQUEST_TIMEOUT);

            const handleInspectItemInfo = (item: any) => {
                clearTimeout(timeoutId);
                if (item) {
                    console.debug('Received item info:', item);
                    resolve(item);
                } else {
                    reject(new Error('Failed to inspect item'));
                }
            };

            try {
                this.csgoClient.once('inspectItemInfo', handleInspectItemInfo);
                this.csgoClient.inspectItem(inspectData.original_url);
            } catch (error) {
                clearTimeout(timeoutId);
                this.csgoClient.removeListener('inspectItemInfo', handleInspectItemInfo);
                reject(error);
            }
        });
    }

    public getIsReady(): boolean {
        return this.isReady;
    }

    public getQueueLength(): number {
        return this.queue.length;
    }

    /**
     * Connect to a specific CS2 server
     * @param serverAddress Server address in format "ip:port" or "ip" (default port 27015)
     * @returns Promise that resolves when connected or rejects on error
     */
    public connectToServer(serverAddress: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                reject(new Error('CS2 client is not ready'));
                return;
            }

            console.log(`[CS2 Client] Attempting to connect to server: ${serverAddress}`);

            try {
                // Parse server address
                let ip = serverAddress;
                let port = 27015; // Default CS2 port

                if (serverAddress.includes(':')) {
                    const parts = serverAddress.split(':');
                    ip = parts[0];
                    port = parseInt(parts[1], 10);
                }

                // Connect to the server
                this.csgoClient.requestGame(ip, port);

                console.log(`[CS2 Client] Connection request sent to ${ip}:${port}`);
                resolve();
            } catch (error) {
                console.error('[CS2 Client] Error connecting to server:', error);
                reject(error);
            }
        });
    }
}

export default SteamClient;