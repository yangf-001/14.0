const IndexedDBManager = {
    _db: null,
    _dbName: 'AIStoryDB',
    _version: 1,
    _stores: ['stories', 'archives', 'attachments'],

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this._dbName, this._version);

            request.onerror = () => {
                console.error('IndexedDB打开失败:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this._db = request.result;
                resolve(this._db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('stories')) {
                    const storyStore = db.createObjectStore('stories', { keyPath: 'id' });
                    storyStore.createIndex('worldId', 'worldId', { unique: false });
                    storyStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('archives')) {
                    const archiveStore = db.createObjectStore('archives', { keyPath: 'id' });
                    archiveStore.createIndex('worldId', 'worldId', { unique: false });
                    archiveStore.createIndex('endedAt', 'endedAt', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('attachments')) {
                    const attachmentStore = db.createObjectStore('attachments', { keyPath: 'id' });
                    attachmentStore.createIndex('storyId', 'storyId', { unique: false });
                }
            };
        });
    },

    async saveStory(story) {
        if (!this._db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(['stories'], 'readwrite');
            const store = transaction.objectStore('stories');
            
            const storyData = {
                ...story,
                updatedAt: Date.now()
            };
            
            const request = store.put(storyData);
            request.onsuccess = () => resolve(storyData);
            request.onerror = () => reject(request.error);
        });
    },

    async getStory(storyId) {
        if (!this._db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(['stories'], 'readonly');
            const store = transaction.objectStore('stories');
            const request = store.get(storyId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getStoriesByWorld(worldId) {
        if (!this._db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(['stories'], 'readonly');
            const store = transaction.objectStore('stories');
            const index = store.index('worldId');
            const request = index.getAll(IDBKeyRange.only(worldId));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getCurrentStory(worldId) {
        if (!this._db) await this.init();
        
        const stories = await this.getStoriesByWorld(worldId);
        const ongoing = stories.find(s => s.status === 'ongoing');
        return ongoing || null;
    },

    async deleteStory(storyId) {
        if (!this._db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(['stories'], 'readwrite');
            const store = transaction.objectStore('stories');
            const request = store.delete(storyId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async saveArchive(archive) {
        if (!this._db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(['archives'], 'readwrite');
            const store = transaction.objectStore('archives');
            
            const archiveData = {
                ...archive,
                endedAt: Date.now()
            };
            
            const request = store.put(archiveData);
            request.onsuccess = () => resolve(archiveData);
            request.onerror = () => reject(request.error);
        });
    },

    async getArchivesByWorld(worldId) {
        if (!this._db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(['archives'], 'readonly');
            const store = transaction.objectStore('archives');
            const index = store.index('worldId');
            const request = index.getAll(IDBKeyRange.only(worldId));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async deleteArchive(archiveId) {
        if (!this._db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(['archives'], 'readwrite');
            const store = transaction.objectStore('archives');
            const request = store.delete(archiveId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async saveAttachment(attachment) {
        if (!this._db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(['attachments'], 'readwrite');
            const store = transaction.objectStore('attachments');
            const request = store.put(attachment);
            request.onsuccess = () => resolve(attachment);
            request.onerror = () => reject(request.error);
        });
    },

    async getAttachmentsByStory(storyId) {
        if (!this._db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this._db.transaction(['attachments'], 'readonly');
            const store = transaction.objectStore('attachments');
            const index = store.index('storyId');
            const request = index.getAll(IDBKeyRange.only(storyId));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getStorageUsage() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage || 0,
                quota: estimate.quota || 0,
                percentUsed: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(2) : 0
            };
        }
        return null;
    },

    async clearAll() {
        if (!this._db) await this.init();
        
        const clearStore = (storeName) => {
            return new Promise((resolve, reject) => {
                const transaction = this._db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        };
        
        await Promise.all(this._stores.map(s => clearStore(s)));
    },

    async exportToJSON() {
        if (!this._db) await this.init();
        
        const exportStore = (storeName) => {
            return new Promise((resolve, reject) => {
                const transaction = this._db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        };
        
        const [stories, archives, attachments] = await Promise.all(
            this._stores.map(s => exportStore(s))
        );
        
        return {
            version: this._version,
            timestamp: Date.now(),
            stories,
            archives,
            attachments
        };
    },

    async importFromJSON(data) {
        if (!this._db) await this.init();
        
        const importStore = (storeName, items) => {
            return new Promise((resolve, reject) => {
                const transaction = this._db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                items.forEach(item => store.put(item));
                
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
        };
        
        if (data.stories) await importStore('stories', data.stories);
        if (data.archives) await importStore('archives', data.archives);
        if (data.attachments) await importStore('attachments', data.attachments);
    }
};

window.IndexedDBManager = IndexedDBManager;
