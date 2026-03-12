PluginSystem.register('inventory', {
    description: '物品背包系统',
    features: ['物品管理', '物品使用', '背包系统', '物品库'],
    
    init() {
        console.log('Inventory plugin loaded');
        this._initDefaultLibrary();
    },
    
    async _initDefaultLibrary(force = false) {
        const library = this.getItemLibrary();
        if (library.length > 0 && !force) return Promise.resolve();
        
        const possiblePaths = [
            './js/plugins/inventory/user-content/items.txt',
            './user-content/items.txt'
        ];
        
        for (const path of possiblePaths) {
            try {
                const response = await fetch(path);
                if (response && response.ok) {
                    const text = await response.text();
                    const items = this._parseItemsText(text);
                    if (items.length > 0) {
                        if (force) {
                            items.forEach(item => this.addToLibrary(item));
                        } else {
                            const existingNames = library.map(i => i.name);
                            items.forEach(item => {
                                if (!existingNames.includes(item.name)) {
                                    this.addToLibrary(item);
                                }
                            });
                        }
                        console.log('Inventory items loaded from:', path);
                        return Promise.resolve();
                    }
                }
            } catch (e) {
                console.warn('Failed to load items from', path, e);
            }
        }
        
        this._addHardcodedDefaults();
        return Promise.resolve();
    },
    
    _parseItemsText(text) {
        const items = [];
        let currentCategory = 'misc';
        const lines = text.split('\n');
        
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) continue;
            
            if (line.startsWith('[') && line.endsWith(']')) {
                continue;
            } else if (line.includes('|')) {
                const parts = line.split('|');
                if (parts.length >= 2) {
                    let effects = {};
                    try {
                        effects = JSON.parse(parts[3] || '{}');
                    } catch {}
                    
                    items.push({
                        name: parts[0].trim(),
                        type: parts[1].trim() || 'misc',
                        description: parts[2]?.trim() || '',
                        effects: effects,
                        icon: this._getIconForType(parts[1].trim())
                    });
                }
            }
        }
        return items;
    },
    
    _getIconForType(type) {
        const iconMap = {
            'potion': '🧪',
            'food': '🍎',
            'weapon': '⚔️',
            'tool': '🔧',
            'misc': '📦',
            'adult': '🔞'
        };
        return iconMap[type] || '📦';
    },
    
    _addHardcodedDefaults() {
        const defaultItems = [
            { name: '魔法药水', type: 'potion', description: '恢复体力的神奇药水', icon: '🧪', effects: { energy: 30 } },
            { name: '治疗药水', type: 'potion', description: '恢复生命值的疗伤药', icon: '🧪', effects: { health: 30 } },
            { name: '魅力药水', type: 'potion', description: '提升个人魅力的魔药', icon: '🧪', effects: { charm: 20 } },
            { name: '苹果', type: 'food', description: '新鲜的红苹果', icon: '🍎', effects: { health: 10, energy: 5 } },
            { name: '面包', type: 'food', description: '香软的白面包', icon: '🍞', effects: { energy: 15 } },
            { name: '葡萄酒', type: 'food', description: '醇香的葡萄酒', icon: '🍷', effects: { charm: 10, energy: 10 } },
            { name: '宝石', type: 'misc', description: '一颗闪亮的宝石', icon: '💎', effects: { charm: 25 } },
            { name: '长剑', type: 'weapon', description: '锋利的铁制长剑', icon: '⚔️', effects: { strength: 15 } },
            { name: '魔法卷轴', type: 'tool', description: '记载魔法的卷轴', icon: '📜', effects: { intelligence: 20 } },
            { name: '神秘钥匙', type: 'tool', description: '可以打开某些锁', icon: '🔑', effects: {} }
        ];
        
        defaultItems.forEach(item => this.addToLibrary(item));
    },
    
    getItemLibrary() {
        try {
            return JSON.parse(localStorage.getItem('item_library') || '[]');
        } catch { return []; }
    },
    
    saveItemLibrary(library) {
        localStorage.setItem('item_library', JSON.stringify(library));
    },
    
    addToLibrary(item) {
        const library = this.getItemLibrary();
        const newItem = {
            id: 'lib_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: item.name,
            type: item.type || 'misc',
            description: item.description || '',
            effects: item.effects || {},
            icon: item.icon || '📦'
        };
        library.push(newItem);
        this.saveItemLibrary(library);
        return newItem;
    },
    
    updateLibraryItem(itemId, updates) {
        const library = this.getItemLibrary();
        const idx = library.findIndex(i => i.id === itemId);
        if (idx !== -1) {
            library[idx] = { ...library[idx], ...updates };
            this.saveItemLibrary(library);
            return library[idx];
        }
        return null;
    },
    
    removeFromLibrary(itemId) {
        const library = this.getItemLibrary();
        const newLibrary = library.filter(i => i.id !== itemId);
        this.saveItemLibrary(newLibrary);
    },
    
    addItem(worldId, characterId, item) {
        const key = `inventory_${worldId}_${characterId}`;
        let inventory = JSON.parse(localStorage.getItem(key) || '[]');
        
        const newItem = {
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: item.name,
            type: item.type || 'misc',
            description: item.description || '',
            effects: item.effects || {},
            quantity: item.quantity || 1,
            icon: item.icon || '📦',
            created: new Date().toISOString()
        };
        
        inventory.push(newItem);
        localStorage.setItem(key, JSON.stringify(inventory));
        
        return newItem;
    },
    
    getItems(worldId, characterId) {
        const key = `inventory_${worldId}_${characterId}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    },
    
    removeItem(worldId, characterId, itemId) {
        const key = `inventory_${worldId}_${characterId}`;
        let inventory = JSON.parse(localStorage.getItem(key) || '[]');
        inventory = inventory.filter(i => i.id !== itemId);
        localStorage.setItem(key, JSON.stringify(inventory));
    },
    
    useItem(worldId, characterId, itemId, options = {}) {
        const items = this.getItems(worldId, characterId);
        const item = items.find(i => i.id === itemId);
        
        if (!item) return false;
        
        const targetCharId = options.targetCharId || characterId;
        const userCharId = options.userCharId || null;
        const generateStory = options.generateStory !== false;
        
        if (generateStory && Story.isOngoing()) {
            Story.useItemInStory(item, targetCharId, userCharId).then(() => {
                this._applyItemEffectsOnly(worldId, targetCharId, item);
            }).catch(err => {
                console.error('生成物品使用剧情失败:', err);
                this._applyItemEffectsOnly(worldId, targetCharId, item);
            });
            return { generating: true, item };
        }
        
        return this._applyItemEffectsOnly(worldId, targetCharId, item);
    },
    
    useItemByName(worldId, characterId, itemName, options = {}) {
        const items = this.getItems(worldId, characterId);
        const item = items.find(i => i.name === itemName);
        
        if (!item) return false;
        
        const targetCharId = options.targetCharId || characterId;
        const userCharId = options.userCharId || null;
        const generateStory = options.generateStory !== false;
        
        if (generateStory && Story.isOngoing()) {
            Story.useItemInStory(item, targetCharId, userCharId).then(() => {
                this._applyItemEffectsOnly(worldId, targetCharId, item);
            }).catch(err => {
                console.error('生成物品使用剧情失败:', err);
                this._applyItemEffectsOnly(worldId, targetCharId, item);
            });
            return { generating: true, item };
        }
        
        return this._applyItemEffectsOnly(worldId, targetCharId, item);
    },
    
    _applyItemEffectsOnly(worldId, characterId, item) {
        const char = Data.getCharacter(worldId, characterId);
        if (!char) return false;
        
        char.stats = char.stats || {};
        
        if (item.effects) {
            if (item.effects.health) char.stats.health = Math.min(200, Math.max(0, (char.stats.health || 0) + item.effects.health));
            if (item.effects.energy) char.stats.energy = Math.min(200, Math.max(0, (char.stats.energy || 0) + item.effects.energy));
            if (item.effects.charm) char.stats.charm = Math.min(200, Math.max(0, (char.stats.charm || 0) + item.effects.charm));
            if (item.effects.intelligence) char.stats.intelligence = Math.min(200, Math.max(0, (char.stats.intelligence || 0) + item.effects.intelligence));
            if (item.effects.strength) char.stats.strength = Math.min(200, Math.max(0, (char.stats.strength || 0) + item.effects.strength));
            if (item.effects.agility) char.stats.agility = Math.min(200, Math.max(0, (char.stats.agility || 0) + item.effects.agility));
            if (item.effects.intimacy || item.effects.affection) char.stats.intimacy = Math.min(200, Math.max(0, (char.stats.intimacy || 0) + (item.effects.intimacy || item.effects.affection || 0)));
            if (item.effects.arousal || item.effects.sexArousal) char.stats.arousal = Math.min(200, Math.max(0, (char.stats.arousal || 0) + (item.effects.arousal || item.effects.sexArousal || 0)));
            if (item.effects.willingness) char.stats.willingness = Math.min(200, Math.max(0, (char.stats.willingness || 0) + item.effects.willingness));
            if (item.effects.experience) char.stats.experience = Math.min(200, Math.max(0, (char.stats.experience || 0) + item.effects.experience));
            if (item.effects.sexSensitivity) char.stats.sexSensitivity = Math.min(200, Math.max(0, (char.stats.sexSensitivity || 0) + item.effects.sexSensitivity));
            
            Data.updateCharacter(worldId, characterId, { stats: char.stats });
        }
        
        this.removeItem(worldId, characterId, item.id);
        
        return true;
    },
    
    _applyItemEffects(worldId, characterId, item) {
        return this._applyItemEffectsOnly(worldId, characterId, item);
    }
});
