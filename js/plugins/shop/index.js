PluginSystem.register('shop', {
    description: '商店系统',
    features: ['商品购买', '金钱管理', '商店购买', 'NPC自动购买'],
    
    init() {
        console.log('Shop plugin loaded');
        this._initDefaultGoods();
        this._initDefaultMoney();
    },
    
    async _initDefaultGoods(force = false) {
        const goods = this.getGoodsLibrary();
        if (goods.length > 0 && !force) return Promise.resolve();
        
        const possiblePaths = [
            './js/plugins/shop/user-content/goods.txt',
            './user-content/goods.txt'
        ];
        
        for (const path of possiblePaths) {
            try {
                const response = await fetch(path);
                if (response && response.ok) {
                    const text = await response.text();
                    const items = this._parseGoodsText(text);
                    if (items.length > 0) {
                        if (force) {
                            goods.length = 0;
                            items.forEach(item => this.addToGoodsLibrary(item));
                        } else {
                            const existingNames = goods.map(i => i.name);
                            items.forEach(item => {
                                if (!existingNames.includes(item.name)) {
                                    this.addToGoodsLibrary(item);
                                }
                            });
                        }
                        return Promise.resolve();
                    }
                }
            } catch (e) {
                console.warn('Failed to load goods from', path, e);
            }
        }
        
        this._addHardcodedGoods();
        return Promise.resolve();
    },
    
    _parseGoodsText(text) {
        const items = [];
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
                        const effectsStr = parts[3];
                        if (effectsStr && effectsStr.trim()) {
                            effects = JSON.parse(effectsStr);
                        }
                    } catch (e) {
                        console.warn('解析物品效果失败:', e);
                    }
                    
                    let price = 0;
                    try {
                        const priceStr = parts[4];
                        if (priceStr && priceStr.trim()) {
                            price = parseInt(priceStr.trim()) || 0;
                        }
                    } catch (e) {
                        console.warn('解析价格失败:', e);
                    }
                    
                    items.push({
                        name: parts[0].trim(),
                        type: parts[1].trim() || 'misc',
                        description: parts[2]?.trim() || '',
                        effects: effects,
                        price: price,
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
    
    _addHardcodedGoods() {
        const defaultGoods = [
            { name: '治疗药水', type: 'potion', description: '恢复生命值的疗伤药', icon: '🧪', effects: { health: 30 }, price: 50 },
            { name: '魔法药水', type: 'potion', description: '恢复体力的神奇药水', icon: '🧪', effects: { energy: 30 }, price: 50 },
            { name: '魅力药水', type: 'potion', description: '提升个人魅力的魔药', icon: '🧪', effects: { charm: 20 }, price: 80 },
            { name: '苹果', type: 'food', description: '新鲜的红苹果', icon: '🍎', effects: { health: 10, energy: 5 }, price: 15 },
            { name: '面包', type: 'food', description: '香软的白面包', icon: '🍞', effects: { energy: 15 }, price: 10 },
            { name: '葡萄酒', type: 'food', description: '醇香的葡萄酒', icon: '🍷', effects: { charm: 10, energy: 10 }, price: 40 },
            { name: '宝石', type: 'misc', description: '一颗闪亮的宝石', icon: '💎', effects: { charm: 25 }, price: 300 },
            { name: '长剑', type: 'weapon', description: '锋利的铁制长剑', icon: '⚔️', effects: { strength: 15 }, price: 200 },
            { name: '魔法卷轴', type: 'tool', description: '记载魔法的卷轴', icon: '📜', effects: { intelligence: 20 }, price: 150 },
            { name: '神秘钥匙', type: 'tool', description: '可以打开某些锁', icon: '🔑', effects: {}, price: 50 }
        ];
        
        defaultGoods.forEach(item => this.addToGoodsLibrary(item));
    },
    
    _initDefaultMoney() {
        const worlds = Data.getWorlds() || [];
        worlds.forEach(world => {
            const chars = Data.getCharacters(world.id) || [];
            chars.forEach(char => {
                if (char.money === undefined) {
                    char.money = 0;
                    Data.updateCharacter(world.id, char.id, { money: 0 });
                }
            });
        });
    },
    
    getGoodsLibrary() {
        try {
            return JSON.parse(localStorage.getItem('goods_library') || '[]');
        } catch { return []; }
    },
    
    saveGoodsLibrary(library) {
        localStorage.setItem('goods_library', JSON.stringify(library));
    },
    
    addToGoodsLibrary(item) {
        const library = this.getGoodsLibrary();
        const newItem = {
            id: 'goods_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: item.name,
            type: item.type || 'misc',
            description: item.description || '',
            effects: item.effects || {},
            price: item.price || 0,
            icon: item.icon || '📦'
        };
        library.push(newItem);
        this.saveGoodsLibrary(library);
        return newItem;
    },
    
    updateGoodsItem(itemId, updates) {
        const library = this.getGoodsLibrary();
        const idx = library.findIndex(i => i.id === itemId);
        if (idx !== -1) {
            library[idx] = { ...library[idx], ...updates };
            this.saveGoodsLibrary(library);
            return library[idx];
        }
        return null;
    },
    
    getCharacterMoney(worldId, characterId) {
        const char = Data.getCharacter(worldId, characterId);
        return char?.money || 0;
    },
    
    setCharacterMoney(worldId, characterId, amount) {
        const char = Data.getCharacter(worldId, characterId);
        if (char) {
            char.money = Math.max(0, amount);
            Data.updateCharacter(worldId, characterId, { money: char.money });
            return char.money;
        }
        return 0;
    },
    
    addCharacterMoney(worldId, characterId, amount) {
        const currentMoney = this.getCharacterMoney(worldId, characterId);
        return this.setCharacterMoney(worldId, characterId, currentMoney + amount);
    },
    
    spendCharacterMoney(worldId, characterId, amount) {
        const currentMoney = this.getCharacterMoney(worldId, characterId);
        if (currentMoney >= amount) {
            return this.setCharacterMoney(worldId, characterId, currentMoney - amount);
        }
        return -1;
    },
    
    buyItem(worldId, characterId, goodsId) {
        const library = this.getGoodsLibrary();
        const goods = library.find(g => g.id === goodsId);
        
        if (!goods) {
            return { success: false, message: '商品不存在' };
        }
        
        const currentMoney = this.getCharacterMoney(worldId, characterId);
        if (currentMoney < goods.price) {
            return { success: false, message: '金钱不足' };
        }
        
        const spendResult = this.spendCharacterMoney(worldId, characterId, goods.price);
        if (spendResult === -1) {
            return { success: false, message: '扣款失败' };
        }
        
        const itemData = {
            name: goods.name,
            type: goods.type,
            description: goods.description,
            effects: goods.effects,
            icon: goods.icon,
            quantity: 1
        };
        
        const inventoryPlugin = PluginSystem.get('inventory');
        if (inventoryPlugin) {
            inventoryPlugin.addItem(worldId, characterId, itemData);
        }
        
        return { 
            success: true, 
            message: `购买了 ${goods.name}，花费 ${goods.price} 金币`,
            remainingMoney: this.getCharacterMoney(worldId, characterId)
        };
    },
    
    buyItemByName(worldId, characterId, goodsName) {
        const library = this.getGoodsLibrary();
        const goods = library.find(g => g.name === goodsName);
        
        if (!goods) {
            return { success: false, message: '商品不存在' };
        }
        
        return this.buyItem(worldId, characterId, goods.id);
    },
    
    npcAutoBuy(worldId, npcId, budget) {
        const npcMoney = this.getCharacterMoney(worldId, npcId);
        if (npcMoney <= 0 || budget <= 0) {
            return { success: false, message: 'NPC没有足够的资金购买物品', purchasedItems: [] };
        }
        
        const library = this.getGoodsLibrary();
        const availableGoods = library.filter(g => g.price <= npcMoney && g.price <= budget);
        
        if (availableGoods.length === 0) {
            return { success: false, message: '没有符合条件的商品', purchasedItems: [] };
        }
        
        const purchasedItems = [];
        let remainingBudget = Math.min(npcMoney, budget);
        let spendMoney = 0;
        
        const shuffled = [...availableGoods].sort(() => Math.random() - 0.5);
        
        for (const goods of shuffled) {
            if (remainingBudget >= goods.price) {
                const itemData = {
                    name: goods.name,
                    type: goods.type,
                    description: goods.description,
                    effects: goods.effects,
                    icon: goods.icon,
                    quantity: 1
                };
                
                const inventoryPlugin = PluginSystem.get('inventory');
                if (inventoryPlugin) {
                    inventoryPlugin.addItem(worldId, npcId, itemData);
                }
                
                remainingBudget -= goods.price;
                spendMoney += goods.price;
                purchasedItems.push(goods);
                
                if (remainingBudget < 10) break;
            }
        }
        
        this.spendCharacterMoney(worldId, npcId, spendMoney);
        
        return {
            success: true,
            message: `NPC购买了 ${purchasedItems.length} 件物品，花费 ${spendMoney} 金币`,
            purchasedItems: purchasedItems,
            remainingMoney: this.getCharacterMoney(worldId, npcId),
            remainingBudget: remainingBudget
        };
    },
    
    giveMoneyToCharacter(worldId, fromCharId, toCharId, amount) {
        const fromMoney = this.getCharacterMoney(worldId, fromCharId);
        
        if (fromMoney < amount) {
            return { success: false, message: '金钱不足' };
        }
        
        this.spendCharacterMoney(worldId, fromCharId, amount);
        this.addCharacterMoney(worldId, toCharId, amount);
        
        return {
            success: true,
            message: `转移了 ${amount} 金币`
        };
    },
    
    getShopItems(type = null) {
        const library = this.getGoodsLibrary();
        if (type) {
            return library.filter(g => g.type === type);
        }
        return library;
    },
    
    getShopCategories() {
        const library = this.getGoodsLibrary();
        const categories = {};
        library.forEach(g => {
            if (!categories[g.type]) {
                categories[g.type] = [];
            }
            categories[g.type].push(g);
        });
        return categories;
    },
    
    reloadGoods() {
        this._initDefaultGoods(true);
    }
});
