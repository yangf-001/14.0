const Data = {
    _worlds: null,
    _currentWorld: null,
    _autoSaveTimer: null,
    _lastSaveTime: null,
    _autoSaveInterval: 30000,
    _onSaveCallback: null,
    _cache: new Map(),
    _pendingSaves: new Map(),
    _saveDebounceTimer: null,

    CONSTANTS: {
        MIN_AGE: 18,
        DEFAULT_AUTO_SAVE_INTERVAL: 30000,
        DEBOUNCE_DELAY: 500,
        CACHE_EXPIRY: 5000
    },

    init() {
        this._worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
        const currentId = localStorage.getItem('currentWorldId');
        if (currentId) {
            this._currentWorld = this._worlds.find(w => w.id === currentId) || null;
        }
        const savedInterval = localStorage.getItem('autoSaveInterval');
        this._autoSaveInterval = savedInterval ? parseInt(savedInterval, 10) : this.CONSTANTS.DEFAULT_AUTO_SAVE_INTERVAL;
        this._startAutoSave();
    },

    _startAutoSave() {
        if (this._autoSaveTimer) {
            clearInterval(this._autoSaveTimer);
        }
        this._autoSaveTimer = setInterval(() => {
            this._doAutoSave();
        }, this._autoSaveInterval);
    },

    _doAutoSave() {
        if (!this._currentWorld) return;
        
        try {
            const worldData = localStorage.getItem('world_' + this._currentWorld.id);
            if (worldData) {
                const data = JSON.parse(worldData);
                localStorage.setItem('world_' + this._currentWorld.id, JSON.stringify(data));
                this._lastSaveTime = Date.now();
                console.log(`[自动保存] ${new Date().toLocaleTimeString()} - ${this._currentWorld.name}`);
                if (this._onSaveCallback) {
                    this._onSaveCallback(this._lastSaveTime);
                }
            } else {
                this._saveWorldData(this._currentWorld.id, { world: this._currentWorld });
                console.log(`[自动保存] ${new Date().toLocaleTimeString()} - ${this._currentWorld.name} (新世界)`);
            }
        } catch (e) {
            console.warn('自动保存失败:', e);
        }
    },

    setAutoSaveInterval(ms) {
        this._autoSaveInterval = ms;
        localStorage.setItem('autoSaveInterval', ms.toString());
        this._startAutoSave();
    },

    getAutoSaveInterval() {
        return this._autoSaveInterval;
    },

    onSave(callback) {
        this._onSaveCallback = callback;
    },

    stopAutoSave() {
        if (this._autoSaveTimer) {
            clearInterval(this._autoSaveTimer);
            this._autoSaveTimer = null;
        }
    },

    getLastSaveTime() {
        return this._lastSaveTime;
    },

    getWorlds() { return this._worlds; },
    getCurrentWorld() { return this._currentWorld; },
    setCurrentWorld(id) {
        this._currentWorld = this._worlds.find(w => w.id === id);
        if (this._currentWorld) localStorage.setItem('currentWorldId', id);
    },

    createWorld(config) {
        const world = {
            id: this._genId(),
            name: config.name || '新世界',
            type: config.type || '现代',
            created: Date.now(),
            settings: config.settings || this._defaultSettings(),
            characters: [],
            story: null
        };
        this._worlds.push(world);
        this._save();
        return world;
    },

    updateWorld(id, updates) {
        const world = this._worlds.find(w => w.id === id);
        if (world) {
            Object.assign(world, updates);
            this._save();
        }
    },

    deleteWorld(id) {
        this._worlds = this._worlds.filter(w => w.id !== id);
        if (this._currentWorld?.id === id) this._currentWorld = null;
        this._save();
        localStorage.removeItem('world_' + id);
    },

    getCharacters(worldId) {
        const data = this._loadWorldData(worldId);
        return data.characters || [];
    },

    getCharacter(worldId, charId) {
        const chars = this.getCharacters(worldId);
        return chars.find(c => c.id === charId);
    },

    createCharacter(worldId, config) {
        const data = this._loadWorldData(worldId);
        const char = {
            id: this._genId(),
            name: config.name || '新角色',
            role: config.role || '配角',
            gender: config.gender || '女',
            age: config.age || 18,
            profile: config.profile || {},
            adultProfile: config.adultProfile || {},
            stats: config.stats || {},
            relationship: config.relationship || ''
        };
        data.characters = data.characters || [];
        data.characters.push(char);
        this._saveWorldData(worldId, data);
        
        return char;
    },

    updateCharacter(worldId, charId, updates) {
        const data = this._loadWorldData(worldId);
        const char = data.characters?.find(c => c.id === charId);
        if (char) {
            Object.assign(char, updates);
            this._saveWorldData(worldId, data);
        }
    },

    deleteCharacter(worldId, charId) {
        const data = this._loadWorldData(worldId);
        data.characters = data.characters?.filter(c => c.id !== charId) || [];
        this._saveWorldData(worldId, data);
    },

    getGroups(worldId) {
        const data = this._loadWorldData(worldId);
        return data.groups || [];
    },

    getGroup(worldId, groupId) {
        const groups = this.getGroups(worldId);
        return groups.find(g => g.id === groupId);
    },

    createGroup(worldId, config) {
        const data = this._loadWorldData(worldId);
        data.groups = data.groups || [];
        const group = {
            id: this._genId(),
            name: config.name || '新组合',
            description: config.description || '',
            characterIds: config.characterIds || [],
            created: Date.now()
        };
        data.groups.push(group);
        this._saveWorldData(worldId, data);
        return group;
    },

    updateGroup(worldId, groupId, updates) {
        const data = this._loadWorldData(worldId);
        const group = data.groups?.find(g => g.id === groupId);
        if (group) {
            Object.assign(group, updates);
            this._saveWorldData(worldId, data);
        }
    },

    deleteGroup(worldId, groupId) {
        const data = this._loadWorldData(worldId);
        data.groups = data.groups?.filter(g => g.id !== groupId) || [];
        this._saveWorldData(worldId, data);
    },

    addCharacterToGroup(worldId, groupId, charId) {
        const data = this._loadWorldData(worldId);
        const group = data.groups?.find(g => g.id === groupId);
        if (group && !group.characterIds.includes(charId)) {
            group.characterIds.push(charId);
            this._saveWorldData(worldId, data);
        }
    },

    removeCharacterFromGroup(worldId, groupId, charId) {
        const data = this._loadWorldData(worldId);
        const group = data.groups?.find(g => g.id === groupId);
        if (group) {
            group.characterIds = group.characterIds.filter(id => id !== charId);
            this._saveWorldData(worldId, data);
        }
    },

    saveStory(worldId, story) {
        const data = this._loadWorldData(worldId);
        data.story = story;
        if (this._saveDebounceTimer) {
            clearTimeout(this._saveDebounceTimer);
            this._saveDebounceTimer = null;
        }
        this._saveWorldDataImmediate(worldId, data);
    },

    getStory(worldId) {
        this._cache.delete(worldId);
        const data = this._loadWorldData(worldId);
        return data.story;
    },

    deleteStory(worldId) {
        const data = this._loadWorldData(worldId);
        delete data.story;
        this._saveWorldData(worldId, data);
    },

    getSettings(worldId) {
        const world = this._worlds.find(w => w.id === worldId);
        return world?.settings || this._defaultSettings();
    },

    updateSettings(worldId, settings) {
        const world = this._worlds.find(w => w.id === worldId);
        if (world) {
            world.settings = { ...world.settings, ...settings };
            this._save();
        }
    },

    _defaultSettings() {
        return {
            api: { provider: 'DeepSeek' },
            content: {
                tone: '浪漫',
                detailLevel: '中',
                intimacy: 50,
                forbidden: []
            },
            output: {
                style: '叙事',
                length: '中篇'
            }
        };
    },

    _genId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 10);
        const uniquePart = (Math.random() * 10000).toString(36).substring(0, 4);
        return timestamp + randomPart + uniquePart;
    },

    _loadWorldData(worldId) {
        const cached = this._cache.get(worldId);
        if (cached && Date.now() - cached.timestamp < this.CONSTANTS.CACHE_EXPIRY) {
            return cached.data;
        }
        
        try {
            const data = JSON.parse(localStorage.getItem('world_' + worldId) || '{}');
            this._cache.set(worldId, { data, timestamp: Date.now() });
            return data;
        } catch { return {}; }
    },

    _saveWorldData(worldId, data) {
        if (this._saveDebounceTimer) {
            clearTimeout(this._saveDebounceTimer);
        }
        
        this._saveDebounceTimer = setTimeout(() => {
            localStorage.setItem('world_' + worldId, JSON.stringify(data));
            this._cache.set(worldId, { data, timestamp: Date.now() });
        }, this.CONSTANTS.DEBOUNCE_DELAY);
    },

    _saveWorldDataImmediate(worldId, data) {
        if (this._saveDebounceTimer) {
            clearTimeout(this._saveDebounceTimer);
            this._saveDebounceTimer = null;
        }
        localStorage.setItem('world_' + worldId, JSON.stringify(data));
        this._cache.set(worldId, { data, timestamp: Date.now() });
    },

    invalidateCache(worldId) {
        this._cache.delete(worldId);
    },

    clearCache() {
        this._cache.clear();
    },

    _save() {
        localStorage.setItem('worlds', JSON.stringify(this._worlds));
    }
};

Data.init();
window.Data = Data;
