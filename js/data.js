const Data = {
    _worlds: null,
    _currentWorld: null,
    _autoSaveTimer: null,
    _lastSaveTime: null,
    _autoSaveInterval: 30000,
    _onSaveCallback: null,

    init() {
        this._worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
        const currentId = localStorage.getItem('currentWorldId');
        if (currentId) {
            this._currentWorld = this._worlds.find(w => w.id === currentId) || null;
        }
        const savedInterval = localStorage.getItem('autoSaveInterval');
        if (savedInterval) {
            this._autoSaveInterval = parseInt(savedInterval, 10);
        }
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
        if (this._currentWorld) {
            try {
                const worldData = localStorage.getItem('world_' + this._currentWorld.id);
                if (worldData) {
                    this._lastSaveTime = Date.now();
                    console.log(`[自动保存] ${new Date().toLocaleTimeString()} - ${this._currentWorld.name}`);
                    if (this._onSaveCallback) {
                        this._onSaveCallback(this._lastSaveTime);
                    }
                }
            } catch (e) {
                console.warn('自动保存失败:', e);
            }
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

    saveStory(worldId, story) {
        const data = this._loadWorldData(worldId);
        data.story = story;
        this._saveWorldData(worldId, data);
    },

    getStory(worldId) {
        const data = this._loadWorldData(worldId);
        return data.story;
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
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    _loadWorldData(worldId) {
        try {
            return JSON.parse(localStorage.getItem('world_' + worldId) || '{}');
        } catch { return {}; }
    },

    _saveWorldData(worldId, data) {
        localStorage.setItem('world_' + worldId, JSON.stringify(data));
    },

    _save() {
        localStorage.setItem('worlds', JSON.stringify(this._worlds));
    }
};

Data.init();
window.Data = Data;
