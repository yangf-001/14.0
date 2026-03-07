// 全局ViewCallbacks对象
window.ViewCallbacks = window.ViewCallbacks || {};

const ViewLoader = {
    _cssLoaded: new Set(),
    
    loadCSS(path) {
        if (this._cssLoaded.has(path)) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;
        link.onerror = () => {
            console.warn('CSS not found:', path);
        };
        document.head.appendChild(link);
        this._cssLoaded.add(path);
    },
    
    loadPluginCSS(pluginName) {
        // 构建正确的CSS路径
        // 首先获取当前脚本的路径
        const scripts = document.getElementsByTagName('script');
        let scriptPath = '';
        for (let script of scripts) {
            if (script.src.includes('view.js')) {
                scriptPath = script.src;
                break;
            }
        }
        
        // 提取脚本所在的目录路径
        let basePath = scriptPath.substring(0, scriptPath.lastIndexOf('/') + 1);
        
        // 构建插件CSS的路径
        // 检查脚本路径是否已经在plugins目录内
        let cssPath;
        if (basePath.includes('/plugins/')) {
            // 如果脚本路径已经在plugins目录内，使用相对路径
            if (basePath.includes('/adult-library/')) {
                // 如果在adult-library目录内，使用相对路径到插件
                const adultLibraryIndex = basePath.indexOf('/adult-library/');
                const pluginsBase = basePath.substring(0, adultLibraryIndex + '/adult-library/'.length);
                cssPath = pluginsBase + `${pluginName}/style.css`;
            } else {
                // 其他插件，使用相对路径
                const pluginsIndex = basePath.indexOf('/plugins/');
                const pluginsBase = basePath.substring(0, pluginsIndex + '/plugins/'.length);
                cssPath = pluginsBase + `${pluginName}/style.css`;
            }
        } else {
            // 对于其他情况，使用普通路径
            if (pluginName.includes('intimate')) {
                // 对于intimate相关插件，使用adult-library路径
                cssPath = basePath + `plugins/adult-library/${pluginName}/style.css`;
            } else {
                // 对于其他插件，使用普通路径
                cssPath = basePath + `plugins/${pluginName}/style.css`;
            }
        }
        this.loadCSS(cssPath);
    },
    
    clear() {
        this._cssLoaded.clear();
    }
};

window.ViewLoader = ViewLoader;

const View = {
    _views: {},
    _callbacks: {},

    register(name, renderFn, callbacks = {}) {
        this._views[name] = renderFn;
        this._callbacks[name] = callbacks;
    },

    render(name, ...args) {
        const renderFn = this._views[name];
        if (!renderFn) {
            console.warn(`View ${name} not found`);
            return '';
        }
        
        return renderFn(...args);
    },

    getCallbacks(name) {
        return this._callbacks[name] || {};
    },

    hasView(name) {
        return !!this._views[name];
    },

    unregister(name) {
        delete this._views[name];
        delete this._callbacks[name];
    },

    clear() {
        this._views = {};
        this._callbacks = {};
    }
};

window.View = View;

function renderView(name, ...args) {
    return View.render(name, ...args);
}

function getViewCallbacks(name) {
    return View.getCallbacks(name);
}

window.renderView = renderView;
window.getViewCallbacks = getViewCallbacks;

View.register('character.main', function(worldId, characterId) {
    const char = Data.getCharacter(worldId, characterId);
    if (!char) return '<div class="empty">角色不存在</div>';

    return `
        <div class="char-tabs" data-world-id="${worldId}" data-character-id="${characterId}">
            <button class="tab-btn active" data-tab="basic">📋 基础</button>
            <button class="tab-btn" data-tab="personality">🎭 性格</button>
            <button class="tab-btn" data-tab="background">📖 背景</button>
            <button class="tab-btn" data-tab="stats">📊 属性</button>
            <button class="tab-btn" data-tab="adult">🔞 色色</button>
        </div>
        <div id="charTabContent"></div>
    `;
});

View.register('character.basic', function(worldId, characterId) {
    const char = Data.getCharacter(worldId, characterId);
    const p = char?.profile || {};
    
    return `
        <div class="card">
            <h4>📋 基础信息</h4>
            <div class="form-grid">
                <div class="form-group">
                    <label>名字</label>
                    <input type="text" value="${char?.name || ''}" onchange="ViewCallbacks.character.updateField('${characterId}', 'name', this.value)">
                </div>
                <div class="form-group">
                    <label>性别</label>
                    <div style="display:flex;gap:4px;">
                        <select onchange="ViewCallbacks.character.updateField('${characterId}', 'gender', this.value)">
                            <option value="女" ${(char?.gender || '女') === '女' ? 'selected' : ''}>女</option>
                            <option value="男" ${char?.gender === '男' ? 'selected' : ''}>男</option>
                            <option value="扶她" ${char?.gender === '扶她' ? 'selected' : ''}>扶她</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>年龄</label>
                    <input type="number" value="${char?.age || 18}" onchange="ViewCallbacks.character.updateField('${characterId}', 'age', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>角色定位</label>
                    <div style="display:flex;gap:4px;">
                        <input type="text" value="${char?.role || '配角'}" onchange="ViewCallbacks.character.updateField('${characterId}', 'role', this.value)" placeholder="主角/女主/配角等" list="editRoleOptions">
                        <datalist id="editRoleOptions">
                            <option value="主角">
                            <option value="女主">
                            <option value="配角">
                            <option value="反派">
                            <option value="导师">
                            <option value="对手">
                        </datalist>
                    </div>
                </div>
                <div class="form-group">
                    <label>种族</label>
                    <div style="display:flex;gap:4px;">
                        <input type="text" value="${p.race || ''}" onchange="ViewCallbacks.character.updateProfile('${characterId}', 'race', this.value)" placeholder="例如：人类" id="editCharRace">
                        <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharRace')" style="padding:4px 8px;">📋</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>职业</label>
                    <div style="display:flex;gap:4px;">
                        <input type="text" value="${p.occupation || ''}" onchange="ViewCallbacks.character.updateProfile('${characterId}', 'occupation', this.value)" placeholder="例如：学生" id="editCharOccupation">
                        <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharOccupation')" style="padding:4px 8px;">📋</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>身高</label>
                    <div style="display:flex;gap:4px;">
                        <input type="text" value="${p.height || ''}" onchange="ViewCallbacks.character.updateProfile('${characterId}', 'height', this.value)" placeholder="例如：165cm" id="editCharHeight">
                        <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharHeight')" style="padding:4px 8px;">📋</button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>外貌描述</label>
                <div style="display:flex;gap:4px;">
                    <textarea rows="4" onchange="ViewCallbacks.character.updateProfile('${characterId}', 'appearance', this.value)" placeholder="描述外貌特征">${p.appearance || ''}</textarea>
                    <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharAppearance', true)" style="padding:4px 8px;height:fit-content;">📋</button>
                </div>
                <input type="text" id="editCharAppearance" value="${p.appearance || ''}" style="display:none;">
            </div>
        </div>
    `;
});

View.register('character.personality', function(worldId, characterId) {
    const p = Data.getCharacter(worldId, characterId)?.profile || {};
    
    return `
        <div class="card">
            <h4>🎭 性格与爱好</h4>
            <div class="form-group">
                <label>性格类型</label>
                <div style="display:flex;gap:4px;">
                    <input type="text" value="${p.personality || ''}" onchange="ViewCallbacks.character.updateProfile('${characterId}', 'personality', this.value)" placeholder="如：温柔内向、活泼开朗..." id="editCharPersonality">
                    <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharPersonality')" style="padding:4px 8px;">📋</button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>兴趣爱好</label>
                    <div style="display:flex;gap:4px;">
                        <input type="text" value="${p.hobby || ''}" onchange="ViewCallbacks.character.updateProfile('${characterId}', 'hobby', this.value)" placeholder="例如：看书、跑步" id="editCharHobby" style="flex:1;">
                        <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharHobby')" style="padding:4px 8px;">📋</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>喜欢的事物</label>
                    <div style="display:flex;gap:4px;">
                        <input type="text" value="${p.favorite || ''}" onchange="ViewCallbacks.character.updateProfile('${characterId}', 'favorite', this.value)" placeholder="例如：甜点、音乐" id="editCharFavorite" style="flex:1;">
                        <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharFavorite')" style="padding:4px 8px;">📋</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>讨厌的事物</label>
                    <div style="display:flex;gap:4px;">
                        <input type="text" value="${p.dislike || ''}" onchange="ViewCallbacks.character.updateProfile('${characterId}', 'dislike', this.value)" placeholder="例如：昆虫、孤单" id="editCharDislike" style="flex:1;">
                        <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharDislike')" style="padding:4px 8px;">📋</button>
                    </div>
                </div>
            </div>
        </div>
    `;
});

View.register('character.background', function(worldId, characterId) {
    const char = Data.getCharacter(worldId, characterId);
    const p = char?.profile || {};
    const relationship = char?.relationship || '';
    
    return `
        <div class="card">
            <h4>📖 背景故事</h4>
            <div class="form-group">
                <label>出身背景</label>
                <div style="display:flex;gap:4px;">
                    <textarea rows="3" onchange="ViewCallbacks.character.updateProfile('${characterId}', 'backstory', this.value)" placeholder="例如：富二代、孤儿">${p.backstory || ''}</textarea>
                    <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharBackstory')" style="padding:4px 8px;height:fit-content;">📋</button>
                </div>
                <input type="text" id="editCharBackstory" value="${p.backstory || ''}" style="display:none;">
            </div>
            <div class="form-group">
                <label>口头禅</label>
                <input type="text" value="${p.catchphrase || ''}" onchange="ViewCallbacks.character.updateProfile('${characterId}', 'catchphrase', this.value)" placeholder="如：人家知道了~">
            </div>
            <div class="form-group">
                <label>关系</label>
                <textarea rows="3" onchange="ViewCallbacks.character.updateField('${characterId}', 'relationship', this.value)" placeholder="例如：主角的青梅竹马、魔王的女儿">${relationship || ''}</textarea>
            </div>
        </div>
    `;
});

View.register('character.stats', function(worldId, characterId) {
    const char = Data.getCharacter(worldId, characterId);
    const DEFAULT_STATS = {
        health: 100, energy: 100, charm: 50, intelligence: 50,
        strength: 50, agility: 50, stamina: 50,
        sexArousal: 0, sexExperience: 0, sexSkill: 0, sexLibido: 50, sexSensitivity: 50,
        affection: 50, trust: 50, intimacy: 0, corruption: 0, shame: 50
    };
    const stats = { ...DEFAULT_STATS, ...char?.stats };
    
    const statGroups = {
        '基础属性': ['health', 'energy', 'charm', 'intelligence', 'strength', 'agility', 'stamina'],
        '色色属性': ['sexArousal', 'sexExperience', 'sexSkill', 'sexLibido', 'sexSensitivity'],
        '状态属性': ['affection', 'trust', 'intimacy', 'corruption', 'shame']
    };
    
    const statLabels = {
        health: '生命', energy: '体力', charm: '魅力', intelligence: '智力', strength: '力量',
        agility: '敏捷', stamina: '耐力',
        sexArousal: '欲望', sexExperience: '经验', sexSkill: '技巧', sexLibido: '性欲', sexSensitivity: '敏感',
        affection: '好感', trust: '信任', intimacy: '亲密', corruption: '堕落', shame: '羞耻'
    };
    
    let html = '<div>';
    Object.entries(statGroups).forEach(([groupName, statsList]) => {
        const isAdult = groupName === '色色属性';
        html += `<h4 class="stat-group-title ${isAdult ? 'adult' : ''}">${groupName}</h4>`;
        html += '<div class="stat-grid">';
        statsList.forEach(stat => {
            const value = stats[stat] || 0;
            const color = value >= 80 ? '#22c55e' : value >= 50 ? '#6366f1' : value >= 20 ? '#f59e0b' : '#ef4444';
            html += `
                <div class="stat-item">
                    <div class="stat-info">
                        <div class="stat-label">${statLabels[stat] || stat}</div>
                        <div class="stat-bar"><div class="stat-bar-fill" style="width: ${Math.min(100, value)}%; background: ${color};"></div></div>
                    </div>
                    <input type="number" value="${value}" min="0" max="200" onchange="ViewCallbacks.character.updateStat('${characterId}', '${stat}', parseInt(this.value))">
                </div>
            `;
        });
        html += '</div>';
    });
    html += '</div>';
    return html;
});

View.register('character.adult', function(worldId, characterId) {
    const char = Data.getCharacter(worldId, characterId);
    const a = char?.adultProfile || {};
    
    return `
        <div class="card card-adult">
            <h4>🔞 色色设定</h4>
            <div class="form-grid">
                <div class="form-group">
                    <label>性取向</label>
                    <select onchange="ViewCallbacks.character.updateAdult('${characterId}', 'sexuality', this.value)">
                        <option value="异性恋" ${a.sexuality === '异性恋' ? 'selected' : ''}>异性恋</option>
                        <option value="同性恋" ${a.sexuality === '同性恋' ? 'selected' : ''}>同性恋</option>
                        <option value="双性恋" ${a.sexuality === '双性恋' ? 'selected' : ''}>双性恋</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>敏感部位</label>
                <div style="display:flex;gap:4px;">
                    <textarea rows="2" id="editCharSensitive" onchange="ViewCallbacks.character.updateAdult('${characterId}', 'sensitiveParts', this.value)" placeholder="例如：耳朵、颈部、多选请用顿号分隔">${a.sensitiveParts || ''}</textarea>
                    <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharSensitive', true)" style="padding:4px 8px;height:fit-content;">📋</button>
                </div>
            </div>
            <div class="form-group">
                <label>性癖好</label>
                <div style="display:flex;gap:4px;">
                    <textarea rows="2" id="editCharFetish" onchange="ViewCallbacks.character.updateAdult('${characterId}', 'fetish', this.value)" placeholder="例如：制服、玩具、多选请用顿号分隔">${a.fetish || ''}</textarea>
                    <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharFetish', true)" style="padding:4px 8px;height:fit-content;">📋</button>
                </div>
            </div>
            <div class="form-group">
                <label>底线/雷区</label>
                <div style="display:flex;gap:4px;">
                    <textarea rows="2" id="editCharLimits" onchange="ViewCallbacks.character.updateAdult('${characterId}', 'limits', this.value)" placeholder="例如：不愿意、底线、多选请用顿号分隔">${a.limits || ''}</textarea>
                    <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharLimits', true)" style="padding:4px 8px;height:fit-content;">📋</button>
                </div>
            </div>
            <div class="form-group">
                <label>性幻想</label>
                <div style="display:flex;gap:4px;">
                    <textarea rows="2" id="editCharFantasy" onchange="ViewCallbacks.character.updateAdult('${characterId}', 'fantasies', this.value)" placeholder="例如：海边度假、浪漫温情、多选请用顿号分隔">${a.fantasies || ''}</textarea>
                    <button type="button" class="btn btn-secondary" onclick="CharacterPresets.showPresetPicker('editCharFantasy', true)" style="padding:4px 8px;height:fit-content;">📋</button>
                </div>
            </div>
        </div>
    `;
});

ViewCallbacks.character = {
    updateField(charId, field, value) {
        const world = Data.getCurrentWorld();
        if (world) {
            Data.updateCharacter(world.id, charId, { [field]: value });
        }
    },
    
    updateProfile(charId, field, value) {
        const world = Data.getCurrentWorld();
        if (world) {
            const char = Data.getCharacter(world.id, charId);
            if (char) {
                char.profile = char.profile || {};
                char.profile[field] = value;
                Data.updateCharacter(world.id, charId, { profile: char.profile });
            }
        }
    },
    
    updateAdult(charId, field, value) {
        const world = Data.getCurrentWorld();
        if (world) {
            const char = Data.getCharacter(world.id, charId);
            if (char) {
                char.adultProfile = char.adultProfile || {};
                char.adultProfile[field] = value;
                Data.updateCharacter(world.id, charId, { adultProfile: char.adultProfile });
            }
        }
    },
    
    updateStat(charId, stat, value) {
        const world = Data.getCurrentWorld();
        if (world) {
            char.stats = char.stats || {};
            char.stats[stat] = Math.max(0, Math.min(200, value));
            Data.updateCharacter(world.id, charId, { stats: char.stats });
        }
    },
    
    toggleArray(charId, field, value) {
        const world = Data.getCurrentWorld();
        const char = Data.getCharacter(world.id, charId);
        if (!char) return;
        
        char.adultProfile = char.adultProfile || {};
        const arr = char.adultProfile[field] || [];
        const idx = arr.indexOf(value);
        
        if (idx > -1) {
            arr.splice(idx, 1);
        } else {
            arr.push(value);
        }
        char.adultProfile[field] = arr;
        Data.updateCharacter(world.id, charId, { adultProfile: char.adultProfile });
        
        document.getElementById('charTabContent').innerHTML = View.render('character.adult', world.id, charId);
    }
};

ViewCallbacks.inventory = {
    showAddFromCharPanel(worldId, characterId) {
        const html = View.render('inventory.addFromCharPanel', worldId, characterId);
        document.getElementById('charTabContent').innerHTML = html;
    },
    
    showAddFormFromCharPanel(characterId) {
        const world = Data.getCurrentWorld();
        document.getElementById('addItemFormCharPanel').innerHTML = View.render('inventory.add', characterId);
    },
    
    addFromCharPanel(characterId) {
        const world = Data.getCurrentWorld();
        const name = document.getElementById('itemName')?.value;
        if (!name) return;
        
        let effects = {};
        try {
            effects = JSON.parse(document.getElementById('itemEffects')?.value || '{}');
        } catch {}
        
        const plugin = PluginSystem.get('inventory');
        plugin?.addItem(world.id, characterId, {
            name,
            type: document.getElementById('itemType')?.value || 'misc',
            effects
        });
        
        document.getElementById('charTabContent').innerHTML = View.render('characterRead.inventory', world.id, characterId);
    },
    
    showLibraryPickerFromCharPanel(characterId) {
        document.getElementById('addItemFormCharPanel').innerHTML = View.render('inventory.libraryPicker', characterId);
    },
    
    addFromLibraryFromCharPanel(characterId, itemId) {
        const world = Data.getCurrentWorld();
        const plugin = PluginSystem.get('inventory');
        const library = plugin?.getItemLibrary() || [];
        const item = library.find(i => i.id === itemId);
        
        if (item) {
            plugin?.addItem(world.id, characterId, item);
            document.getElementById('charTabContent').innerHTML = View.render('characterRead.inventory', world.id, characterId);
        }
    },
    
    useItemFromCharPanel(worldId, characterId, itemId) {
        this.showUseItemTargetPicker(worldId, characterId, itemId);
    }
};

View.register('characterRead.basic', function(worldId, characterId) {
    const char = Data.getCharacter(worldId, characterId);
    if (!char) return '<div class="empty">角色不存在</div>';

    const p = char?.profile || {};
    
    return `
        <div class="card">
            <h4>📋 基础信息</h4>
            <div class="info-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div class="info-item"><span class="info-label">名字</span><span class="info-value">${char?.name || '-'}</span></div>
                <div class="info-item"><span class="info-label">性别</span><span class="info-value">${char?.gender || '-'}</span></div>
                <div class="info-item"><span class="info-label">年龄</span><span class="info-value">${char?.age || '-'}</span></div>
                <div class="info-item"><span class="info-label">角色定位</span><span class="info-value">${char?.role || '-'}</span></div>
                <div class="info-item"><span class="info-label">种族</span><span class="info-value">${p.race || '-'}</span></div>
                <div class="info-item"><span class="info-label">职业</span><span class="info-value">${p.occupation || '-'}</span></div>
                <div class="info-item"><span class="info-label">身高</span><span class="info-value">${p.height || '-'}</span></div>
            </div>
            <div class="info-item" style="margin-top: 12px;"><span class="info-label">外貌描述</span><span class="info-value">${p.appearance || '-'}</span></div>
        </div>
    `;
});

View.register('characterRead.personality', function(worldId, characterId) {
    const p = Data.getCharacter(worldId, characterId)?.profile || {};
    
    return `
        <div class="card">
            <h4>🎭 性格与爱好</h4>
            <div class="info-item"><span class="info-label">性格类型</span><span class="info-value">${p.personality || '-'}</span></div>
            <div class="info-item"><span class="info-label">兴趣爱好</span><span class="info-value">${p.hobby || '-'}</span></div>
            <div class="info-item"><span class="info-label">喜欢的事物</span><span class="info-value">${p.favorite || '-'}</span></div>
            <div class="info-item"><span class="info-label">讨厌的事物</span><span class="info-value">${p.dislike || '-'}</span></div>
        </div>
    `;
});

View.register('characterRead.background', function(worldId, characterId) {
    const char = Data.getCharacter(worldId, characterId);
    const p = char?.profile || {};
    const relationship = char?.relationship || '';
    
    return `
        <div class="card">
            <h4>📖 背景故事</h4>
            <div class="info-item"><span class="info-label">出身背景</span><span class="info-value">${p.backstory || '-'}</span></div>
            <div class="info-item"><span class="info-label">口头禅</span><span class="info-value">${p.catchphrase || '-'}</span></div>
            <div class="info-item"><span class="info-label">关系</span><span class="info-value">${relationship || '-'}</span></div>
        </div>
    `;
});

View.register('characterRead.stats', function(worldId, characterId) {
    const char = Data.getCharacter(worldId, characterId);
    const DEFAULT_STATS = {
        health: 100, energy: 100, charm: 50, intelligence: 50,
        strength: 50, agility: 50, stamina: 50,
        sexArousal: 0, sexExperience: 0, sexSkill: 0, sexLibido: 50, sexSensitivity: 50,
        affection: 50, trust: 50, intimacy: 0, corruption: 0, shame: 50
    };
    const stats = { ...DEFAULT_STATS, ...char?.stats };
    
    const statGroups = {
        '基础属性': ['health', 'energy', 'charm', 'intelligence', 'strength', 'agility', 'stamina'],
        '色色属性': ['sexArousal', 'sexExperience', 'sexSkill', 'sexLibido', 'sexSensitivity'],
        '状态属性': ['affection', 'trust', 'intimacy', 'corruption', 'shame']
    };
    
    const statLabels = {
        health: '生命', energy: '体力', charm: '魅力', intelligence: '智力', strength: '力量',
        agility: '敏捷', stamina: '耐力',
        sexArousal: '欲望', sexExperience: '经验', sexSkill: '技巧', sexLibido: '性欲', sexSensitivity: '敏感',
        affection: '好感', trust: '信任', intimacy: '亲密', corruption: '堕落', shame: '羞耻'
    };
    
    let html = '<div>';
    Object.entries(statGroups).forEach(([groupName, statsList]) => {
        const isAdult = groupName === '色色属性';
        html += `<h4 class="stat-group-title ${isAdult ? 'adult' : ''}">${groupName}</h4>`;
        html += '<div class="stat-grid">';
        statsList.forEach(stat => {
            const value = stats[stat] || 0;
            const color = value >= 80 ? '#22c55e' : value >= 50 ? '#6366f1' : value >= 20 ? '#f59e0b' : '#ef4444';
            html += `
                <div class="stat-item">
                    <div class="stat-info">
                        <div class="stat-label">${statLabels[stat] || stat}</div>
                        <div class="stat-bar"><div class="stat-bar-fill" style="width: ${Math.min(100, value)}%; background: ${color};"></div></div>
                    </div>
                    <div class="stat-value" style="font-weight: bold; color: ${color};">${value}</div>
                </div>
            `;
        });
        html += '</div>';
    });
    html += '</div>';
    return html;
});

View.register('characterRead.adult', function(worldId, characterId) {
    const char = Data.getCharacter(worldId, characterId);
    const a = char?.adultProfile || {};
    
    return `
        <div class="card card-adult">
            <h4>🔞 色色设定</h4>
            <div class="info-item"><span class="info-label">性取向</span><span class="info-value">${a.sexuality || '-'}</span></div>
            <div class="info-item"><span class="info-label">敏感部位</span><span class="info-value">${a.sensitiveParts || '-'}</span></div>
            <div class="info-item"><span class="info-label">性癖好</span><span class="info-value">${a.fetish || '-'}</span></div>
            <div class="info-item"><span class="info-label">底线/雷区</span><span class="info-value">${a.limits || '-'}</span></div>
            <div class="info-item"><span class="info-label">性幻想</span><span class="info-value">${a.fantasies || '-'}</span></div>
        </div>
    `;
});

View.register('characterRead.inventory', function(worldId, characterId) {
    const plugin = PluginSystem.get('inventory');
    const items = plugin?.getItems(worldId, characterId) || [];
    const char = Data.getCharacter(worldId, characterId);
    const allChars = Data.getCharacters(worldId) || [];
    
    const hasStory = Story.isOngoing();
    
    return `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4>🎒 背包</h4>
                <button class="btn btn-secondary" onclick="ViewCallbacks.inventory.showAddFromCharPanel('${worldId}', '${characterId}')" style="padding: 4px 8px; font-size: 0.8rem;">+ 添加物品</button>
            </div>
            ${items.length === 0 ? '<div class="empty">暂无物品</div>' : items.map(item => `
                <div class="item-card" style="margin-bottom: 8px;">
                    <span class="item-icon">${item.icon || '📦'}</span>
                    <div class="item-info" style="flex: 1;">
                        <div class="item-name">${item.name}</div>
                        <div class="item-desc">${item.description || item.type}</div>
                        ${item.effects ? `<div class="item-effects" style="font-size: 0.7rem; color: var(--accent);">${JSON.stringify(item.effects)}</div>` : ''}
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="ViewCallbacks.inventory.showUseItemTargetPicker('${worldId}', '${characterId}', '${item.id}')">使用</button>
                </div>
            `).join('')}
        </div>
    `;
});

View.register('inventory.addFromCharPanel', function(worldId, characterId) {
    const plugin = PluginSystem.get('inventory');
    const library = plugin?.getItemLibrary() || [];
    
    let html = '<div style="margin-bottom: 12px;">';
    html += '<button class="btn btn-secondary" onclick="ViewCallbacks.inventory.showAddFormFromCharPanel(\'' + characterId + '\')" style="margin-right: 8px;">✏️ 自定义添加</button>';
    if (library.length > 0) {
        html += '<button class="btn btn-secondary" onclick="ViewCallbacks.inventory.showLibraryPickerFromCharPanel(\'' + characterId + '\')">📚 从物品库选择</button>';
    }
    html += '</div>';
    html += '<div id="addItemFormCharPanel"></div>';
    
    return html;
});

View.register('inventory.add', function(characterId) {
    return `
        <div class="form-group">
            <label>物品名称</label>
            <input type="text" id="itemName" placeholder="例如：魔法药水">
        </div>
        <div class="form-group">
            <label>物品类型</label>
            <select id="itemType">
                <option value="misc">杂物</option>
                <option value="food">食物</option>
                <option value="potion">药水</option>
                <option value="weapon">武器</option>
                <option value="tool">工具</option>
                <option value="adult">成人物品</option>
            </select>
        </div>
        <div class="form-group">
            <label>效果（JSON格式）</label>
            <input type="text" id="itemEffects" placeholder='{"health": 20, "energy": 10}'>
        </div>
        <button class="btn" onclick="ViewCallbacks.inventory.addFromCharPanel('${characterId}')">添加</button>
    `;
});

View.register('inventory.libraryPicker', function(characterId) {
    const plugin = PluginSystem.get('inventory');
    const library = plugin?.getItemLibrary() || [];
    
    if (library.length === 0) {
        return `<div class="empty">物品库为空，请在物品库中添加物品</div>`;
    }
    
    return `
        <div style="max-height: 400px; overflow-y: auto;">
            ${library.map(item => `
                <div class="item-card" style="cursor: pointer;" onclick="ViewCallbacks.inventory.addFromLibraryFromCharPanel('${characterId}', '${item.id}')">
                    <span class="item-icon">${item.icon || '📦'}</span>
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-desc">${item.description || item.type}</div>
                        ${item.effects ? `<div class="item-effects" style="font-size: 0.7rem; color: var(--accent);">${JSON.stringify(item.effects)}</div>` : ''}
                    </div>
                    <span style="color: var(--accent);">+ 添加</span>
                </div>
            `).join('')}
        </div>
    `;
});

window.ViewCallbacks = window.ViewCallbacks || {};
Object.assign(window.ViewCallbacks, ViewCallbacks);

if (!window.ViewCallbacks.inventory.useItemFromCharPanel) {
    window.ViewCallbacks.inventory = window.ViewCallbacks.inventory || {};
    window.ViewCallbacks.inventory.useItemFromCharPanel = function(worldId, characterId, itemId) {
        const plugin = PluginSystem.get('inventory');
        const result = plugin?.useItem(worldId, characterId, itemId);
        if (result) {
            document.getElementById('charTabContent').innerHTML = View.render('characterRead.inventory', worldId, characterId);
        }
    };
    window.ViewCallbacks.inventory.showAddFromCharPanel = function(worldId, characterId) {
        const html = View.render('inventory.addFromCharPanel', worldId, characterId);
        document.getElementById('charTabContent').innerHTML = html;
    };
    window.ViewCallbacks.inventory.showAddFormFromCharPanel = function(characterId) {
        const world = Data.getCurrentWorld();
        document.getElementById('addItemFormCharPanel').innerHTML = View.render('inventory.add', characterId);
    };
    window.ViewCallbacks.inventory.addFromCharPanel = function(characterId) {
        const world = Data.getCurrentWorld();
        const name = document.getElementById('itemName')?.value;
        if (!name) return;
        let effects = {};
        try {
            effects = JSON.parse(document.getElementById('itemEffects')?.value || '{}');
        } catch {}
        const plugin = PluginSystem.get('inventory');
        plugin?.addItem(world.id, characterId, {
            name,
            type: document.getElementById('itemType')?.value || 'misc',
            effects
        });
        document.getElementById('charTabContent').innerHTML = View.render('characterRead.inventory', world.id, characterId);
    };
    window.ViewCallbacks.inventory.showLibraryPickerFromCharPanel = function(characterId) {
        document.getElementById('addItemFormCharPanel').innerHTML = View.render('inventory.libraryPicker', characterId);
    };
    window.ViewCallbacks.inventory.addFromLibraryFromCharPanel = function(characterId, itemId) {
        const world = Data.getCurrentWorld();
        const plugin = PluginSystem.get('inventory');
        const library = plugin?.getItemLibrary() || [];
        const item = library.find(i => i.id === itemId);
        if (item) {
            plugin?.addItem(world.id, characterId, item);
            document.getElementById('charTabContent').innerHTML = View.render('characterRead.inventory', world.id, characterId);
        }
    };
    
    window.ViewCallbacks.inventory.showUseItemTargetPicker = function(worldId, itemOwnerCharId, itemId) {
        const world = Data.getCurrentWorld();
        const allChars = Data.getCharacters(worldId) || [];
        const plugin = PluginSystem.get('inventory');
        const items = plugin?.getItems(worldId, itemOwnerCharId) || [];
        const item = items.find(i => i.id === itemId);
        
        if (!item) return;
        
        const charOptions = allChars.map(c => 
            `<option value="${c.id}">${c.name}</option>`
        ).join('');
        
        document.getElementById('modalTitle').textContent = `使用 ${item.name}`;
        document.getElementById('modalBody').innerHTML = `
            <div style="padding: 16px;">
                <p style="margin-bottom: 16px;">选择物品使用对象：</p>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">目标角色</label>
                    <select id="itemTargetChar" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        ${charOptions}
                    </select>
                </div>
                ${item.effects ? `
                    <div style="margin-bottom: 16px; padding: 12px; background: var(--border); border-radius: 6px;">
                        <div style="font-weight: bold; margin-bottom: 8px;">物品效果：</div>
                        <div style="font-size: 0.85rem; color: var(--accent);">${JSON.stringify(item.effects)}</div>
                    </div>
                ` : ''}
                <div style="display: flex; gap: 8px;">
                    <button class="btn" onclick="ViewCallbacks.inventory.useItemOnTarget('${worldId}', '${itemOwnerCharId}', '${item.id}')">在剧情中使用</button>
                    <button class="btn btn-secondary" onclick="ViewCallbacks.inventory.useItemDirect('${worldId}', '${itemOwnerCharId}', '${item.id}')">直接使用</button>
                    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                </div>
            </div>
        `;
        document.getElementById('modal').classList.add('active');
    };
    
    window.ViewCallbacks.inventory.useItemOnTarget = function(worldId, itemOwnerCharId, itemId) {
        const targetCharId = document.getElementById('itemTargetChar')?.value;
        if (!targetCharId) {
            alert('请选择目标角色');
            return;
        }
        
        closeModal();
        
        const plugin = PluginSystem.get('inventory');
        plugin?.useItem(worldId, itemOwnerCharId, itemId, { 
            targetCharId: targetCharId,
            userCharId: itemOwnerCharId,
            generateStory: true
        });
        
        document.getElementById('charTabContent').innerHTML = View.render('characterRead.inventory', worldId, itemOwnerCharId);
    };
}
