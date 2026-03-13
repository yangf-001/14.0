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
        // 先尝试从缓存加载
        if (this._hasCachedData()) {
            console.log('[小故事] 使用缓存的素材库');
            return;
        }
        
        // 尝试从网络加载
        const promises = this._categories.map(cat => this._loadCategoryTags(cat));
        await Promise.all(promises);
        
        // 如果网络加载后数据为空，使用离线数据
        if (!this._hasCachedData()) {
            console.log('[小故事] 网络加载失败，使用离线素材库');
            this._loadOfflineData();
        }
        
        this._saveToStorage();
    },
    
    _hasCachedData() {
        for (const cat of this._categories) {
            if (this._loadedTags[cat] && this._loadedTags[cat].length > 0) {
                return true;
            }
        }
        return false;
    },
    
    _loadOfflineData() {
        const offlineTags = {
            '姿势': [
                { title: '基础体位', description: '经典的传教士体位，面对面交流情感' },
                { title: '后入式', description: '从后方进入的体位' },
                { title: '女上位', description: '女性主导的骑乘体位' },
                { title: '69式', description: '相互取悦的体位' },
                { title: '站立式', description: '站立姿势的亲密接触' },
                { title: '侧卧式', description: '侧身躺着的亲密姿势' },
                { title: '椅子式', description: '坐在椅子上的姿势' },
                { title: '桌面式', description: '在桌面上的姿势' },
                { title: '浴室式', description: '在浴室中的姿势' },
                { title: '沙发式', description: '在沙发上的姿势' },
                { title: '床铺式', description: '在床上标准姿势' },
                { title: '户外式', description: '在户外公共场所的姿势' },
                { title: '楼梯式', description: '在楼梯上的姿势' },
                { title: '厨房式', description: '在厨房中的姿势' },
                { title: '按摩式', description: '带有按摩的亲密姿势' }
            ],
            '表情': [
                { title: '含羞', description: '脸红害羞的表情' },
                { title: '期待', description: '充满期待的眼神' },
                { title: '享受', description: '沉浸在愉悦中的表情' },
                { title: '痛苦', description: '痛苦中带有快感的表情' },
                { title: '惊讶', description: '惊讶的表情' },
                { title: '拒绝', description: '想要拒绝的表情' },
                { title: '舒服', description: '感到舒服的表情' },
                { title: '陶醉', description: '陶醉其中的表情' },
                { title: '迷恋', description: '迷恋的表情' },
                { title: '慵懒', description: '慵懒满足的表情' },
                { title: '紧张', description: '紧张的表情' },
                { title: '挑逗', description: '挑逗的表情' },
                { title: '浪叫', description: '忘我的叫声' },
                { title: '高潮', description: '高潮时的表情' },
                { title: '失神', description: '失神的表情' }
            ],
            '服装': [
                { title: '情趣内衣', description: '性感的情趣内衣' },
                { title: '女仆装', description: '可爱的女仆装' },
                { title: 'JK制服', description: 'jk制服' },
                { title: '丝袜', description: '黑丝或肉丝' },
                { title: '浴衣', description: '日式浴衣' },
                { title: '睡裙', description: '性感睡裙' },
                { title: '泳装', description: '泳装' },
                { title: '紧身衣', description: '紧身乳胶衣' },
                { title: '角色扮演', description: '各种角色扮演服装' },
                { title: '情趣套装', description: '情趣内衣套装' },
                { title: '女王装', description: '女王风格服装' },
                { title: '圣诞装', description: '圣诞主题服装' },
                { title: '空姐装', description: '空姐制服' },
                { title: '护士装', description: '护士制服' },
                { title: '情趣旗袍', description: '性感旗袍' }
            ],
            '玩法': [
                { title: '前戏', description: '充分的前戏调情' },
                { title: '口交', description: '口交技巧' },
                { title: '指交', description: '手指技巧' },
                { title: '乳交', description: '乳交技巧' },
                { title: '足交', description: '足交技巧' },
                { title: '按摩', description: '按摩助兴' },
                { title: '角色扮演', description: '角色扮演play' },
                { title: 'SM', description: 'sm调教' },
                { title: '羞耻Play', description: '羞耻Play' },
                { title: '放置', description: '放置Play' },
                { title: '捆绑', description: '捆绑技巧' },
                { title: '乳夹', description: '使用乳夹' },
                { title: '跳蛋', description: '跳蛋Play' },
                { title: '按摩棒', description: '按摩棒Play' },
                { title: '颜射', description: '颜射' }
            ],
            '道具': [
                { title: '按摩棒', description: '电动按摩棒' },
                { title: '跳蛋', description: '跳蛋' },
                { title: '乳夹', description: '乳夹' },
                { title: '飞机杯', description: '飞机杯' },
                { title: '润滑液', description: '润滑液' },
                { title: '肛塞', description: '肛塞' },
                { title: '乳胶衣', description: '乳胶衣' },
                { title: '眼罩', description: '眼罩' },
                { title: '手铐', description: '手铐' },
                { title: '绳子', description: '绳子' },
                { title: '蜡烛', description: '蜡烛' },
                { title: '羽毛', description: '羽毛' },
                { title: '皮带', description: '皮带' },
                { title: '项圈', description: '项圈' },
                { title: '乳胶手套', description: '乳胶手套' }
            ],
            '节日': [
                { title: '情人节', description: '情人节特别情节' },
                { title: '七夕', description: '七夕情人节' },
                { title: '圣诞', description: '圣诞节' },
                { title: '元旦', description: '元旦新年' },
                { title: '春节', description: '春节' },
                { title: '生日', description: '生日惊喜' },
                { title: '纪念日', description: '恋爱纪念日' },
                { title: '万圣节', description: '万圣节' },
                { title: '520', description: '网络情人节' },
                { title: '白色情人节', description: '白色情人节' },
                { title: '中秋节', description: '中秋节' },
                { title: '平安夜', description: '平安夜' },
                { title: '愚人节', description: '愚人节' },
                { title: '国庆节', description: '国庆节' },
                { title: '劳动节', description: '劳动节' }
            ],
            '挑战': [
                { title: '30秒挑战', description: '30秒内完成任务' },
                { title: '1分钟挑战', description: '1分钟内完成任务' },
                { title: '5分钟挑战', description: '5分钟内完成任务' },
                { title: '高潮挑战', description: '多次高潮挑战' },
                { title: '连续高潮', description: '连续高潮挑战' },
                { title: '延时挑战', description: '延时挑战' },
                { title: '不射挑战', description: '不射精挑战' },
                { title: '姿势挑战', description: '多种姿势挑战' },
                { title: '言语挑战', description: '言语挑逗挑战' },
                { title: '公共场所', description: '公共场所挑战' },
                { title: '水下挑战', description: '水下挑战' },
                { title: '蒙眼挑战', description: '蒙眼挑战' },
                { title: '禁言挑战', description: '禁言挑战' },
                { title: '站立挑战', description: '站立挑战' },
                { title: '负重挑战', description: '负重挑战' }
            ],
            '异族娘': [
                { title: '狐妖娘', description: '狐狸精少女' },
                { title: '猫娘', description: '猫耳少女' },
                { title: '兔娘', description: '兔耳少女' },
                { title: '龙娘', description: '龙女' },
                { title: '人鱼娘', description: '人鱼少女' },
                { title: '精灵娘', description: '精灵少女' },
                { title: '天使娘', description: '天使少女' },
                { title: '恶魔娘', description: '恶魔少女' },
                { title: '女仆娘', description: '女仆少女' },
                { title: '狼娘', description: '狼耳少女' },
                { title: '蛇娘', description: '蛇女' },
                { title: '蝴蝶娘', description: '蝴蝶少女' },
                { title: '蜘蛛娘', description: '蜘蛛少女' },
                { title: '蜥蜴娘', description: '蜥蜴少女' },
                { title: '豹娘', description: '豹耳少女' }
            ]
        };
        
        this._loadedTags = offlineTags;
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
        
        const promptManager = window.PromptManagerPlugin;
        
        if (!promptManager) {
            throw new Error('提示词管理插件未加载');
        }
        
        const prompt = promptManager.getTemplateWithPreset('simpleStory', 'default', {
            '角色列表': charNames,
            '词条': tags.map(t => t.title).join('、')
        });

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
        
        const promptManager = window.PromptManagerPlugin;
        
        if (!promptManager) {
            throw new Error('提示词管理插件未加载');
        }
        
        const prompt = promptManager.getTemplateWithPreset('storyChoice', 'default', {
            '用户选择': choice,
            '上下文': `之前的故事：\n${historyText}\n\n上一段故事的结尾：\n${lastContent}`
        });

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
