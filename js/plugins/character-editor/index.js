PluginSystem.register('character-editor', {
    description: '角色详细编辑插件',
    features: ['角色详细编辑', '属性管理', '色色设定', '预设人物库'],
    
    init() {
        console.log('Character editor plugin loaded');
    }
});

const PresetCharacterLibrary = {
    basePath: 'js/plugins/character-editor/世界观/',
    worlds: [],
    characters: {},
    aiSettings: {},
    
    init() {
        this.createModal();
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
        } catch (e) {
            console.error('Failed to scan preset library:', e);
            alert('加载预设库失败，请确保通过服务器访问（而非 file://）\n错误: ' + e.message);
        }
    },
    
    getBasePath() {
        const path = window.location.pathname;
        const isIndex = path.endsWith('index.html') || path.endsWith('/');
        
        if (isIndex) {
            const baseDir = path.substring(0, path.lastIndexOf('/'));
            return baseDir + '/js/plugins/character-editor/世界观/';
        }
        
        return 'js/plugins/character-editor/世界观/';
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
            
            const links = doc.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.json')) {
                    let fileName = href.replace('.json', '');
                    try {
                        fileName = decodeURIComponent(fileName);
                    } catch (e) {}
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
            });
        } catch (e) {
            console.warn('Failed to load characters for', worldName, e);
        }
    },
    
    async loadCharacterFile(worldName, charFileName) {
        try {
            const worldPath = this.getWorldPath(worldName);
            const charPath = worldPath + encodeURIComponent(charFileName) + '.json';
            const response = await fetch(charPath);
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
            const safeWorldName = worldName.replace(/'/g, "\\'");
            html += `<button type="button" class="btn btn-secondary" onclick="PresetCharacterLibrary.importWorld('${safeWorldName}')" style="font-size:0.85rem;padding:8px 12px;margin-bottom:4px;">${worldName} (${charCount}个角色)${hasAI}</button>`;
        }
        
        html += '</div></div>';
        
        document.getElementById('presetModalTitle').textContent = '导入世界观';
        document.getElementById('presetModalBody').innerHTML = html;
        document.getElementById('presetModal').classList.add('active');
    },
    
    async importWorld(worldName) {
        if (!confirm(`确定要导入世界观 "${worldName}" 吗？\n这将创建新世界并导入 ${this.characters[worldName]?.length || 0} 个角色和AI设置。`)) {
            return;
        }
        
        document.getElementById('presetModal').classList.remove('active');
        
        const newWorld = Data.createWorld({
            name: worldName,
            type: '修仙'
        });
        
        Data.setCurrentWorld(newWorld.id);
        
        const chars = this.characters[worldName] || [];
        let successCount = 0;
        let errorCount = 0;
        
        for (const char of chars) {
            const charData = await this.loadCharacterFile(worldName, char.name);
            if (charData) {
                try {
                    this.createCharacterFromData(charData, newWorld.id);
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
                this.applyAISettings(aiData.aiSettings, newWorld.id);
            }
        }
        
        alert(`导入完成！\n世界: ${worldName}\n成功: ${successCount} 个角色\n失败: ${errorCount} 个角色`);
        
        if (window.renderWorldsPage) {
            renderWorldsPage();
        } else if (window.renderWorlds) {
            renderWorlds(document.getElementById('main'));
        }
        
        if (window.navigateTo) {
            navigateTo('characters');
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
    
    applyAISettings(aiSettings, worldId) {
        console.log('Applying AI settings:', aiSettings);
        
        const targetWorldId = worldId || Data.getCurrentWorld()?.id;
        
        if (targetWorldId) {
            Data.updateWorld(targetWorldId, {
                aiSettings: aiSettings
            });
            console.log('AI settings saved to world:', targetWorldId);
        }
    }
};

window.PresetCharacterLibrary = PresetCharacterLibrary;
PresetCharacterLibrary.init();
