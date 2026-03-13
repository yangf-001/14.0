PluginSystem.register('character-editor', {
    description: '角色详细编辑插件',
    features: ['角色详细编辑', '属性管理', '色色设定', '预设人物库'],
    _storageKey: 'character_editor_presets',
    
    init() {
        console.log('Character editor plugin loaded');
    }
});

const PresetCharacterLibrary = {
    basePath: './js/plugins/character-editor/世界观/',
    worlds: [],
    characters: {},
    aiSettings: {},
    storyStarts: {},
    _cacheData: null,
    
    init() {
        this.createModal();
        this._loadFromStorage();
    },
    
    _loadFromStorage() {
        try {
            const stored = localStorage.getItem('character_editor_presets');
            if (stored) {
                const data = JSON.parse(stored);
                const now = Date.now();
                if (data.timestamp && (now - data.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                    this.worlds = data.worlds || [];
                    this.characters = data.characters || {};
                    this.aiSettings = data.aiSettings || {};
                    this.storyStarts = data.storyStarts || {};
                    console.log('[角色编辑器] 从缓存加载了预设库');
                    return true;
                }
            }
        } catch (e) {
            console.warn('[角色编辑器] 读取缓存失败:', e);
        }
        return false;
    },
    
    _saveToStorage() {
        try {
            localStorage.setItem('character_editor_presets', JSON.stringify({
                timestamp: Date.now(),
                worlds: this.worlds,
                characters: this.characters,
                aiSettings: this.aiSettings,
                storyStarts: this.storyStarts
            }));
        } catch (e) {
            console.warn('[角色编辑器] 保存缓存失败:', e);
        }
    },
    
    createModal() {
        if (document.getElementById('presetModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'presetModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="presetModalTitle">导入世界观</h3>
                    <button class="modal-close" onclick="document.getElementById('presetModal').classList.remove('active')">×</button>
                </div>
                <div id="presetModalBody"></div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    async scan() {
        // 先尝试从缓存加载
        if (await this._tryLoadFromCache()) {
            console.log('[角色编辑器] 使用缓存的预设库');
            this.showWorldSelector();
            return;
        }
        
        this.worlds = [];
        this.characters = {};
        
        const basePath = this.getBasePath();
        console.log('Scanning preset library at:', basePath);
        
        try {
            const response = await fetch(basePath);
            if (!response.ok) {
                throw new Error('无法加载预设库: ' + response.status);
            }
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const links = doc.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('/') && href !== '../') {
                    let worldName = href.replace(/\/$/, '');
                    try {
                        worldName = decodeURIComponent(worldName);
                    } catch (e) {}
                    this.worlds.push(worldName);
                    this.characters[worldName] = [];
                }
            });
            
            for (const worldName of this.worlds) {
                await this.loadWorldCharacters(worldName);
            }
            
            console.log('Preset library scanned:', this.worlds.length, 'worlds');
            this._saveToStorage();
            this.showWorldSelector();
        } catch (e) {
            console.error('Failed to scan preset library:', e);
            console.log('[角色编辑器] 网络加载失败，尝试使用离线预设...');
            this._loadOfflineWorlds();
        }
    },
    
    _loadOfflineWorlds() {
        this.worlds = [
            '七元素-纯爱',
            '仙尊-纯爱',
            '好兄弟-纯爱',
            '社恐-纯爱',
            '巨龙-纯爱',
            '转世咸鱼-纯爱',
            '纯爱灭杀-纯爱',
            '死宅-后宫',
            '卡通-后宫',
            '怪物女友-后宫',
            '人妻太太-后宫',
            '修仙系统-后宫',
            '校霸复仇-后宫',
            '精灵妈妈-后宫',
            '魔物工具人-后宫',
            '物件成精-后宫',
            '常识混乱-后宫',
            '渡劫失败-后宫',
            '骚气世界-后宫',
            '社恐变强-后宫',
            '千变万化-后宫'
        ];
        
        this.characters = {};
        this.aiSettings = {};
        this.storyStarts = {};
        
        for (const worldName of this.worlds) {
            this.characters[worldName] = [];
            this.aiSettings[worldName] = null;
            this.storyStarts[worldName] = [];
        }
        
        console.log('[角色编辑器] 使用离线预设库:', this.worlds.length, '个世界观');
        
        // 尝试加载角色和AI配置（网络请求）
        this._loadOfflineWorldDetails();
    },
    
    async _loadOfflineWorldDetails() {
        const basePath = this.getBasePath();
        
        for (const worldName of this.worlds) {
            try {
                const worldPath = basePath + encodeURIComponent(worldName) + '/';
                const response = await fetch(worldPath);
                if (!response.ok) continue;
                
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                const links = doc.querySelectorAll('a');
                const subFolders = {};
                
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href) {
                        if (href.endsWith('/') && href !== '../') {
                            let folderName = href.replace(/\/$/, '');
                            try { folderName = decodeURIComponent(folderName); } catch (e) {}
                            subFolders[folderName] = href;
                        } else if (href.endsWith('.json')) {
                            let fileName = href.replace('.json', '');
                            try { fileName = decodeURIComponent(fileName); } catch (e) {}
                            if (fileName.includes('提示词') || fileName.includes('settings') || fileName.includes('setting')) {
                                this.aiSettings[worldName] = {
                                    name: fileName,
                                    path: worldPath + href
                                };
                            } else {
                                this.characters[worldName].push({
                                    name: fileName,
                                    path: worldPath + href
                                });
                            }
                        }
                    }
                });
                
                if (subFolders['剧情节点']) {
                    await this.loadStoryStartsFromFolder(worldName, worldPath + subFolders['剧情节点']);
                }
            } catch (e) {
                console.warn(`[角色编辑器] 加载 ${worldName} 详情失败:`, e);
            }
        }
        
        this._saveToStorage();
        this.showWorldSelector();
    },
    
    getBasePath() {
        const path = window.location.pathname;
        const isIndex = path.endsWith('index.html') || path.endsWith('/');
        
        if (isIndex) {
            const baseDir = path.substring(0, path.lastIndexOf('/'));
            return baseDir + '/js/plugins/character-editor/世界观/';
        }
        
        return './js/plugins/character-editor/世界观/';
    },

    async _tryLoadFromCache() {
        try {
            const stored = localStorage.getItem('character_editor_presets');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.worlds && data.worlds.length > 0) {
                    console.log('[角色编辑器] 从缓存加载预设库:', data.worlds.length, '个世界观');
                    this.worlds = data.worlds || [];
                    this.characters = data.characters || {};
                    this.aiSettings = data.aiSettings || {};
                    this.storyStarts = data.storyStarts || {};
                    return true;
                }
            }
        } catch (e) {
            console.warn('[角色编辑器] 读取缓存失败:', e);
        }
        return false;
    },
    
    getWorldPath(worldName) {
        return this.getBasePath() + encodeURIComponent(worldName) + '/';
    },
    
    async loadWorldCharacters(worldName) {
        try {
            const worldPath = this.getWorldPath(worldName);
            const response = await fetch(worldPath);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            this.characters[worldName] = [];
            this.aiSettings[worldName] = null;
            this.storyStarts[worldName] = [];
            
            const links = doc.querySelectorAll('a');
            const subFolders = {};
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    if (href.endsWith('/') && href !== '../') {
                        let folderName = href.replace(/\/$/, '');
                        try { folderName = decodeURIComponent(folderName); } catch (e) {}
                        subFolders[folderName] = href;
                    } else if (href.endsWith('.json')) {
                        let fileName = href.replace('.json', '');
                        try { fileName = decodeURIComponent(fileName); } catch (e) {}
                        if (fileName.includes('提示词') || fileName.includes('settings') || fileName.includes('setting')) {
                            this.aiSettings[worldName] = {
                                name: fileName,
                                path: worldPath + href
                            };
                        } else {
                            this.characters[worldName].push({
                                name: fileName,
                                path: worldPath + href
                            });
                        }
                    }
                }
            });
            
            if (subFolders['剧情节点']) {
                await this.loadStoryStartsFromFolder(worldName, worldPath + subFolders['剧情节点']);
            }
            
            if (subFolders['角色']) {
                this.characters[worldName] = [];
                await this.loadCharactersFromFolder(worldName, worldPath + subFolders['角色']);
            }
            
            if (subFolders['AI配置']) {
                await this.loadAISettingsFromFolder(worldName, worldPath + subFolders['AI配置']);
            }
            
        } catch (e) {
            console.warn('Failed to load characters for', worldName, e);
        }
    },
    
    async loadStoryStartsFromFolder(worldName, folderPath) {
        try {
            const response = await fetch(folderPath);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const links = doc.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.json')) {
                    let fileName = href.replace('.json', '');
                    try { fileName = decodeURIComponent(fileName); } catch (e) {}
                    this.storyStarts[worldName].push({
                        name: fileName,
                        path: folderPath + href
                    });
                }
            });
        } catch (e) {
            console.warn('Failed to load story starts from folder:', folderPath, e);
        }
    },
    
    async loadCharactersFromFolder(worldName, folderPath) {
        try {
            const response = await fetch(folderPath);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const links = doc.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.json')) {
                    let fileName = href.replace('.json', '');
                    try { fileName = decodeURIComponent(fileName); } catch (e) {}
                    this.characters[worldName].push({
                        name: fileName,
                        path: folderPath + href
                    });
                }
            });
        } catch (e) {
            console.warn('Failed to load characters from folder:', folderPath, e);
        }
    },
    
    async loadAISettingsFromFolder(worldName, folderPath) {
        try {
            const response = await fetch(folderPath);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const links = doc.querySelectorAll('a');
            let firstSetting = null;
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.json')) {
                    let fileName = href.replace('.json', '');
                    try { fileName = decodeURIComponent(fileName); } catch (e) {}
                    if (!firstSetting) {
                        firstSetting = {
                            name: fileName,
                            path: folderPath + href
                        };
                    }
                }
            });
            
            if (firstSetting) {
                this.aiSettings[worldName] = firstSetting;
            }
        } catch (e) {
            console.warn('Failed to load AI settings from folder:', folderPath, e);
        }
    },
    
    async loadCharacterFile(worldName, charFileName) {
        try {
            const charList = this.characters[worldName];
            const charInfo = charList?.find(c => c.name === charFileName);
            
            if (charInfo && charInfo.path) {
                const response = await fetch(charInfo.path);
                if (!response.ok) {
                    console.warn('Character file not found:', charInfo.path, 'Status:', response.status);
                    return null;
                }
                const data = await response.json();
                return data;
            }
            
            const worldPath = this.getWorldPath(worldName);
            const charPath = worldPath + '角色/' + encodeURIComponent(charFileName) + '.json';
            const response = await fetch(charPath);
            if (!response.ok) {
                console.warn('Character file not found:', charPath, 'Status:', response.status);
                return null;
            }
            const data = await response.json();
            return data;
        } catch (e) {
            console.warn('Failed to load character:', charFileName, e);
            return null;
        }
    },
    
    async loadAISettings(worldName) {
        try {
            const settings = this.aiSettings[worldName];
            if (!settings) {
                await this.loadWorldCharacters(worldName);
            }
            const finalSettings = this.aiSettings[worldName];
            if (!finalSettings) return null;
            
            const response = await fetch(finalSettings.path);
            const data = await response.json();
            return data;
        } catch (e) {
            console.warn('Failed to load AI settings for', worldName, e);
            return null;
        }
    },
    
    async showWorldSelector() {
        if (this.worlds.length === 0) {
            await this.scan();
        }
        
        if (this.worlds.length === 0) {
            alert('未找到预设人物库，请检查 世界观 目录');
            return;
        }
        
        let html = '<div style="max-height:500px;overflow-y:auto;">';
        html += '<h4 style="margin:12px 0 8px;font-size:0.9rem;color:var(--accent);">选择要导入的世界观</h4>';
        html += '<p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:12px;">导入将包含该世界观下的所有角色和AI设置</p>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
        
        for (const worldName of this.worlds) {
            const charCount = this.characters[worldName]?.length || 0;
            const hasAI = this.aiSettings[worldName] ? ' 📝' : '';
            const hasStoryStart = this.storyStarts[worldName]?.length > 0 ? ' 🎬' : '';
            const safeWorldName = worldName.replace(/'/g, "\\'");
            html += `<button type="button" class="btn btn-secondary" onclick="PresetCharacterLibrary.selectStoryStart('${safeWorldName}')" style="font-size:0.85rem;padding:8px 12px;margin-bottom:4px;">${worldName} (${charCount}个角色)${hasAI}${hasStoryStart}</button>`;
        }
        
        html += '</div></div>';
        
        document.getElementById('presetModalTitle').textContent = '导入世界观';
        document.getElementById('presetModalBody').innerHTML = html;
        document.getElementById('presetModal').classList.add('active');
    },
    
    async selectStoryStart(worldName) {
        const storyStarts = this.storyStarts[worldName] || [];
        
        if (storyStarts.length === 0) {
            await this.importWorld(worldName, null);
            return;
        }
        
        let html = '<div style="max-height:400px;overflow-y:auto;">';
        html += `<h4 style="margin:12px 0 8px;font-size:0.9rem;color:var(--accent);">选择剧情开始点</h4>`;
        html += '<p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:12px;">选择故事从什么剧情开始</p>';
        html += '<div style="display:flex;flex-direction:column;gap:8px;">';
        
        html += `<button type="button" class="btn btn-secondary" onclick="PresetCharacterLibrary.importWorld('${worldName.replace(/'/g, "\\'")}', null)" style="font-size:0.85rem;padding:10px;">从头开始（默认）</button>`;
        
        for (const start of storyStarts) {
            const startName = start.name.replace(/剧情开始|开局|start/gi, '').trim() || start.name;
            html += `<button type="button" class="btn btn-primary" onclick="PresetCharacterLibrary.importWorld('${worldName.replace(/'/g, "\\'")}', '${start.name.replace(/'/g, "\\'")}')" style="font-size:0.85rem;padding:10px;">${startName}</button>`;
        }
        
        html += '</div></div>';
        
        document.getElementById('presetModalTitle').textContent = '选择剧情开始点 - ' + worldName;
        document.getElementById('presetModalBody').innerHTML = html;
    },
    
    async importWorld(worldName, storyStartName) {
        const charCount = this.characters[worldName]?.length || 0;
        const startInfo = storyStartName ? `，剧情开始点: ${storyStartName}` : '';
        if (!confirm(`确定要导入世界观 "${worldName}" 吗？\n这将创建新世界并导入 ${charCount} 个角色和AI设置${startInfo}。`)) {
            return;
        }
        
        document.getElementById('presetModal').classList.remove('active');
        
        const newWorld = Data.createWorld({
            name: worldName,
            type: '修仙'
        });
        
        Data.setCurrentWorld(newWorld.id);
        
        let storyStartData = null;
        if (storyStartName) {
            storyStartData = await this.loadStoryStart(worldName, storyStartName);
        }
        
        const chars = this.characters[worldName] || [];
        let successCount = 0;
        let errorCount = 0;
        
        for (const char of chars) {
            const charData = await this.loadCharacterFile(worldName, char.name);
            if (charData) {
                try {
                    this.createCharacterFromData(charData, newWorld.id, storyStartData);
                    successCount++;
                } catch (e) {
                    console.error('创建角色失败:', char.name, e);
                    errorCount++;
                }
            } else {
                errorCount++;
            }
        }
        
        if (this.aiSettings[worldName]) {
            const aiData = await this.loadAISettings(worldName);
            if (aiData && aiData.aiSettings) {
                this.applyAISettings(aiData.aiSettings, newWorld.id, storyStartData);
            }
        }
        
        const allStoryStarts = this.storyStarts[worldName] || [];
        const storyStartsData = [];
        for (const start of allStoryStarts) {
            try {
                const response = await fetch(start.path);
                const data = await response.json();
                storyStartsData.push({
                    name: start.name,
                    data: data,
                    unlocked: false
                });
            } catch (e) {
                console.warn('Failed to load story start data:', start.name, e);
            }
        }
        
        if (storyStartsData.length > 0) {
            storyStartsData[0].unlocked = true;
        }
        
        const worldUpdates = {
            storyStart: storyStartData,
            storyNodes: storyStartsData,
            currentStoryNode: storyStartData ? storyStartData.name : (storyStartsData[0]?.name || null)
        };
        
        Data.updateWorld(newWorld.id, worldUpdates);
        
        alert(`导入完成！\n世界: ${worldName}\n剧情开始点: ${storyStartName || '默认（从头开始）'}\n成功: ${successCount} 个角色\n失败: ${errorCount} 个角色`);
        
        if (window.renderWorldsPage) {
            renderWorldsPage();
        } else if (window.renderWorlds) {
            renderWorlds(document.getElementById('main'));
        }
        
        if (window.navigateTo) {
            navigateTo('characters');
        }
    },
    
    async loadStoryStart(worldName, storyStartName) {
        const storyStarts = this.storyStarts[worldName] || [];
        const targetStart = storyStarts.find(s => s.name === storyStartName);
        
        if (!targetStart) {
            console.warn('Story start not found:', storyStartName);
            return null;
        }
        
        try {
            const response = await fetch(targetStart.path);
            const data = await response.json();
            return data;
        } catch (e) {
            console.warn('Failed to load story start:', storyStartName, e);
            return null;
        }
    },
    
    createCharacterFromData(charData, worldId) {
        const targetWorldId = worldId || Data.getCurrentWorld()?.id;
        if (!targetWorldId) {
            throw new Error('未选择世界');
        }
        
        const profile = charData.profile || {};
        const adultProfile = charData.adultProfile || {};
        
        Data.createCharacter(targetWorldId, {
            name: charData.name || '未命名',
            gender: charData.gender || '女',
            role: charData.role || '配角',
            age: parseInt(charData.age) || 18,
            profile: {
                race: profile.race || '',
                occupation: profile.occupation || '',
                height: profile.height || '',
                appearance: profile.appearance || '',
                personality: profile.personality || '',
                hobby: profile.hobby || '',
                favorite: profile.favorite || '',
                dislike: profile.dislike || '',
                backstory: profile.backstory || '',
                catchphrase: profile.catchphrase || ''
            },
            adultProfile: Object.keys(adultProfile).length > 0 ? {
                sexuality: adultProfile.sexuality || '异性恋',
                sensitiveParts: adultProfile.sensitiveParts || '',
                fetish: adultProfile.fetish || '',
                fantasies: adultProfile.fantasies || '',
                limits: adultProfile.limits || ''
            } : {},
            relationship: charData.relationship || ''
        });
    },
    
    applyAISettings(aiSettings, worldId, storyStartData) {
        console.log('Applying AI settings:', aiSettings);
        
        const targetWorldId = worldId || Data.getCurrentWorld()?.id;
        
        if (targetWorldId) {
            const updates = { aiSettings: aiSettings };
            
            if (storyStartData && storyStartData.customStartScene) {
                if (!aiSettings.storyStart) {
                    aiSettings.storyStart = {};
                }
                aiSettings.storyStart.customStartScene = storyStartData.customStartScene;
                aiSettings.storyStart.startStage = storyStartData.startStage || '相遇';
            }
            
            Data.updateWorld(targetWorldId, updates);
            
            const storyConfigPlugin = window.StoryConfigPlugin || window.PluginSystem?.get?.('story-config');
            if (storyConfigPlugin) {
                storyConfigPlugin.saveWorldAISettings(targetWorldId, aiSettings);
            } else {
                try {
                    localStorage.setItem(`story_ai_settings_${targetWorldId}`, JSON.stringify(aiSettings));
                } catch (e) {
                    console.warn('Failed to save AI settings to localStorage:', e);
                }
            }
            
            console.log('AI settings saved to world and localStorage:', targetWorldId);
        }
    }
};

window.PresetCharacterLibrary = PresetCharacterLibrary;
PresetCharacterLibrary.init();
