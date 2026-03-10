PluginSystem.register('adult-tags', {
    description: '成人标签/玩法系统 - 管理兴奋值、尺度控制和成人标签库',
    features: ['兴奋值管理', '尺度控制', '标签库', '冷却机制', '玩法选择'],

    init() {
        console.log('Adult-tags plugin loaded');
        window.AdultTagsPlugin = this;
        this._initDefaultSettings();
        this._initTagLibrary();
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
            
            return targetChar.stats.sexArousal || targetChar.stats.sexExcitement || 0;
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
            targetChar.stats.sexExcitement = clampedValue;
            targetChar.stats.sexArousal = clampedValue;
            
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
            playerChar.stats.sexExcitement = clampedValue;
            playerChar.stats.sexArousal = clampedValue;
            
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

    resetExcitement(worldId, charId = null) {
        if (charId === null || charId === undefined) {
            return this.setExcitement(worldId, 0);
        } else {
            return this.setExcitement(worldId, charId, 0);
        }
    },

    getStage(excitement = null, worldId = null) {
        if (!worldId) {
            const world = Data.getCurrentWorld();
            worldId = world?.id;
        }
        const excitementValue = excitement !== null ? excitement : this.getExcitement(worldId);
        
        if (excitementValue <= 30) return 1;
        if (excitementValue <= 60) return 2;
        return 3;
    },

    getStageName(stage = null) {
        const stageNum = stage !== null ? stage : this.getStage();
        const names = { 1: '暗示', 2: '试探', 3: '完全放开' };
        return names[stageNum] || '暗示';
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
        
        const stage = this.getStage(null, worldId);
        const scale = this.getScale(worldId);
        
        const hasMatch = this.hasMatchedTags(sceneContent, stage, scale);
        
        if (!hasMatch) {
            console.log('[成人标签] 场景未匹配到任何关键词');
            return false;
        }
        
        if (charId && typeof charId === 'object' && Array.isArray(charId)) {
            const charIds = charId;
            for (const id of charIds) {
                const excitement = this.getExcitement(worldId, id);
                if (stage === 1 && excitement >= 10) {
                    console.log(`[成人标签] 角色ID ${id} 兴奋值符合要求（${excitement}），准备触发`);
                    return true;
                }
                if (stage === 2 && excitement >= 30) {
                    console.log(`[成人标签] 角色ID ${id} 兴奋值符合要求（${excitement}），准备触发`);
                    return true;
                }
                if (stage === 3) {
                    console.log(`[成人标签] 角色ID ${id} 兴奋值（${excitement}），阶段3可直接触发`);
                    return true;
                }
            }
            console.log(`[成人标签] 所有角色兴奋值不足（阶段${stage}需要：${stage === 1 ? '≥10' : '≥30'}）`);
            return false;
        }
        
        const excitement = this.getExcitement(worldId, charId);
        
        if (stage === 1 && excitement < 10) {
            console.log(`[成人标签] 兴奋值不足（阶段1需要≥10，当前${excitement}）`);
            return false;
        }
        
        if (stage === 2 && excitement < 30) {
            console.log(`[成人标签] 兴奋值不足（阶段2需要≥30，当前${excitement}）`);
            return false;
        }
        
        console.log(`[成人标签] 关键词匹配，兴奋值符合要求（${excitement}），准备触发`);
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
        const excitement = this.getExcitement(world?.id);
        const stage = this.getStage(excitement);
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
            3: '可以使用直接的性行为描写，但要注意尺度限制'
        };

        const template = `
【成人内容要求】
兴奋值：${excitement}/100
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
        const excitement = this.getExcitement(world?.id);
        const stage = this.getStage(excitement);
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
            3: '可以使用直接的性行为描写，但要注意尺度限制'
        };

        const template = `
【成人内容要求】
兴奋值：${excitement}/100
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
    }
});
