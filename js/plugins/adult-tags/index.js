PluginSystem.register('adult-tags', {
    description: '成人标签/玩法系统 - 管理兴奋值、尺度控制和成人标签库',
    features: ['兴奋值管理', '尺度控制', '标签库', '冷却机制', '玩法选择', '选项分级'],

    init() {
        console.log('Adult-tags plugin loaded');
        window.AdultTagsPlugin = this;
        this._initDefaultSettings();
        this._initTagLibrary();
        this._initChoiceTemplates();
    },

    _initDefaultSettings() {
        const defaultSettings = {
            enabled: true,
            excitementIncrease: 15,
            cooldownCount: 3,
            defaultScale: '中',
            scales: ['轻', '中', '重', '极限'],
            userConfirm: true
        };

        if (!localStorage.getItem('adult_tags_settings')) {
            localStorage.setItem('adult_tags_settings', JSON.stringify(defaultSettings));
        }
    },

    _initTagLibrary() {
        this._loadTagsFromFile();
    },

    _initChoiceTemplates() {
        this._choiceTemplates = {
            '1': {
                explicitness: '低',
                template: `【成人选项】当前阶段：暧昧挑逗期（轻度淫靡）
尺度：非常克制，仅限心理与轻微肢体接触

请生成3个让用户选择的剧情分支选项。

要求：
- 所有选项必须保持暧昧、挑逗、性张力逐步积累
- 严禁出现任何性器官名称、裸露、插入、高潮、潮吹等直接描写
- 使用含蓄但色情的语言（脸红、心跳加速、呼吸紊乱、指尖轻颤、耳边低语、衣料滑落、身体发热等）
- 每个选项都应自然暗示下一步可能的亲密升级，但绝不跨越界限

输出格式（只输出三行选项，无其他文字）：
1. [选项描述]
2. [选项描述]
3. [选项描述]`
            },
            '2': {
                explicitness: '中',
                template: `【成人选项】当前阶段：肉体交缠期（中度淫乱）
尺度：允许直接触碰性敏感区、前戏、口交、指交、初次插入等

请生成3个让用户选择的剧情分支选项。

要求：
- 选项必须包含明确的性行为开始或过程描写
- 可使用半露骨词汇（鸡巴、骚穴、湿透、龟头、淫水、舔弄、抽插、紧致等）
- 但禁止极端高潮描写、潮吹失禁、连续内射、肉便器化等
- 每个选项带来明显的快感递增与身体反应

输出格式（只输出三行选项，无其他文字）：
1. [选项描述]
2. [选项描述]
3. [选项描述]`
            },
            '3': {
                explicitness: '高',
                template: `【成人选项】当前阶段：高潮崩坏期（高度淫靡）
尺度：允许激烈抽插、内射、潮吹、强制高潮、大量脏话与羞辱

请生成3个让用户选择的剧情分支选项。

要求：
- 选项要极具冲击力，包含强烈生理快感与精神崩溃描写
- 大量使用下流直接语言、拟声词（啪啪、咕啾、噗滋）、脏话、求饶/命令对话
- 体现角色在快感中逐渐失控、尖叫、痉挛、喷水等
- 可涉及姿势变换、连续高潮、轻度疼痛快感

输出格式（只输出三行选项，无其他文字）：
1. [选项描述]
2. [选项描述]
3. [选项描述]`
            },
            '4': {
                explicitness: '极高',
                template: `【成人选项】当前阶段：极致堕落期（极限淫乱）
尺度：无任何上限，允许极端、变态、成瘾式、超现实描写

请生成3个让用户选择的剧情分支选项。

要求：
- 选项必须展现彻底的肉体与精神堕落
- 使用最下流、最病态的语言（肉便器、子宫灌满、精液容器、意识融化、孕肚鼓起、永久标记等）
- 可包含超现实元素（魔法分身、多重插入、连续多日性爱、彻底成瘾）
- 角色主动求虐、淫荡展示、完全放弃尊严与羞耻

输出格式（只输出三行选项，无其他文字）：
1. [选项描述]
2. [选项描述]
3. [选项描述]`
            }
        };
        console.log('[成人选项] 已加载内置选项模板:', Object.keys(this._choiceTemplates).length, '个等级');
    },

    getChoiceTemplate(excitement = null, worldId = null, charId = null) {
        const stats = this.getAllStats(worldId, charId);
        const arousal = excitement !== null ? excitement : stats.arousal;
        const stage = this.getStage(arousal, worldId, charId);
        
        if (!this._choiceTemplates) {
            return null;
        }
        
        return this._choiceTemplates[String(stage)] || null;
    },

    buildChoicePrompt(content, characters, worldId = null, charId = null) {
        const template = this.getChoiceTemplate(null, worldId, charId);
        if (!template || !template.template) {
            return null;
        }
        
        const stats = this.getAllStats(worldId, charId);
        const stage = this.getStage(stats.arousal, worldId, charId);
        const scale = this.getScale(worldId);
        
        const charNames = characters.map(c => c.name).join('、');
        
        let prompt = template.template;
        prompt = prompt.replace('[内容摘要]', content);
        prompt = prompt.replace('[故事内容]', content);
        prompt = prompt.replace('[角色列表]', charNames);
        prompt = prompt.replace('[角色]', charNames);
        prompt = prompt.replace('[兴奋值]', stats.arousal);
        prompt = prompt.replace('[亲密度]', stats.intimacy);
        prompt = prompt.replace('[经验值]', stats.experience);
        prompt = prompt.replace('[意愿度]', stats.willingness);
        prompt = prompt.replace('[阶段]', stage);
        prompt = prompt.replace('[尺度]', scale);
        
        return prompt;
    },

    async _loadTagsFromFile() {
        // 标记是否正在加载
        this._isLoadingTags = true;
        
        // 监听页面卸载事件，避免在加载过程中离开页面导致刷新
        const handleBeforeUnload = () => {
            if (this._isLoadingTags) {
                // 取消所有未完成的fetch请求
                if (this._abortController) {
                    this._abortController.abort();
                }
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        try {
            // 创建AbortController用于取消请求
            this._abortController = new AbortController();
            const signal = this._abortController.signal;
            
            const allTags = [];
            const loadedPaths = [];
            
            const getUserContentPath = () => {
                // 尝试多种方法获取路径
                // 方法1: 使用document.currentScript
                const script = document.currentScript;
                if (script && script.src) {
                    const scriptUrl = new URL(script.src);
                    const pluginDir = scriptUrl.pathname.replace(/[^/]*$/, '');
                    return pluginDir + 'user-content/';
                }
                
                // 方法2: 查找包含adult-tags的脚本
                const scripts = document.getElementsByTagName('script');
                for (let s of scripts) {
                    if (s.src && s.src.includes('adult-tags')) {
                        const scriptUrl = new URL(s.src);
                        const pluginDir = scriptUrl.pathname.replace(/[^/]*$/, '');
                        return pluginDir + 'user-content/';
                    }
                }
                
                // 方法3: 使用相对路径（最可靠）
                return 'js/plugins/adult-tags/user-content/';
            };
            
            const userContentPath = getUserContentPath();
            
            const tagLibraryPaths = [];
            for (let i = 1; i <= 32; i++) {
                tagLibraryPaths.push(userContentPath + i + '.txt');
            }

            for (const path of tagLibraryPaths) {
                // 检查是否已被取消
                if (signal.aborted) break;
                
                try {
                    const response = await fetch(path, { signal });
                    if (response && response.ok) {
                        const text = await response.text();
                        try {
                            const data = JSON.parse(text);
                            let tags = [];
                            if (data.tags && Array.isArray(data.tags)) {
                                tags = data.tags;
                            } else if (Array.isArray(data)) {
                                tags = data;
                            }
                            
                            if (tags.length > 0) {
                                allTags.push(...tags);
                                loadedPaths.push(path);
                                console.log('Adult tags loaded from:', path, 'count:', tags.length);
                            }
                        } catch (parseErr) {
                            console.warn('Failed to parse JSON from', path, parseErr);
                        }
                    }
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        console.warn('Failed to load tags from', path, e);
                    }
                }
            }

            if (allTags.length > 0) {
                this._tags = allTags;
                // 保存到localStorage，以便下次快速加载
                this._saveTagsToStorage();
                console.log('Total adult tags loaded:', allTags.length, 'from', loadedPaths.length, 'files');
                return;
            }

            const stored = localStorage.getItem('adult_tags_library');
            if (stored) {
                try {
                    this._tags = JSON.parse(stored);
                    console.log('Adult tags loaded from storage, count:', this._tags.length);
                    return;
                } catch (e) {
                    console.warn('Failed to parse stored tags', e);
                }
            }

            this._tags = [];
            console.log('Adult tags library empty, waiting for manual addition');
        } finally {
            // 标记加载完成
            this._isLoadingTags = false;
            // 移除事件监听器
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // 清理AbortController
            this._abortController = null;
        }
    },

    getSettings() {
        try {
            return JSON.parse(localStorage.getItem('adult_tags_settings')) || {};
        } catch {
            return { enabled: true, excitementIncrease: 15, cooldownCount: 3, defaultScale: '中' };
        }
    },

    saveSettings(settings) {
        localStorage.setItem('adult_tags_settings', JSON.stringify(settings));
    },

    getTagLibrary() {
        return this._tags || [];
    },

    addTag(tag) {
        if (!this._tags) this._tags = [];
        // 检查是否已存在相同内容的标签
        const existingTag = this._tags.find(t => t.内容 === tag.内容);
        if (existingTag) return false;
        tag.id = this._tags.length + 1;
        this._tags.push(tag);
        this._saveTagsToStorage();
        return true;
    },

    importTags(tags) {
        if (!this._tags) this._tags = [];
        let importedCount = 0;
        for (const tag of tags) {
            if (tag.内容) {
                const existingTag = this._tags.find(t => t.内容 === tag.内容);
                if (!existingTag) {
                    tag.id = this._tags.length + 1;
                    this._tags.push(tag);
                    importedCount++;
                }
            }
        }
        if (importedCount > 0) {
            this._saveTagsToStorage();
        }
        return importedCount;
    },

    removeTag(tagId) {
        if (!this._tags) return;
        this._tags = this._tags.filter(t => t.id !== tagId);
        this._saveTagsToStorage();
    },

    _saveTagsToStorage() {
        localStorage.setItem('adult_tags_library', JSON.stringify(this._tags));
    },

    getExcitement(worldId, charId = null) {
        try {
            const characters = Data.getCharacters(worldId);
            if (!characters || characters.length === 0) return 0;
            
            let targetChar;
            if (charId) {
                targetChar = characters.find(c => String(c.id) === String(charId));
            } else {
                targetChar = characters.find(c => c.isPlayer) || characters[0];
            }
            
            if (!targetChar || !targetChar.stats) return 0;
            
            return targetChar.stats.arousal || 0;
        } catch (e) {
            console.warn('[兴奋值] 读取失败', e);
            return 0;
        }
    },

    setExcitement(worldId, charId, value) {
        if (typeof charId === 'number' || typeof charId === 'string') {
            return this._setExcitementForChar(worldId, charId, value);
        } else {
            value = charId;
            return this._setExcitementForPlayer(worldId, value);
        }
    },

    _setExcitementForChar(worldId, charId, value) {
        try {
            const characters = Data.getCharacters(worldId);
            if (!characters || characters.length === 0) return 0;
            
            const targetChar = characters.find(c => String(c.id) === String(charId));
            if (!targetChar || !targetChar.stats) return 0;
            
            const clampedValue = Math.max(0, Math.min(100, value));
            targetChar.stats.arousal = clampedValue;
            
            Data.updateCharacter(worldId, targetChar.id, targetChar);
            console.log(`[兴奋值] 角色 ${targetChar.name} 兴奋值设为 ${clampedValue}`);
            return clampedValue;
        } catch (e) {
            console.warn('[兴奋值] 设置失败', e);
            return 0;
        }
    },

    _setExcitementForPlayer(worldId, value) {
        try {
            const characters = Data.getCharacters(worldId);
            if (!characters || characters.length === 0) return 0;
            
            const playerChar = characters.find(c => c.isPlayer) || characters[0];
            if (!playerChar || !playerChar.stats) return 0;
            
            const clampedValue = Math.max(0, Math.min(100, value));
            playerChar.stats.arousal = clampedValue;
            
            Data.updateCharacter(worldId, playerChar.id, playerChar);
            console.log(`[兴奋值] 主角 ${playerChar.name} 兴奋值设为 ${clampedValue}`);
            return clampedValue;
        } catch (e) {
            console.warn('[兴奋值] 设置失败', e);
            return 0;
        }
    },

    increaseExcitement(worldId, charId = null, amount = null) {
        const settings = this.getSettings();
        const increase = (amount !== null && amount !== undefined) ? amount : (settings.excitementIncrease || 15);
        
        if (charId === null || charId === undefined) {
            const current = this.getExcitement(worldId);
            return this.setExcitement(worldId, current + increase);
        } else {
            const current = this.getExcitement(worldId, charId);
            return this.setExcitement(worldId, charId, current + increase);
        }
    },

    getIntimacy(worldId, charId = null) {
        try {
            const characters = Data.getCharacters(worldId);
            if (!characters || characters.length === 0) return 0;
            
            let targetChar;
            if (charId) {
                targetChar = characters.find(c => String(c.id) === String(charId));
            } else {
                targetChar = characters.find(c => c.isPlayer) || characters[0];
            }
            
            if (!targetChar || !targetChar.stats) return 0;
            
            return targetChar.stats.intimacy || 0;
        } catch (e) {
            console.warn('[亲密度] 读取失败', e);
            return 0;
        }
    },

    setIntimacy(worldId, charId, value) {
        try {
            const characters = Data.getCharacters(worldId);
            if (!characters || characters.length === 0) return 0;
            
            let targetChar;
            if (typeof charId === 'number' || typeof charId === 'string') {
                targetChar = characters.find(c => String(c.id) === String(charId));
            } else {
                value = charId;
                targetChar = characters.find(c => c.isPlayer) || characters[0];
            }
            
            if (!targetChar || !targetChar.stats) return 0;
            
            const clampedValue = Math.max(0, Math.min(100, value));
            targetChar.stats.intimacy = clampedValue;
            
            Data.updateCharacter(worldId, targetChar.id, targetChar);
            console.log(`[亲密度] 角色 ${targetChar.name} 亲密度设为 ${clampedValue}`);
            return clampedValue;
        } catch (e) {
            console.warn('[亲密度] 设置失败', e);
            return 0;
        }
    },

    increaseIntimacy(worldId, charId = null, amount = 10) {
        if (charId === null || charId === undefined) {
            const current = this.getIntimacy(worldId);
            return this.setIntimacy(worldId, current + amount);
        } else {
            const current = this.getIntimacy(worldId, charId);
            return this.setIntimacy(worldId, charId, current + amount);
        }
    },

    getExperience(worldId, charId = null) {
        try {
            const characters = Data.getCharacters(worldId);
            if (!characters || characters.length === 0) return 0;
            
            let targetChar;
            if (charId) {
                targetChar = characters.find(c => String(c.id) === String(charId));
            } else {
                targetChar = characters.find(c => c.isPlayer) || characters[0];
            }
            
            if (!targetChar || !targetChar.stats) return 0;
            
            return targetChar.stats.experience || 0;
        } catch (e) {
            console.warn('[经验值] 读取失败', e);
            return 0;
        }
    },

    setExperience(worldId, charId, value) {
        try {
            const characters = Data.getCharacters(worldId);
            if (!characters || characters.length === 0) return 0;
            
            let targetChar;
            if (typeof charId === 'number' || typeof charId === 'string') {
                targetChar = characters.find(c => String(c.id) === String(charId));
            } else {
                value = charId;
                targetChar = characters.find(c => c.isPlayer) || characters[0];
            }
            
            if (!targetChar || !targetChar.stats) return 0;
            
            const clampedValue = Math.max(0, Math.min(100, value));
            targetChar.stats.experience = clampedValue;
            
            Data.updateCharacter(worldId, targetChar.id, targetChar);
            console.log(`[经验值] 角色 ${targetChar.name} 经验值设为 ${clampedValue}`);
            return clampedValue;
        } catch (e) {
            console.warn('[经验值] 设置失败', e);
            return 0;
        }
    },

    increaseExperience(worldId, charId = null, amount = 10) {
        if (charId === null || charId === undefined) {
            const current = this.getExperience(worldId);
            return this.setExperience(worldId, current + amount);
        } else {
            const current = this.getExperience(worldId, charId);
            return this.setExperience(worldId, charId, current + amount);
        }
    },

    getWillingness(worldId, charId = null) {
        try {
            const characters = Data.getCharacters(worldId);
            if (!characters || characters.length === 0) return 0;
            
            let targetChar;
            if (charId) {
                targetChar = characters.find(c => String(c.id) === String(charId));
            } else {
                targetChar = characters.find(c => c.isPlayer) || characters[0];
            }
            
            if (!targetChar || !targetChar.stats) return 0;
            
            return targetChar.stats.willingness || 0;
        } catch (e) {
            console.warn('[意愿度] 读取失败', e);
            return 0;
        }
    },

    setWillingness(worldId, charId, value) {
        try {
            const characters = Data.getCharacters(worldId);
            if (!characters || characters.length === 0) return 0;
            
            let targetChar;
            if (typeof charId === 'number' || typeof charId === 'string') {
                targetChar = characters.find(c => String(c.id) === String(charId));
            } else {
                value = charId;
                targetChar = characters.find(c => c.isPlayer) || characters[0];
            }
            
            if (!targetChar || !targetChar.stats) return 0;
            
            const clampedValue = Math.max(0, Math.min(100, value));
            targetChar.stats.willingness = clampedValue;
            
            Data.updateCharacter(worldId, targetChar.id, targetChar);
            console.log(`[意愿度] 角色 ${targetChar.name} 意愿度设为 ${clampedValue}`);
            return clampedValue;
        } catch (e) {
            console.warn('[意愿度] 设置失败', e);
            return 0;
        }
    },

    increaseWillingness(worldId, charId = null, amount = 10) {
        if (charId === null || charId === undefined) {
            const current = this.getWillingness(worldId);
            return this.setWillingness(worldId, current + amount);
        } else {
            const current = this.getWillingness(worldId, charId);
            return this.setWillingness(worldId, charId, current + amount);
        }
    },

    getAllStats(worldId, charId = null) {
        return {
            arousal: this.getExcitement(worldId, charId),
            intimacy: this.getIntimacy(worldId, charId),
            experience: this.getExperience(worldId, charId),
            willingness: this.getWillingness(worldId, charId)
        };
    },

    resetExcitement(worldId, charId = null) {
        if (charId === null || charId === undefined) {
            return this.setExcitement(worldId, 0);
        } else {
            return this.setExcitement(worldId, charId, 0);
        }
    },

    resetAllStats(worldId, charId = null) {
        this.setExcitement(worldId, charId, 0);
        this.setIntimacy(worldId, charId, 0);
        this.setExperience(worldId, charId, 0);
        this.setWillingness(worldId, charId, 0);
        console.log(`[成人属性] 角色所有属性已重置`);
    },

    getStage(excitement = null, worldId = null, charId = null) {
        if (!worldId) {
            const world = Data.getCurrentWorld();
            worldId = world?.id;
        }
        
        const stats = this.getAllStats(worldId, charId);
        const arousal = excitement !== null ? excitement : stats.arousal;
        const { intimacy, experience, willingness } = stats;
        
        if (arousal < 25) return 1;
        
        if (arousal >= 25 && intimacy >= 30) {
            if (arousal >= 50 && intimacy >= 50 && experience >= 30) {
                if (arousal >= 75 && intimacy >= 70 && experience >= 60 && willingness >= 50) {
                    return 4;
                }
                return 3;
            }
            return 2;
        }
        
        return 1;
    },

    getStageScore(worldId = null, charId = null) {
        if (!worldId) {
            const world = Data.getCurrentWorld();
            worldId = world?.id;
        }
        
        const stats = this.getAllStats(worldId, charId);
        const weights = { arousal: 0.4, intimacy: 0.3, experience: 0.2, willingness: 0.1 };
        
        const score = 
            stats.arousal * weights.arousal +
            stats.intimacy * weights.intimacy +
            stats.experience * weights.experience +
            stats.willingness * weights.willingness;
        
        return Math.round(score);
    },

    getStageName(stage = null) {
        const stageNum = stage !== null ? stage : this.getStage();
        const names = { 
            1: '暧昧挑逗期', 
            2: '肉体交缠期', 
            3: '高潮崩坏期',
            4: '极致堕落期'
        };
        return names[stageNum] || '暧昧挑逗期';
    },

    getCooldownList(worldId) {
        const key = `adult_cooldown_${worldId}`;
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch {
            return [];
        }
    },

    addToCooldown(worldId, tags) {
        const settings = this.getSettings();
        const maxCount = settings.cooldownCount || 3;
        
        let cooldown = this.getCooldownList(worldId);
        
        if (Array.isArray(tags)) {
            cooldown = [...cooldown, ...tags];
        } else {
            cooldown.push(tags);
        }
        
        if (cooldown.length > maxCount) {
            cooldown = cooldown.slice(-maxCount);
        }
        
        const key = `adult_cooldown_${worldId}`;
        localStorage.setItem(key, JSON.stringify(cooldown));
        
        return cooldown;
    },

    clearCooldown(worldId) {
        const key = `adult_cooldown_${worldId}`;
        localStorage.removeItem(key);
    },

    getScale(worldId) {
        const key = `adult_scale_${worldId}`;
        return localStorage.getItem(key) || this.getSettings().defaultScale || '中';
    },

    setScale(worldId, scale) {
        const settings = this.getSettings();
        if (settings.scales.includes(scale)) {
            const key = `adult_scale_${worldId}`;
            localStorage.setItem(key, scale);
            return true;
        }
        return false;
    },

    selectRandomTags(worldId, count = 2, stage = null, scale = null, sceneContent = '') {
        const tags = this.getTagLibrary();
        if (tags.length === 0) return [];

        const stageNum = stage !== null ? stage : this.getStage();
        const scaleValue = scale || this.getScale(worldId);
        const cooldown = this.getCooldownList(worldId);

        const filteredTags = tags.filter(tag => {
            if (tag.阶段 > stageNum) return false;
            if (tag.尺度) {
                if (scaleValue === '轻' && tag.尺度 !== '轻') return false;
                if (scaleValue === '中' && ['重', '极限'].includes(tag.尺度)) return false;
                if (scaleValue === '重' && tag.尺度 === '极限') return false;
            }
            if (cooldown.includes(tag.内容)) return false;
            return true;
        });

        let matchedTags = [];
        let unmatchedTags = [];

        if (sceneContent && sceneContent.trim()) {
            const sceneKeywords = this._extractKeywords(sceneContent);
            
            for (const tag of filteredTags) {
                const triggers = tag.触发条件 || [];
                const isMatched = triggers.some(t => 
                    sceneKeywords.some(kw => t.includes(kw) || kw.includes(t))
                );
                
                if (isMatched) {
                    matchedTags.push(tag);
                } else {
                    unmatchedTags.push(tag);
                }
            }
        } else {
            unmatchedTags = filteredTags;
        }

        const selectFromPool = (pool, selectCount) => {
            if (pool.length === 0) return [];
            
            const weightedTags = pool.map(tag => ({
                tag,
                weight: tag.权重 || 0.5
            }));

            const selected = [];
            for (let i = 0; i < selectCount && weightedTags.length > 0; i++) {
                const totalWeight = weightedTags.reduce((sum, t) => sum + t.weight, 0);
                let random = Math.random() * totalWeight;
                
                for (let j = 0; j < weightedTags.length; j++) {
                    random -= weightedTags[j].weight;
                    if (random <= 0) {
                        selected.push(weightedTags[j].tag.内容);
                        weightedTags.splice(j, 1);
                        break;
                    }
                }
            }
            return selected;
        };

        let selected = [];
        
        if (matchedTags.length > 0) {
            const matchCount = Math.min(count, matchedTags.length);
            selected = selectFromPool(matchedTags, matchCount);
            
            const remainingCount = count - selected.length;
            if (remainingCount > 0 && unmatchedTags.length > 0) {
                const additional = selectFromPool(unmatchedTags, remainingCount);
                selected = [...selected, ...additional];
            }
        } else {
            selected = selectFromPool(filteredTags, count);
        }

        if (selected.length > 0) {
            this.addToCooldown(worldId, selected);
        }

        return selected;
    },

    hasMatchedTags(sceneContent, stage, scale) {
        const tags = this.getTagLibrary();
        if (!sceneContent || tags.length === 0) return false;

        const sceneKeywords = this._extractKeywords(sceneContent);
        console.log('[成人标签] 提取的关键词:', sceneKeywords);
        if (sceneKeywords.length === 0) return false;

        const world = Data.getCurrentWorld();
        const worldId = world?.id;
        const stageNum = stage !== null ? stage : this.getStage();
        const scaleValue = scale || (worldId ? this.getScale(worldId) : '中');

        console.log(`[成人标签] 阶段:${stageNum}, 尺度:${scaleValue}, 标签数:${tags.length}`);

        for (const tag of tags) {
            const tagStage = tag.阶段 || 2;
            if (tagStage > stageNum + 1) continue;
            
            if (tag.尺度 && scaleValue === '轻' && tag.尺度 !== '轻') continue;
            if (scaleValue === '中' && ['重', '极限'].includes(tag.尺度)) continue;
            if (scaleValue === '重' && tag.尺度 === '极限') continue;

            const triggers = tag.触发条件 || [];
            const isMatched = triggers.some(t => 
                sceneKeywords.some(kw => t.includes(kw) || kw.includes(t))
            );

            if (isMatched) {
                console.log(`[成人标签] 匹配到标签:`, tag.内容, '触发条件:', triggers);
                return true;
            }
        }

        return false;
    },

    shouldTrigger(sceneContent, charId = null) {
        const settings = this.getSettings();
        if (!settings.enabled) return false;
        
        const world = Data.getCurrentWorld();
        const worldId = world?.id;
        
        const stage = this.getStage(null, worldId, charId);
        const scale = this.getScale(worldId);
        
        const hasMatch = this.hasMatchedTags(sceneContent, stage, scale);
        
        if (!hasMatch) {
            console.log('[成人标签] 场景未匹配到任何关键词');
            return false;
        }
        
        const stats = this.getAllStats(worldId, charId);
        const { arousal, intimacy, experience, willingness } = stats;
        
        const stageRequirements = {
            1: { arousal: 10, intimacy: 0, experience: 0, willingness: 0 },
            2: { arousal: 25, intimacy: 30, experience: 0, willingness: 0 },
            3: { arousal: 50, intimacy: 50, experience: 30, willingness: 0 },
            4: { arousal: 75, intimacy: 70, experience: 60, willingness: 50 }
        };
        
        const req = stageRequirements[stage];
        
        if (arousal < req.arousal || intimacy < req.intimacy || experience < req.experience || willingness < req.willingness) {
            console.log(`[成人标签] 属性不足（阶段${stage}需要：兴奋值≥${req.arousal}, 亲密度≥${req.intimacy}, 经验值≥${req.experience}, 意愿度≥${req.willingness}），当前：兴奋值${arousal}, 亲密度${intimacy}, 经验值${experience}, 意愿度${willingness}`);
            return false;
        }
        
        console.log(`[成人标签] 阶段${stage}所有属性符合要求，准备触发`);
        return true;
    },

    _extractKeywords(text) {
        if (!text || typeof text !== 'string') return [];
        
        const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '什么', '他', '她', '它', '们', '吗', '呢', '吧', '啊', '哦', '嗯', '呀', '哈', '嘿', '唉', '诶', '噢', '来', '去', '把', '被', '让', '给', '跟', '从', '向', '到', '为', '而', '但', '却', '又', '再', '还', '已', '已经', '正在', '刚才', '现在', '今天', '明天', '昨天', '这个', '那个', '这些', '那些', '怎样', '怎么样', '为什么', '因为', '所以', '但是', '如果', '虽然', '可以', '能够', '应该', '必须', '得', '能', '想', '觉得', '知道', '看到', '听到', '感觉', '开始', '继续', '结束', '完成', '成为', '发生', '出现'];
        
        let cleaned = text.replace(/[，。？！、；：""''（）【】《》!@#$%^&*()_+=\-\[\]{}|;:'",.<>\/\\`~\s]/g, '');
        
        const words = [];
        for (let len = 2; len <= 4; len++) {
            for (let i = 0; i <= cleaned.length - len; i++) {
                const word = cleaned.slice(i, i + len);
                if (!commonWords.includes(word) && !/^\d+$/.test(word)) {
                    words.push(word);
                }
            }
        }
        
        const wordCount = {};
        words.forEach(w => {
            wordCount[w] = (wordCount[w] || 0) + 1;
        });
        
        const sorted = Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .map(([word]) => word);
        
        const unique = [...new Set(sorted)];
        
        return unique.slice(0, 30);
    },

    getTagsByStage(stage) {
        const tags = this.getTagLibrary();
        return tags.filter(tag => tag.阶段 === stage);
    },

    getTagsByScale(scale) {
        const tags = this.getTagLibrary();
        return tags.filter(tag => tag.尺度 === scale);
    },

    getTagsByTrigger(trigger) {
        const tags = this.getTagLibrary();
        return tags.filter(tag => {
            const triggers = tag.触发条件 || [];
            return triggers.some(t => t.includes(trigger));
        });
    },

    buildAdultPrompt(worldId, currentScene, characters, choice = null) {
        const world = Data.getCurrentWorld();
        const excitement = this.getExcitement(world?.id);
        const stage = this.getStage(excitement);
        const scale = this.getScale(world?.id);
        
        const selectedTags = this.selectRandomTags(world?.id, 2, stage, scale, currentScene);
        const cooldown = this.getCooldownList(world?.id);
        
        const prompt = {
            excitement: excitement,
            stage: stage,
            stageName: this.getStageName(stage),
            scale: scale,
            tags: selectedTags,
            cooldown: cooldown,
            scene: currentScene,
            choice: choice
        };
        
        return prompt;
    },

    buildAdultPromptTemplate(worldId, currentScene, choice = null) {
        const settings = this.getSettings();
        if (!settings.enabled) return null;

        const world = Data.getCurrentWorld();
        const stats = this.getAllStats(world?.id);
        const excitement = stats.arousal;
        const intimacy = stats.intimacy;
        const experience = stats.experience;
        const willingness = stats.willingness;
        const stage = this.getStage(excitement, world?.id);
        const stageName = this.getStageName(stage);
        const scale = this.getScale(world?.id);
        
        const selectedTags = this.selectRandomTags(world?.id, 2, stage, scale, currentScene);
        const cooldown = this.getCooldownList(world?.id);

        const stageDescriptions = {
            1: scale === '极限' || scale === '重' 
                ? '可以使用直接的性行为描写，但要避免过于极端的内容，允许身体接触、亲密互动、性器官描写' 
                : '只能使用暗示性的描写，如眼神接触、身体接触、暧昧气氛等，不能有直接的性行为描写',
            2: scale === '极限' || scale === '重'
                ? '可以使用直接的性行为描写，允许插入、抽动、高潮等详细描写'
                : '可以使用试探性的描写，轻微的亲密接触和暗示',
            3: scale === '极限' || scale === '重'
                ? '允许激烈性交、连续高潮、羞辱失控、下流语言、大量脏话'
                : '可以使用直接的性行为描写，但要注意尺度限制',
            4: '允许极端、变态、成瘾式、超现实描写，完全放弃尊严与羞耻'
        };

        // 获取story-config插件中的成人内容设置
        let template = '';
        const storyConfigPlugin = PluginSystem.get('story-config');
        if (storyConfigPlugin) {
            const adultSetting = storyConfigPlugin.getAISetting('adultContinue', worldId);
            if (adultSetting && adultSetting.enabled && adultSetting.template) {
                template = adultSetting.template
                    .replace('[兴奋值]', excitement)
                    .replace('[亲密度]', intimacy)
                    .replace('[经验值]', experience)
                    .replace('[意愿度]', willingness)
                    .replace('[阶段]', stage)
                    .replace('[阶段名称]', stageName)
                    .replace('[尺度]', scale)
                    .replace('[阶段描述]', stageDescriptions[stage])
                    .replace('[标签列表]', selectedTags.length > 0 ? selectedTags.map(t => `- ${t}`).join('\n') : '（无标签可用）')
                    .replace('[冷却列表]', cooldown.length > 0 ? cooldown.join('、') : '暂无')
                    .replace('[上下文]', currentScene);
                
                if (adultSetting.customPrompt) {
                    template += '\n\n' + adultSetting.customPrompt;
                }
            }
        }

        // 如果没有获取到设置，使用默认模板
        if (!template) {
            template = `
【成人内容要求】
兴奋值：${excitement}/100
亲密度：${intimacy}/100
经验值：${experience}/100
意愿度：${willingness}/100
当前阶段：${stage}（${stageName}）
尺度级别：${scale}
阶段限制：${stageDescriptions[stage]}

【必须融入的玩法】（选取1-2个，自然融入剧情）：
${selectedTags.length > 0 ? selectedTags.map(t => `- ${t}`).join('\n') : '（无标签可用）'}

【冷却中的标签】（避免重复使用）：
${cooldown.length > 0 ? cooldown.join('、') : '暂无'}

【重要规则】
1. 只在故事中自然融入上述玩法，不要生硬描述
2. 同一玩法不要连续使用超过2次
3. 根据兴奋值和阶段决定内容的露骨程度
4. 严格按照设定的尺度级别生成内容
5. 描写要流畅如小说，避免罗列
6. 【强制限制】女角色不能和陌生人、路人或其他未建立关系的角色进行亲密行为。所有互动必须由主角和已建立关系的角色完成，如果需要多人参与，请用主角的分身、神奇道具、魔法道具、玩具等来代替。用词直白露骨，直接描写性器官接触、插入、抽动、高潮等细节。
`;
        }

        return {
            template: template,
            excitement: excitement,
            stage: stage,
            stageName: stageName,
            scale: scale,
            tags: selectedTags,
            cooldown: cooldown
        };
    },

    isEnabled() {
        const settings = this.getSettings();
        return settings.enabled !== false;
    },

    shouldConfirm() {
        const settings = this.getSettings();
        return settings.userConfirm !== false;
    },

    buildPromptWithSelectedTags(selectedTags) {
        const settings = this.getSettings();
        if (!settings.enabled || !selectedTags || selectedTags.length === 0) return '';

        const world = Data.getCurrentWorld();
        const stats = this.getAllStats(world?.id);
        const excitement = stats.arousal;
        const intimacy = stats.intimacy;
        const experience = stats.experience;
        const willingness = stats.willingness;
        const stage = this.getStage(excitement, world?.id);
        const stageName = this.getStageName(stage);
        const scale = this.getScale(world?.id);
        const cooldown = this.getCooldownList(world?.id);

        const stageDescriptions = {
            1: scale === '极限' || scale === '重' 
                ? '可以使用直接的性行为描写，但要避免过于极端的内容，允许身体接触、亲密互动、性器官描写' 
                : '只能使用暗示性的描写，如眼神接触、身体接触、暧昧气氛等，不能有直接的性行为描写',
            2: scale === '极限' || scale === '重'
                ? '可以使用直接的性行为描写，允许插入、抽动、高潮等详细描写'
                : '可以使用试探性的描写，轻微的亲密接触和暗示',
            3: scale === '极限' || scale === '重'
                ? '允许激烈性交、连续高潮、羞辱失控、下流语言、大量脏话'
                : '可以使用直接的性行为描写，但要注意尺度限制',
            4: '允许极端、变态、成瘾式、超现实描写，完全放弃尊严与羞耻'
        };

        const template = `
【成人内容要求】
兴奋值：${excitement}/100
亲密度：${intimacy}/100
经验值：${experience}/100
意愿度：${willingness}/100
当前阶段：${stage}（${stageName}）
尺度级别：${scale}
阶段限制：${stageDescriptions[stage]}

【用户选择的玩法】（必须融入）：
${selectedTags.map(t => `- ${t}`).join('\n')}

【冷却中的标签】（避免重复使用）：
${cooldown.length > 0 ? cooldown.join('、') : '暂无'}

【重要规则】
1. 必须将用户选择的玩法自然融入剧情
2. 同一玩法不要连续使用超过2次
3. 根据兴奋值和阶段决定内容的露骨程度
4. 严格按照设定的尺度级别生成内容
5. 描写要流畅如小说，避免罗列
6. 【强制限制】女角色不能和陌生人、路人或其他未建立关系的角色进行亲密行为。所有互动必须由主角和已建立关系的角色完成，如果需要多人参与，请用主角的分身、神奇道具、魔法道具、玩具等来代替。用词直白露骨，直接描写性器官接触、插入、抽动、高潮等细节。
`;

        return template;
    },

    identifyCharactersFromScene(sceneContent, characters) {
        if (!sceneContent || !characters || characters.length === 0) {
            return [];
        }

        const charNames = characters.map(c => c.name);
        const mentionedChars = [];

        for (const char of characters) {
            const name = char.name;
            if (sceneContent.includes(name)) {
                mentionedChars.push({
                    id: char.id,
                    name: char.name,
                    isPlayer: char.isPlayer || false
                });
            }
        }

        console.log('[成人标签] 从场景中识别的角色:', mentionedChars.map(c => c.name).join(', '));
        return mentionedChars;
    },

    getCharactersForAdultAction(characters, sceneContent) {
        if (!characters || characters.length === 0) {
            return [];
        }

        const mentionedChars = this.identifyCharactersFromScene(sceneContent, characters);

        if (mentionedChars.length === 0) {
            const playerChar = characters.find(c => c.isPlayer) || characters[0];
            if (playerChar) {
                return [{ id: playerChar.id, name: playerChar.name, isPlayer: true }];
            }
            return [];
        }

        return mentionedChars;
    },

    parseExcitementChanges(storyContent, characters) {
        if (!storyContent || !characters || characters.length === 0) {
            return [];
        }

        const changes = [];
        const regex = /【(\S+)的兴奋值变化】\+(\d+)/g;
        let match;

        while ((match = regex.exec(storyContent)) !== null) {
            const charName = match[1];
            const changeAmount = parseInt(match[2], 10);
            const char = characters.find(c => c.name === charName);
            
            if (char) {
                changes.push({
                    charId: char.id,
                    charName: char.name,
                    change: changeAmount
                });
                console.log(`[兴奋值解析] 角色 ${charName} 兴奋值变化: +${changeAmount}`);
            }
        }

        if (changes.length === 0) {
            const defaultMatch = storyContent.match(/【兴奋值变化】\+(\d+)/);
            if (defaultMatch) {
                const changeAmount = parseInt(defaultMatch[1], 10);
                const playerChar = characters.find(c => c.isPlayer) || characters[0];
                if (playerChar) {
                    changes.push({
                        charId: playerChar.id,
                        charName: playerChar.name,
                        change: changeAmount
                    });
                    console.log(`[兴奋值解析] 默认角色 ${playerChar.name} 兴奋值变化: +${changeAmount}`);
                }
            }
        }

        return changes;
    },

    applyExcitementChanges(worldId, changes) {
        if (!worldId || !changes || changes.length === 0) {
            return;
        }

        for (const change of changes) {
            const current = this.getExcitement(worldId, change.charId);
            this.setExcitement(worldId, change.charId, current + change.change);
            console.log(`[兴奋值更新] 角色 ${change.charName} 兴奋值: ${current} -> ${current + change.change}`);
        }
    },

    parseAllStatChanges(storyContent, characters) {
        if (!storyContent || !characters || characters.length === 0) {
            return [];
        }

        const changes = {
            arousal: [],
            intimacy: [],
            experience: [],
            willingness: []
        };

        const patterns = {
            arousal: /【(\S+)的兴奋值变化】\+(\d+)/g,
            intimacy: /【(\S+)的亲密度变化】\+(\d+)/g,
            experience: /【(\S+)的经验值变化】\+(\d+)/g,
            willingness: /【(\S+)的意愿度变化】\+(\d+)/g
        };

        const defaultPatterns = {
            arousal: /【兴奋值变化】\+(\d+)/,
            intimacy: /【亲密度变化】\+(\d+)/,
            experience: /【经验值变化】\+(\d+)/,
            willingness: /【意愿度变化】\+(\d+)/
        };

        for (const [statType, regex] of Object.entries(patterns)) {
            let match;
            while ((match = regex.exec(storyContent)) !== null) {
                const charName = match[1];
                const changeAmount = parseInt(match[2], 10);
                const char = characters.find(c => c.name === charName);
                
                if (char) {
                    changes[statType].push({
                        charId: char.id,
                        charName: char.name,
                        change: changeAmount
                    });
                    console.log(`[${statType === 'arousal' ? '兴奋值' : statType === 'intimacy' ? '亲密度' : statType === 'experience' ? '经验值' : '意愿度'}解析] 角色 ${charName} 变化: +${changeAmount}`);
                }
            }

            if (changes[statType].length === 0) {
                const defaultMatch = storyContent.match(defaultPatterns[statType]);
                if (defaultMatch) {
                    const changeAmount = parseInt(defaultMatch[1], 10);
                    const playerChar = characters.find(c => c.isPlayer) || characters[0];
                    if (playerChar) {
                        changes[statType].push({
                            charId: playerChar.id,
                            charName: playerChar.name,
                            change: changeAmount
                        });
                    }
                }
            }
        }

        return changes;
    },

    applyAllStatChanges(worldId, changes) {
        if (!worldId || !changes) {
            return;
        }

        const statSetters = {
            arousal: this.setExcitement.bind(this),
            intimacy: this.setIntimacy.bind(this),
            experience: this.setExperience.bind(this),
            willingness: this.setWillingness.bind(this)
        };

        const statNames = {
            arousal: '兴奋值',
            intimacy: '亲密度',
            experience: '经验值',
            willingness: '意愿度'
        };

        for (const [statType, statChanges] of Object.entries(changes)) {
            if (!statChanges || statChanges.length === 0) continue;
            
            const setter = statSetters[statType];
            const statName = statNames[statType];
            
            for (const change of statChanges) {
                const current = statType === 'arousal' 
                    ? this.getExcitement(worldId, change.charId)
                    : statType === 'intimacy'
                    ? this.getIntimacy(worldId, change.charId)
                    : statType === 'experience'
                    ? this.getExperience(worldId, change.charId)
                    : this.getWillingness(worldId, change.charId);
                
                setter(worldId, change.charId, current + change.change);
                console.log(`[${statName}更新] 角色 ${change.charName}: ${current} -> ${current + change.change}`);
            }
        }
    }
});
