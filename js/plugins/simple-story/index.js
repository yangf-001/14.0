PluginSystem.register('simple-story', {
    description: '简单故事模式 - 减少API提示词和输出内容，加快剧情速度',
    features: ['独立界面', '词条随机抽取', '可继续的故事', '选项选择', '详细动作描写'],
    
    _userContentPath: './js/plugins/simple-story/user-content',
    _categories: ['姿势', '表情', '服装', '玩法', '道具', '节日', '挑战', '异族娘'],
    _loadedTags: {},
    _currentStoryTags: null,
    _isRunning: false,
    _worldId: null,
    _characters: null,
    _storyScenes: [],
    _currentRound: 0,
    _storageKey: 'simple_story_tags',
    
    init() {
        console.log('Simple-story plugin loaded');
        this._loadFromStorage();
        this._loadAllCategoryData();
    },
    
    _loadFromStorage() {
        try {
            const stored = localStorage.getItem(this._storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                const now = Date.now();
                if (data.timestamp && (now - data.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                    this._loadedTags = data.tags || {};
                    console.log('[小故事] 从缓存加载了素材库');
                }
            }
        } catch (e) {
            console.warn('[小故事] 读取缓存失败:', e);
        }
    },
    
    _saveToStorage() {
        try {
            localStorage.setItem(this._storageKey, JSON.stringify({
                timestamp: Date.now(),
                tags: this._loadedTags
            }));
        } catch (e) {
            console.warn('[小故事] 保存缓存失败:', e);
        }
    },
    
    async _loadAllCategoryData() {
        const promises = this._categories.map(cat => this._loadCategoryTags(cat));
        await Promise.all(promises);
        this._saveToStorage();
    },
    
    async _loadCategoryTags(category) {
        if (this._loadedTags[category]) {
            return this._loadedTags[category];
        }
        
        const tags = [];
        try {
            const response = await fetch(`${this._userContentPath}/${category}/`);
            const text = await response.text();
            
            const fileMatches = text.match(/href="([^"]+\.txt)"/g) || [];
            
            for (const fileMatch of fileMatches) {
                const filePath = fileMatch.match(/href="([^"]+)"/);
                if (filePath && filePath[1]) {
                    const fullPath = `${this._userContentPath}/${category}/${filePath[1]}`;
                    try {
                        const fileResponse = await fetch(fullPath);
                        const fileContent = await fileResponse.text();
                        const items = this._parseTagFile(fileContent);
                        tags.push(...items);
                    } catch (e) {
                        console.warn(`[小故事] 加载文件失败: ${fullPath}`, e);
                    }
                }
            }
            
            this._loadedTags[category] = tags;
        } catch (e) {
            console.warn(`[小故事] 加载分类 "${category}" 失败:`, e);
        }
        
        return tags;
    },
    
    _parseTagFile(content) {
        const items = [];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (/^\d+[\.、]/.test(line)) {
                const title = line.replace(/^\d+[\.、]\s*/, '').trim();
                let description = '';
                
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine && !/^\d+[\.、]/.test(nextLine)) {
                        description = nextLine;
                        i++;
                    }
                }
                
                if (title) {
                    items.push({ title, description });
                }
            }
        }
        
        return items;
    },
    
    _getRandomTags(count = 3) {
        const selectedCategories = [];
        const availableCategories = [...this._categories];
        
        if (availableCategories.includes('玩法')) {
            selectedCategories.push('玩法');
            const playIndex = availableCategories.indexOf('玩法');
            availableCategories.splice(playIndex, 1);
        }
        
        for (let i = 0; i < Math.min(count - 1, availableCategories.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableCategories.length);
            const category = availableCategories.splice(randomIndex, 1)[0];
            selectedCategories.push(category);
        }
        
        const result = [];
        
        for (const category of selectedCategories) {
            const tags = this._loadedTags[category] || [];
            if (tags.length > 0) {
                const randomIndex = Math.floor(Math.random() * tags.length);
                const tag = tags[randomIndex];
                result.push({
                    category: category,
                    title: tag.title,
                    description: tag.description
                });
            }
        }
        
        return result;
    },
    
    _initSimpleStoryPage() {
        const startBtn = document.getElementById('startSimpleStoryBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this._startSimpleStory());
        }
    },
    
    _renderInitialUI(tagsText) {
        const main = document.getElementById('mainContent');
        if (!main) return;
        
        const world = Data.getCurrentWorld();
        const chars = this._characters;
        
        main.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2>⚡ 小故事</h2>
                    <p class="desc">${world.name} · ${chars.map(c => c.name).join(', ')}</p>
                </div>
                <button class="btn btn-secondary" onclick="SimpleStoryPlugin.endStory()">🏁 结束</button>
            </div>
            
            <div style="margin-bottom: 16px; padding: 12px; background: var(--card); border-radius: 8px;">
                <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 8px;">🎯 词条: ${tagsText}</div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <span style="color: var(--accent); font-size: 0.85rem;">⚡ 开始</span>
                </div>
                <div style="height: 3px; background: var(--bg); border-radius: 2px; overflow: hidden;">
                    <div id="simpleStoryProgress" style="height: 100%; background: linear-gradient(90deg, #ff69b4, #ff1493); width: 30%; transition: width 0.5s;"></div>
                </div>
            </div>
            
            <div id="simpleStoryScenes"></div>
            
            <div id="simpleStoryLoading" style="display: none; text-align: center; padding: 20px;">
            </div>
        `;
    },
    
    async _startSimpleStory() {
        const world = Data.getCurrentWorld();
        if (!world) {
            alert('请先选择一个世界');
            return;
        }
        
        const selectedCharIds = Array.from(document.querySelectorAll('input[name="simpleStoryChars"]:checked')).map(c => c.value);
        
        if (selectedCharIds.length === 0) {
            alert('请至少选择1个角色');
            return;
        }
        
        const allChars = Data.getCharacters(world.id);
        const chars = allChars.filter(c => selectedCharIds.includes(c.id));
        
        if (chars.length === 0) {
            alert('请至少选择1个角色');
            return;
        }
        
        this._worldId = world.id;
        this._characters = chars;
        this._storyScenes = [];
        this._currentRound = 0;
        
        await this._loadAllCategoryData();
        
        const tags = this._getRandomTags(3);
        this._currentStoryTags = tags;
        
        await this._renderStartStory(tags);
    },
    
    async _renderStartStory(tags) {
        const world = Data.getCurrentWorld();
        const chars = this._characters;
        const charNames = chars.map(c => c.name).join('、');
        
        console.log('[小故事] tags:', tags);
        
        const tagsText = tags && tags.length > 0 ? tags.map(t => t.title).join(', ') : '随机词条';
        
        this._renderInitialUI(tagsText);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const prompt = `你是一个色情故事生成AI。

请根据以下词条生成一个简短故事的**开头**，详细描写动作场景。

角色：${charNames}
词条：${tags.map(t => t.title).join('、')}

要求：
1. 详细描写动作、表情、触感
2. 150-250字
3. 必须融入词条元素
4. 故事结束后给出2个选项让用户选择
5. 格式：
【故事】
（内容）

【选项】
1. xxx
2. xxx`;

        try {
            this._showLoading();
            
            const plugin = PluginSystem.get('story-config');
            let systemPrompt = '';
            
            if (plugin && plugin.getWorldSystemPrompt) {
                systemPrompt = plugin.getWorldSystemPrompt(world.id) || '';
            }
            
            const result = await ai.call(prompt, {
                system: systemPrompt,
                temperature: 0.8
            });
            
            this._hideLoading();
            
            this._currentRound++;
            this._storyScenes.push({
                round: this._currentRound,
                content: result,
                tags: tags
            });
            
            this._renderStoryUI();
            
        } catch (e) {
            this._hideLoading();
            console.error('[小故事] 生成失败:', e);
            alert('生成失败: ' + e.message);
        }
    },
    
    async _continueStory(choice) {
        const world = Data.getCurrentWorld();
        const chars = this._characters;
        const charNames = chars.map(c => c.name).join('、');
        
        const historyText = this._storyScenes.map(s => s.content).join('\n\n---\n\n');
        
        const lastContent = this._storyScenes.length > 0 
            ? this._storyScenes[this._storyScenes.length - 1].content 
            : '';
        
        const prompt = `你现在是色情小说作者，文风下流细腻、感官强烈。

请根据用户选择**继续**故事，**必须**从上一段故事的结尾继续发展，**绝对不能**重复之前的内容。

角色：${charNames}
之前的故事：
${historyText}

**上一段故事的结尾：**
${lastContent}

**用户的新选择：**
${choice}

要求：
1. **必须从上一段故事的结尾继续发展**，不能重复之前的任何内容
2. 输出一段完整的150-250字剧情（从当前状态直接推进，不要总结前文）
3. 性爱重点描写性器官触感、声音、体液、抽插节奏、呻吟脏话、身体反应
4. 语言要直接露骨，使用"鸡巴""骚穴""淫水""操""射"等词
5. 剧情在本段内形成一个小高潮或转折，但整体故事仍可继续
6. **必须写出新的剧情发展**，有新的动作、新的场景变化、新的身体反应
7. 结尾给出两个选择（每条10字以内）
8. 格式：
【故事】
（内容）

【选项】
1. xxx
2. xxx

**注意**：你**必须**写出与之前不同的新剧情！`;

        try {
            this._showLoading('正在生成故事...');
            
            const plugin = PluginSystem.get('story-config');
            let systemPrompt = '';
            
            if (plugin && plugin.getWorldSystemPrompt) {
                systemPrompt = plugin.getWorldSystemPrompt(world.id) || '';
            }
            
            const result = await ai.call(prompt, {
                system: systemPrompt,
                temperature: 0.8
            });
            
            this._hideLoading();
            
            this._currentRound++;
            this._storyScenes.push({
                round: this._currentRound,
                content: result,
                choice: choice
            });
            
            this._renderStoryUI();
            
        } catch (e) {
            this._hideLoading();
            console.error('[小故事] 生成失败:', e);
            alert('生成失败: ' + e.message);
        }
    },
    
    _renderStoryUI() {
        const main = document.getElementById('mainContent');
        if (!main) return;
        
        const world = Data.getCurrentWorld();
        const chars = this._characters;
        
        let scenesHtml = this._storyScenes.map((s, index) => {
            let content = s.content;
            let optionsHtml = '';
            
            const optionsMatch = content.match(/【选项】([\s\S]*)/);
            if (optionsMatch) {
                content = content.replace(/【选项】[\s\S]*/, '').trim();
                const optionsText = optionsMatch[1];
                const options = optionsText.split('\n').filter(o => o.trim());
                
                if (index === this._storyScenes.length - 1) {
                    optionsHtml = `
                        <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
                            ${options.map((opt, i) => {
                                const optText = opt.replace(/^\d+[\.、]\s*/, '').trim();
                                return `<button class="btn" onclick="SimpleStoryPlugin.makeChoice('${optText.replace(/'/g, "\\'")}')" style="text-align: left;">${opt}</button>`;
                            }).join('')}
                            <button class="btn btn-secondary" onclick="SimpleStoryPlugin.showCustomInput()" style="text-align: left;">✏️ 自定义</button>
                            <div id="simpleStoryCustomInput" style="display: none; margin-top: 8px;">
                                <input type="text" id="customChoiceText" placeholder="输入你的选择..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);" onkeypress="if(event.key==='Enter'){SimpleStoryPlugin.submitCustomChoice()}">
                                <button class="btn" onclick="SimpleStoryPlugin.submitCustomChoice()" style="margin-top: 8px;">确定</button>
                            </div>
                        </div>
                    `;
                }
                
                content = content.replace(/【故事】/, '').trim();
            }
            
            return `
                <div style="margin-bottom: 16px; padding: 16px; background: var(--card); border-radius: 8px;">
                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 8px;">第 ${s.round} 轮${s.tags ? ' · ' + s.tags.map(t => t.title).join(', ') : ''}</div>
                    <div style="line-height: 1.8; white-space: pre-wrap;">${content}</div>
                    ${optionsHtml}
                </div>
            `;
        }).join('');
        
        const tagsText = this._currentStoryTags && this._currentStoryTags.length > 0 ? this._currentStoryTags.map(t => t.title).join(', ') : '随机词条';
        
        const isFirstRound = this._currentRound === 0;
        
        main.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2>⚡ 小故事</h2>
                    <p class="desc">${world.name} · ${chars.map(c => c.name).join(', ')}</p>
                </div>
                <button class="btn btn-secondary" onclick="SimpleStoryPlugin.endStory()">🏁 结束</button>
            </div>
            
            <div style="margin-bottom: 16px; padding: 12px; background: var(--card); border-radius: 8px;">
                <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 8px;">🎯 词条: ${tagsText}</div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <span style="color: var(--accent); font-size: 0.85rem;">⚡ 开始</span>
                </div>
                <div style="height: 3px; background: var(--bg); border-radius: 2px; overflow: hidden;">
                    <div style="height: 100%; background: linear-gradient(90deg, #ff69b4, #ff1493); width: ${isFirstRound ? '30%' : '100%'}; transition: width 0.5s;"></div>
                </div>
            </div>
            
            <div id="simpleStoryScenes">
                ${scenesHtml}
            </div>
            
            ${this._currentRound > 0 ? `
            <div style="margin-top: 16px;">
                <div style="height: 3px; background: var(--bg); border-radius: 2px; overflow: hidden; margin-bottom: 8px;">
                    <div style="height: 100%; background: linear-gradient(90deg, #ff69b4, #ff1493); width: 100%;"></div>
                </div>
                <div style="text-align: center;">
                    <span style="color: var(--accent); font-size: 0.85rem; cursor: pointer;" onclick="SimpleStoryPlugin.endStory()">🏁 结束</span>
                </div>
            </div>
            ` : ''}
            
            <div id="simpleStoryLoading" style="display: none; text-align: center; padding: 20px;">
            </div>
        `;
    },
    
    _showLoading() {
        const progress = document.getElementById('simpleStoryProgress');
        if (progress) {
            progress.style.width = '60%';
        }
        
        const loading = document.getElementById('simpleStoryLoading');
        if (loading) {
            loading.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="color: var(--text-dim);">⏳ 故事生成中...</div>
                </div>
            `;
            loading.style.display = 'block';
        }
        
        this._animateProgress();
    },
    
    _animateProgress() {
        const progress = document.getElementById('simpleStoryProgress');
        if (!progress) return;
        
        if (this._progressInterval) {
            clearInterval(this._progressInterval);
        }
        
        let width = 60;
        this._progressInterval = setInterval(() => {
            width += Math.random() * 10;
            if (width > 90) width = 90;
            progress.style.width = width + '%';
        }, 500);
    },
    
    _hideLoading() {
        if (this._progressInterval) {
            clearInterval(this._progressInterval);
            this._progressInterval = null;
        }
        const progress = document.getElementById('simpleStoryProgress');
        if (progress) progress.style.width = '100%';
        
        setTimeout(() => {
            const loading = document.getElementById('simpleStoryLoading');
            if (loading) loading.style.display = 'none';
        }, 300);
    },
    
    makeChoice(choice) {
        this._continueStory(choice);
    },
    
    showCustomInput() {
        const inputDiv = document.getElementById('simpleStoryCustomInput');
        if (inputDiv) {
            inputDiv.style.display = inputDiv.style.display === 'none' ? 'block' : 'none';
            if (inputDiv.style.display !== 'none') {
                setTimeout(() => {
                    const input = document.getElementById('customChoiceText');
                    if (input) input.focus();
                }, 100);
            }
        }
    },
    
    submitCustomChoice() {
        const input = document.getElementById('customChoiceText');
        if (!input) return;
        
        const text = input.value.trim();
        if (!text) {
            alert('请输入你的选择');
            return;
        }
        
        const inputDiv = document.getElementById('simpleStoryCustomInput');
        if (inputDiv) inputDiv.style.display = 'none';
        
        input.value = '';
        
        this._continueStory(text);
    },
    
    endStory() {
        if (!confirm('确定要结束当前小故事吗？')) return;
        
        this._currentStoryTags = null;
        this._isRunning = false;
        this._storyScenes = [];
        this._currentRound = 0;
        
        showPage('simple-story');
    },
    
    isRunning() {
        return this._isRunning;
    }
});

window.SimpleStoryPlugin = null;
setTimeout(() => {
    const plugin = PluginSystem.get('simple-story');
    if (plugin) {
        window.SimpleStoryPlugin = plugin;
    }
}, 500);
