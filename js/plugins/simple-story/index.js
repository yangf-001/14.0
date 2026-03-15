PluginSystem.register('simple-story', {
    description: '简单故事模式 - 减少API提示词和输出内容，加快剧情速度',
    features: ['独立界面', '词条随机抽取', '可继续的故事', '选项选择', '详细动作描写'],
    
    _userContentPath: './js/plugins/simple-story/user-content',
    _categories: ['姿势', '表情', '服装', '玩法', '道具', '节日', '挑战', '异族娘'],
    _loadedTags: {},
    _currentStoryTags: null,
    _usedTagIds: [],
    _isRunning: false,
    _worldId: null,
    _characters: null,
    _storyScenes: [],
    _currentRound: 0,
    _storageKey: 'simple_story_tags',
    
    // 硬编码文件路径，避免依赖目录索引
    _categoryFiles: {
        '姿势': [
            '01_基础体位.txt', '02_后入体位.txt', '03_传教士体位.txt', '04_女上位.txt', '05_69姿势.txt',
            '06_站立姿势.txt', '07_侧卧姿势.txt', '08_椅子姿势.txt', '09_桌面姿势.txt', '10_浴室姿势.txt',
            '11_沙发姿势.txt', '12_床铺姿势.txt', '13_户外姿势.txt', '14_楼梯姿势.txt', '15_椅子姿势.txt',
            '16_厨房姿势.txt', '17_组合姿势.txt', '18_按摩姿势.txt', '19_口交姿势.txt', '20_后庭姿势.txt'
        ],
        '表情': [
            '01_含羞.txt', '02_期待.txt', '03_享受.txt', '04_痛苦.txt', '05_惊讶.txt',
            '06_拒绝.txt', '07_舒服.txt', '08_陶醉.txt', '09_迷恋.txt', '10_慵懒.txt',
            '11_紧张.txt', '12_别扭.txt', '13_哭泣.txt', '14_挑逗.txt', '15_浪叫.txt',
            '16_酥麻.txt', '17_高潮.txt', '18_失神.txt', '19_幸福.txt', '20_勾引.txt'
        ],
        '服装': [
            '01_露乳服装设计.txt', '02_情趣服装.txt', '03_服装设计.txt', '04_反差服装.txt', '05_角色扮演服装.txt',
            '06_丝袜系列.txt', '07_紧身乳胶衣.txt', '08_水手海军风格.txt', '09_和服浴衣.txt', '10_情趣睡裙.txt',
            '11_情趣套装.txt', '12_情趣胸罩.txt', '13_丁字裤系列.txt', '14_情趣泳装.txt', '15_派对服装.txt',
            '16_女王服装.txt', '17_囚犯服装.txt', '18_动漫角色.txt', '19_圣诞节日.txt', '20_贵族服饰.txt'
        ],
        '玩法': [
            '01_SM束缚玩法.txt', '02_户外公共玩法.txt', '03_鬼魂主题玩法.txt', '04_角色扮演玩法.txt', '05_校园缩小玩法.txt',
            '06_校园情景玩法.txt', '07_奇幻魔法玩法.txt', '08_公共场所玩法.txt', '09_角色扮演日常玩法.txt', '10_羞耻日常玩法.txt',
            '11_户外自然玩法.txt', '12_自慰场景玩法.txt', '13_隐蔽自慰玩法.txt', '14_日常训练挑战.txt', '15_乳交玩法.txt',
            '16_口交技巧.txt', '17_颜射内射.txt', '18_潮吹喷水.txt', '19_调教指令.txt', '20_放置惩罚.txt',
            '21_户外自慰.txt', '22_公共场合自慰.txt', '23_壁尻.txt', '24_火车旅行.txt', '25_露出直播.txt',
            '26_公共物品自慰.txt', '27_远程控制.txt', '28_伴侣辅助.txt', '29_公共厕所.txt', '30_地铁肉便器.txt',
            '31_路人诱惑直播.txt', '32_日常露出.txt', '33_随机路人诱惑.txt', '34_次日精液罐.txt', '35_露出挑逗直播.txt',
            '36_半公共辅助.txt', '37_公共场合辅助.txt', '38_极端火车.txt', '39_直播互动.txt', '40_壁尻精液罐.txt',
            '41_声音露出玩法.txt', '42_动物扮演玩法.txt', '43_光荣洞玩法.txt', '44_失禁玩法.txt', '45_闷骚日常玩法.txt',
            '46_运动裸体玩法.txt', '47_超能力玩法.txt', '48_常识错乱玩法.txt', '49_异物插入玩法.txt', '50_食物玩法.txt',
            '51_公共场所任务玩法.txt', '52_色气世界观.txt', '53_职场运动玩法.txt', '54_隔音场所玩法.txt', '55_职业任务玩法.txt',
            '56_路人参与玩法.txt', '57_重口味体液玩法.txt', '58_气味玩法.txt', '59_尾巴肛塞玩法.txt', '60_产卵玩法.txt',
            '61_无意识露出玩法.txt', '62_职业尿失禁玩法.txt', '63_深夜场所玩法.txt', '64_自我监听玩法.txt', '65_重口味体液玩法2.txt',
            '66_动物参与玩法.txt', '67_纯幻想奇幻玩法.txt', '68_痔疮肛交玩法.txt', '69_尿失禁口交玩法.txt', '70_巧合道具插入玩法.txt',
            '71_传承道具玩法.txt', '72_露出任务玩法.txt', '73_洞猜游戏玩法.txt', '74_懵懂性教育玩法.txt', '75_男性性教育玩法.txt',
            '76_车多人玩法.txt', '77_无意识隐性色情玩法.txt', '78_超级柔韧玩法.txt', '79_一男多女玩法.txt', '80_家庭禁忌玩法.txt'
        ],
        '道具': [
            '01_入门级按摩棒.txt', '02_基础入门款.txt', '03_跳蛋系列.txt', '04_乳夹系列.txt', '05_乳夹震动.txt',
            '06_阴蒂玩具.txt', '07_肛塞系列.txt', '08_仿真阴茎.txt', '09_辅助道具.txt', '10_润滑液.txt',
            '11_飞机杯.txt', '12_夹子系列.txt', '13_辅助工具.txt', '14_缩阴球.txt', '15_后庭训练.txt',
            '16_人形道具.txt', '17_疼痛道具.txt', '18_辅助器具.txt', '19_乳胶系列.txt', '20_清洁配件.txt',
            '21_套装组合.txt'
        ],
        '节日': [
            '01_情人节.txt', '02_七夕节.txt', '03_圣诞节.txt', '04_元旦.txt', '05_春节.txt',
            '06_元宵节.txt', '07_白色情人节.txt', '08_520网络情人节.txt', '09_生日.txt', '10_纪念日.txt',
            '11_万圣节.txt', '12_感恩节.txt', '13_复活节.txt', '14_愚人节.txt', '15_劳动节.txt',
            '16_国庆节.txt', '17_中秋节.txt', '18_端午节.txt', '19_儿童节.txt', '20_平安夜.txt'
        ],
        '挑战': [
            '01_30秒挑战.txt', '02_1分钟挑战.txt', '03_5分钟挑战.txt', '04_高潮挑战.txt', '05_连续高潮挑战.txt',
            '06_延时挑战.txt', '07_不射挑战.txt', '08_姿势数量挑战.txt', '09_言语挑战.txt', '10_公共场所挑战.txt',
            '11_水下挑战.txt', '12_蒙眼挑战.txt', '13_禁言挑战.txt', '14_捆绑挑战.txt', '15_冰火挑战.txt',
            '16_静音挑战.txt', '17_站立挑战.txt', '18_负重挑战.txt', '19_24小时挑战.txt', '20_终极挑战.txt'
        ],
        '异族娘': [
            '01_狐妖娘.txt', '02_猫娘.txt', '03_兔娘.txt', '04_龙娘.txt', '05_人鱼娘.txt',
            '06_精灵娘.txt', '07_天使娘.txt', '08_恶魔娘.txt', '09_女仆娘.txt', '10_蜥蜴娘.txt',
            '11_蛇娘.txt', '12_蝴蝶娘.txt', '13_狼娘.txt', '14_豹娘.txt', '15_鹰娘.txt',
            '16_蜘蛛娘.txt', '17_兔子娘.txt', '18_狐狸娘.txt', '19_南瓜娘.txt', '20_猫头鹰娘.txt'
        ]
    },
    
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
            return;
        }
        
        // 尝试从网络加载
        const promises = this._categories.map(cat => this._loadCategoryTags(cat));
        await Promise.all(promises);
        
        // 如果网络加载后数据为空，使用离线数据
        if (!this._hasCachedData()) {
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
        this._loadedTags = {};
    },
    
    async _loadCategoryTags(category) {
        if (this._loadedTags[category]) {
            return this._loadedTags[category];
        }
        
        const tags = [];
        try {
            const files = this._categoryFiles[category] || [];
            
            for (const fileName of files) {
                const fullPath = `${this._userContentPath}/${category}/${fileName}`;
                try {
                    const fileResponse = await fetch(fullPath);
                    if (fileResponse.ok) {
                        const fileContent = await fileResponse.text();
                        const items = this._parseTagFile(fileContent);
                        tags.push(...items);
                    }
                } catch (e) {
                    console.warn(`[小故事] 加载文件失败: ${fullPath}`, e);
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
    
    _getRandomTags(count = 4) {
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
                const availableTags = tags.filter(t => !this._usedTagIds.includes(t.title));
                const tagPool = availableTags.length > 0 ? availableTags : tags;
                const randomIndex = Math.floor(Math.random() * tagPool.length);
                const tag = tagPool[randomIndex];
                result.push({
                    category: category,
                    title: tag.title,
                    description: tag.description
                });
                if (!this._usedTagIds.includes(tag.title)) {
                    this._usedTagIds.push(tag.title);
                }
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
        this._usedTagIds = [];
        
        await this._loadAllCategoryData();
        
        const tags = this._getRandomTags(4);
        this._currentStoryTags = tags;
        
        await this._renderStartStory(tags);
    },
    
    async _renderStartStory(tags) {
        const world = Data.getCurrentWorld();
        const chars = this._characters;
        const charNames = chars.map(c => c.name).join('、');
        
        const tagsText = tags && tags.length > 0 ? tags.map(t => t.title).join(', ') : '随机词条';
        
        this._renderInitialUI(tagsText);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const promptManager = window.PromptManagerPlugin;
        
        if (!promptManager) {
            throw new Error('提示词管理插件未加载');
        }
        
        const variables = {
            '角色列表': charNames,
            '角色JSON': JSON.stringify(chars, null, 2),
            '角色详情': chars.map(c => {
                const profile = c.profile || {};
                return `${c.name}：性格${profile.personality || '暂无'}，外表${profile.appearance || '暂无'}，背景${profile.backstory || '暂无'}`;
            }).join('\n'),
            '场景': '私密场所',
            '词条': tags.map(t => t.title.split('：')[0]).slice(0, 3).join('、'),
            '标签详情': tags.map(t => t.title).join('\n'),
            '标签分类': tags.map(t => t.category || '未知').join('、')
        };
        
        const prompt = promptManager.getTemplateWithPreset('simpleStory', 'default', variables);

        try {
            this._showLoading();
            
            const result = await ai.call(prompt, {
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
        if (!chars || chars.length === 0) {
            alert('故事会话已失效，请重新开始故事');
            this.endStory();
            return;
        }
        const charNames = chars.map(c => c.name).join('、');
        
        const historyText = this._storyScenes.map(s => s.content).join('\n\n---\n\n');
        
        const lastContent = this._storyScenes.length > 0 
            ? this._storyScenes[this._storyScenes.length - 1].content 
            : '';
        
        const promptManager = window.PromptManagerPlugin;
        
        if (!promptManager) {
            throw new Error('提示词管理插件未加载');
        }
        
        const prompt = promptManager.getTemplateWithPreset('simpleStory', 'continue', {
            '角色列表': charNames,
            '角色JSON': JSON.stringify(chars, null, 2),
            '角色详情': chars.map(c => {
                const profile = c.profile || {};
                return `${c.name}：性格${profile.personality || '暂无'}，外表${profile.appearance || '暂无'}，背景${profile.backstory || '暂无'}`;
            }).join('\n'),
            '用户选择': choice,
            '之前的故事': historyText,
            '上一段结尾': lastContent
        });

        try {
            this._showLoading('正在生成故事...');
            
            const result = await ai.call(prompt, {
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
        
        if (!chars || chars.length === 0) {
            main.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h2>故事会话已失效</h2>
                    <p>请重新开始故事</p>
                    <button class="btn" onclick="showPage('simple-story')">返回首页</button>
                </div>
            `;
            return;
        }
        
        let scenesHtml = this._storyScenes.map((s, index) => {
            let content = s.content;
            let optionsHtml = '';
            
            const optionsMatch = content.match(/选项[1-2]（([^）]+)）[：:]\s*(.+)/g);
            if (optionsMatch) {
                const options = [];
                for (const match of optionsMatch) {
                    const regex = /选项([1-2])（([^）]+)）[：:]\s*(.+)/;
                    const m = match.match(regex);
                    if (m) {
                        options.push({ type: m[2].trim(), text: m[3].trim() });
                    }
                }
                
                content = content.replace(/选项[1-2]（[^）]+）[：:][\s\S]*?(?=选项|$)/g, '').trim();
                content = content.replace(/【故事】/, '').trim();
                
                if (index === this._storyScenes.length - 1 && options.length > 0) {
                    optionsHtml = `
                        <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
                            ${options.map((opt, i) => {
                                return `<button class="btn" onclick="SimpleStoryPlugin.makeChoice('${opt.text.replace(/'/g, "\\'")}')" style="text-align: left;">选项${i+1}（${opt.type}）：${opt.text}</button>`;
                            }).join('')}
                            <button class="btn btn-secondary" onclick="SimpleStoryPlugin.showCustomInput()" style="text-align: left;">✏️ 自定义</button>
                            <div id="simpleStoryCustomInput" style="display: none; margin-top: 8px;">
                                <input type="text" id="customChoiceText" placeholder="输入你的选择..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);" onkeypress="if(event.key==='Enter'){SimpleStoryPlugin.submitCustomChoice()}">
                                <button class="btn" onclick="SimpleStoryPlugin.submitCustomChoice()" style="margin-top: 8px;">确定</button>
                            </div>
                        </div>
                    `;
                }
            } else if (index === this._storyScenes.length - 1) {
                optionsHtml = `
                    <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
                        <button class="btn" onclick="SimpleStoryPlugin.makeChoice('继续故事')" style="text-align: left;">继续故事</button>
                        <button class="btn btn-secondary" onclick="SimpleStoryPlugin.showCustomInput()" style="text-align: left;">✏️ 自定义</button>
                        <div id="simpleStoryCustomInput" style="display: none; margin-top: 8px;">
                            <input type="text" id="customChoiceText" placeholder="输入你的选择..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);" onkeypress="if(event.key==='Enter'){SimpleStoryPlugin.submitCustomChoice()}">
                            <button class="btn" onclick="SimpleStoryPlugin.submitCustomChoice()" style="margin-top: 8px;">确定</button>
                        </div>
                    </div>
                `;
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
        
        this._characters = null;
        this._worldId = null;
        this._currentStoryTags = null;
        this._isRunning = false;
        this._storyScenes = [];
        this._currentRound = 0;
        this._usedTagIds = [];
        
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
