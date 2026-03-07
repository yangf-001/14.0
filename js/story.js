const Story = {
    current: null,
    history: [],
    
    async _ensurePluginsInitialized() {
        if (PluginSystem && !PluginSystem.loaded) {
            await PluginSystem.init();
        }
    },
    
    async start(config) {
        await this._ensurePluginsInitialized();
        const world = Data.getCurrentWorld();
        if (!world) throw new Error('请先选择一个世界');
        
        const characters = Data.getCharacters(world.id);
        if (characters.length === 0) throw new Error('请先添加角色');
        
        const settings = Settings.get(world.id);
        
        const mainChars = characters.filter(c => c.role === '主角' || c.role === '女主');
        const selectedChars = config.characters?.length 
            ? characters.filter(c => config.characters.includes(c.id))
            : mainChars.length > 0 ? mainChars : characters.slice(0, 3);
        
        let playerCharInfo = null;
        if (config.playerChar) {
            if (config.playerChar.startsWith('custom:')) {
                playerCharInfo = { name: config.playerChar.substring(7), isCustom: true };
            } else {
                const char = characters.find(c => c.id === config.playerChar);
                if (char) {
                    playerCharInfo = { id: char.id, name: char.name, profile: char.profile || {}, adultProfile: char.adultProfile || {} };
                }
            }
        }
        
        let protagonistAge = 18;
        if (config.timeConfig) {
            const timePlugin = window.WorldTimePlugin;
            if (timePlugin) {
                const timeData = timePlugin.setStoryStartTime(
                    world.id, 
                    config.timeConfig.protagonistAge, 
                    config.timeConfig.startYear
                );
                protagonistAge = config.timeConfig.protagonistAge;
                
                if (config.timeConfig.ageRelations) {
                    Object.entries(config.timeConfig.ageRelations).forEach(([charId, relation]) => {
                        timePlugin.setCharacterRelation(world.id, charId, relation);
                    });
                }
            }
        }
        
        const prompt = StoryConfigPlugin.getStoryGenerator().buildStartPrompt(selectedChars, config.scene, settings, playerCharInfo);
        
        this._showLoading('正在生成故事开头...');
        
        try {
            const content = await ai.generateStory(prompt, settings);
            
            const cleanContent = StoryConfigPlugin.getStoryGenerator().cleanStoryContent(content);
            
            this.current = {
                id: Data._genId(),
                worldId: world.id,
                startTime: Date.now(),
                characters: selectedChars.map(c => ({
                    id: c.id,
                    name: c.name,
                    profile: c.profile || {},
                    adultProfile: c.adultProfile || {},
                    stats: c.stats || {}
                })),
                playerChar: playerCharInfo,
                scene: config.scene,
                settings: settings,
                scenes: [{ 
                    content: cleanContent, 
                    choice: null,
                    choices: [],
                    timestamp: Date.now(),
                    summary: ''
                }],
                status: 'ongoing',
                round: 1
            };
            
            const firstSummary = await this._generateSceneSummary(cleanContent, null);
            this.current.scenes[0].summary = firstSummary;
            
            const choices = await StoryConfigPlugin.getStoryGenerator().generateChoices(content, selectedChars, settings);
            this.current.scenes[0].choices = choices;
            
            const oldStatsStart = {};
            for (const char of selectedChars) {
                const dbChar = Data.getCharacter(world.id, char.id);
                oldStatsStart[char.id] = { ...(dbChar?.stats || char.stats || {}) };
            }
            
            await StoryConfigPlugin.getStoryGenerator().updateCharacterProfiles(cleanContent, selectedChars, world.id);
            
            const statChangesStart = {};
            for (const char of selectedChars) {
                const dbChar = Data.getCharacter(world.id, char.id);
                const newStats = dbChar?.stats || {};
                const oldCharStats = oldStatsStart[char.id] || {};
                const changes = {};
                
                for (const [key, value] of Object.entries(newStats)) {
                    const oldValue = oldCharStats[key] || 0;
                    const diff = value - oldValue;
                    if (diff !== 0) {
                        changes[key] = diff;
                    }
                }
                
                if (Object.keys(changes).length > 0) {
                    statChangesStart[char.name] = changes;
                }
            }
            
            this.current.scenes[0].statChanges = statChangesStart;
            
            await StoryConfigPlugin.getStoryGenerator().extractItemsFromStory(cleanContent, selectedChars, world.id);
            
            PluginSystem.triggerPluginEvent('storyStarted', {
                worldId: world.id,
                characters: selectedChars.map(c => c.name),
                scene: config.scene,
                protagonistAge: protagonistAge,
                timeConfig: config.timeConfig
            });
            
            PluginSystem.triggerPluginEvent('sceneGenerated', {
                sceneIndex: 0,
                content: content,
                choice: null
            });
            
            Data.saveStory(world.id, this.current);
            this._hideLoading();
            return this.current;
        } catch (err) {
            this._hideLoading();
            throw err;
        }
    },

    async continue(choice = null, options = {}) {
        await this._ensurePluginsInitialized();
        const world = Data.getCurrentWorld();
        if (!world || !this.current) throw new Error('没有进行中的故事');
        if (this.current.status !== 'ongoing') throw new Error('故事已结束，请开始新故事');
        
        const settings = Settings.get(world.id);
        let characters = Data.getCharacters(world.id);
        
        if (options.characters && options.characters.length > 0) {
            const selectedChars = characters.filter(c => options.characters.includes(c.id));
            this.current.characters = selectedChars.map(c => ({
                id: c.id,
                name: c.name,
                profile: c.profile || {},
                adultProfile: c.adultProfile || {},
                stats: c.stats || {}
            }));
        }
        
        const isItemUse = options.isItemUse === true;
        const isIntimate = !isItemUse && choice && (
            choice.includes('姿势') || 
            choice.includes('部位') || 
            choice.includes('动作') || 
            choice.includes('对话') || 
            choice.includes('风格')
        );
        
        let prompt = '';
        let systemPrompt = '';
        
        if (choice) {
            if (isItemUse) {
                const aiSetting = StoryConfigPlugin.getAISetting('itemStory', world.id);
                const context = StoryConfigPlugin.getStoryGenerator().buildContext(this.current, characters, settings);
                const charNames = characters.map(c => c.name).join('、');
                const targetChar = options.targetChar;
                const userChar = options.userChar;
                const item = options.item;
                
                let template = aiSetting.template || '';
                template = template.replace('[上下文]', context);
                template = template.replace('[角色]', userChar ? `${userChar.name}对${targetChar.name}` : targetChar.name);
                template = template.replace('[物品名]', item.name);
                template = template.replace('[物品效果]', JSON.stringify(item.effects || {}));
                template = template.replace('[物品描述]', item.description || '');
                
                systemPrompt = StoryConfigPlugin.getWorldSystemPrompt(world.id);
                
                if (aiSetting.customPrompt) {
                    template += '\n\n' + aiSetting.customPrompt;
                }
                
                prompt = template;
            } else if (isIntimate) {
                const aiSetting = StoryConfigPlugin.getAISetting('intimateContinue', world.id);
                const context = StoryConfigPlugin.getStoryGenerator().buildContext(this.current, characters, settings);
                const charNames = characters.map(c => c.name).join('、');
                
                let template = aiSetting.template || '';
                template = template.replace('[亲密互动内容]', choice);
                template = template.replace('[上下文]', context);
                template = template.replace('[角色列表]', charNames);
                
                systemPrompt = StoryConfigPlugin.getWorldSystemPrompt(world.id);
                
                if (aiSetting.customPrompt) {
                    template += '\n\n' + aiSetting.customPrompt;
                }
                
                prompt = template;
            } else {
                const context = StoryConfigPlugin.getStoryGenerator().buildContext(this.current, characters, settings);
                prompt = `根据用户的选择继续故事：${choice}\n\n`;
                systemPrompt = context;
            }
        } else {
            const context = StoryConfigPlugin.getStoryGenerator().buildContext(this.current, characters, settings);
            prompt = '继续故事，生成下一段内容：';
            
            if (options.charChangeNote) {
                prompt += options.charChangeNote;
            }
            
            systemPrompt = context;
        }
        
        this._showLoading(isItemUse ? '正在生成物品使用剧情...' : '正在生成故事...');
        
        try {
            const content = await ai.call(prompt, { system: systemPrompt });
            const cleanContent = StoryConfigPlugin.getStoryGenerator().cleanStoryContent(content);
            
            const newScene = {
                content: cleanContent,
                choice: choice,
                choices: [],
                timestamp: Date.now()
            };
            
            const summary = await this._generateSceneSummary(cleanContent, choice);
            newScene.summary = summary;
            
            this.current.scenes.push(newScene);
            
            const choices = await StoryConfigPlugin.getStoryGenerator().generateChoices(content, this.current.characters, settings);
            this.current.scenes[this.current.scenes.length - 1].choices = choices;
            
            this.current.round = this.current.scenes.length;
            
            const oldStats = {};
            for (const char of this.current.characters) {
                const dbChar = Data.getCharacter(world.id, char.id);
                oldStats[char.id] = { ...(dbChar?.stats || char.stats || {}) };
            }
            
            await StoryConfigPlugin.getStoryGenerator().updateCharacterProfiles(cleanContent, this.current.characters, world.id);
            
            const statChanges = {};
            for (const char of this.current.characters) {
                const dbChar = Data.getCharacter(world.id, char.id);
                const newStats = dbChar?.stats || {};
                const oldCharStats = oldStats[char.id] || {};
                const changes = {};
                
                for (const [key, value] of Object.entries(newStats)) {
                    const oldValue = oldCharStats[key] || 0;
                    const diff = value - oldValue;
                    if (diff !== 0) {
                        changes[key] = diff;
                    }
                }
                
                if (Object.keys(changes).length > 0) {
                    statChanges[char.name] = changes;
                }
            }
            
            newScene.statChanges = statChanges;
            
            await StoryConfigPlugin.getStoryGenerator().extractItemsFromStory(cleanContent, this.current.characters, world.id);
            
            const timePlugin = window.WorldTimePlugin;
            if (timePlugin) {
                timePlugin.advanceTime(world.id, Math.floor(Math.random() * 3) + 1);
            }
            
            Data.saveStory(world.id, this.current);
            this._updateArchiveInPlace(world.id);
            this._checkArchiveForSummaries(world.id);
            this._hideLoading();
            return this.current;
        } catch (err) {
            this._hideLoading();
            throw err;
        }
    },

    async useItemInStory(item, targetCharId, userCharId = null) {
        const world = Data.getCurrentWorld();
        const targetChar = Data.getCharacters(world.id).find(c => c.id === targetCharId);
        const userChar = userCharId ? Data.getCharacters(world.id).find(c => c.id === userCharId) : null;
        
        const choiceText = userChar 
            ? `${userChar.name}对${targetChar.name}使用了物品：${item.name}，物品效果：${JSON.stringify(item.effects || {})}`
            : `${targetChar.name}使用了物品：${item.name}，物品效果：${JSON.stringify(item.effects || {})}`;
        
        await this.continue(choiceText, { isItemUse: true, item: item, targetChar: targetChar, userChar: userChar });
    },

    async refreshChoices(currentStory, options = {}) {
        await this._ensurePluginsInitialized();
        const world = Data.getCurrentWorld();
        if (!world || !currentStory) throw new Error('没有进行中的故事');
        
        const settings = Settings.get(world.id);
        const characters = Data.getCharacters(world.id);
        
        if (options.characters && options.characters.length > 0) {
            currentStory.characters = characters.filter(c => options.characters.includes(c.id)).map(c => ({
                id: c.id,
                name: c.name,
                profile: c.profile || {},
                adultProfile: c.adultProfile || {},
                stats: c.stats || {}
            }));
        }
        
        const charNames = currentStory.characters.map(c => c.name).join('、');
        const lastContent = currentStory.scenes[currentStory.scenes.length - 1]?.content || '';
        
        let contextNote = '';
        if (options.charChangeNote) {
            contextNote = options.charChangeNote;
        }
        
        const prompt = `根据以下故事内容和角色变化，重新生成3-5个适合的后续剧情选项。

【当前故事内容】
${lastContent}

【参与角色】${charNames}
${contextNote}

请生成新的剧情选项，每个选项应该：
1. 适合当前参与的角色
2. 推动剧情发展
3. 有多种可能性

只输出选项，用换行分隔，不需要编号。`;
        
        const aiSetting = StoryConfigPlugin.getAISetting('storyContinue', world.id);
        const systemPrompt = StoryConfigPlugin.getWorldSystemPrompt(world.id) || '';
        
        const result = await ai.call(prompt, { 
            system: systemPrompt,
            temperature: 0.7
        });
        
        const choices = result.split('\n')
            .map(line => line.replace(/^\d+[.、]\s*/, '').trim())
            .filter(line => line.length > 0 && line.length < 100);
        
        return choices.slice(0, 5);
    },

    _updateArchiveInPlace(worldId) {
        const archives = this.getArchives(worldId);
        const idx = archives.findIndex(a => a.id === this.current.id);
        
        if (idx !== -1) {
            archives[idx].sceneCount = this.current.scenes.length;
            archives[idx].scenes = this.current.scenes;
            localStorage.setItem(`story_archives_${worldId}`, JSON.stringify(archives));
        }
    },
    
    async _generateSceneSummary(content, choice) {
        try {
            const prompt = `请用一句话简洁概括以下故事情节的核心内容（30字以内）：

${content.substring(0, 500)}

${choice ? `[用户选择了：${choice}]` : ''}

只需要返回一个简洁的总结，不需要其他内容。`;
            
            const result = await ai.call(prompt, { 
                system: '你是一个故事总结助手，用简洁的语言概括情节。',
                temperature: 0.3,
                maxTokens: 50
            });
            
            return result.trim().substring(0, 50);
        } catch (e) {
            return content.substring(0, 30) + '...';
        }
    },
    
    _checkArchiveForSummaries(worldId) {
        const archives = this.getArchives(worldId);
        let changed = false;
        
        for (let i = 0; i < archives.length; i++) {
            const archive = archives[i];
            if (!archive.scenes || archive.scenes.length < 10) continue;
            if (archive.status === 'ongoing') continue;
            
            const totalScenesProcessed = (archive.groupSummary ? archive.groupSummary.length * 10 : 0) + (archive.scenes ? archive.scenes.length : 0);
            
            if (totalScenesProcessed >= 10 && totalScenesProcessed % 10 === 0) {
                const groupIndex = (archive.groupSummary ? archive.groupSummary.length : 0);
                
                if (archive.groupSummary && archive.groupSummary[groupIndex]) continue;
                
                const scenesToSummarize = archive.scenes.slice(0, 10);
                
                archive.groupSummary = archive.groupSummary || [];
                archive.groupSummary[groupIndex] = {
                    scenes: scenesToSummarize.map(s => ({
                        content: s.content,
                        choice: s.choice,
                        summary: s.summary
                    })),
                    summary: '[待生成总结]',
                    createdAt: Date.now()
                };
                
                const remainingScenes = archive.scenes.slice(10);
                archive.scenes = remainingScenes;
                archive.sceneCount = remainingScenes.length;
                
                changed = true;
                
                this._generateGroupSummaryAsync(worldId, archive.id, groupIndex, scenesToSummarize);
            }
        }
        
        if (changed) {
            localStorage.setItem(`story_archives_${worldId}`, JSON.stringify(archives));
        }
    },
    
    async _generateGroupSummaryAsync(worldId, archiveId, groupIndex, scenes) {
        try {
            const aiSetting = StoryConfigPlugin.getAISetting('level2Summary', worldId);
            if (!aiSetting || !aiSetting.enabled) return;
            
            const content = scenes.map(s => s.summary).join('； ');
            
            let template = aiSetting.template || '';
            template = template.replace('[所有场景内容]', content);
            
            if (aiSetting.customPrompt) {
                template += '\n\n' + aiSetting.customPrompt;
            }
            
            const summary = await ai.call(template, { maxTokens: aiSetting.maxTokens || 2000 });
            
            const archives = this.getArchives(worldId);
            const archive = archives.find(a => a.id === archiveId);
            if (archive && archive.groupSummary && archive.groupSummary[groupIndex]) {
                archive.groupSummary[groupIndex].summary = summary;
                localStorage.setItem(`story_archives_${worldId}`, JSON.stringify(archives));
            }
        } catch (e) {
            console.error('生成十幕总结失败:', e);
        }
    },

    async _updateCharacterProfiles(storyContent, worldId) {
        const characters = this.current.characters;
        if (!characters || characters.length === 0) return;
        
        const charNames = characters.map(c => c.name).join('、');
        
        const prompt = `根据以下故事内容，分析角色在剧情中的数值属性变化。

故事内容：
${storyContent.substring(0, 800)}

角色：${charNames}

可用属性列表：
- health (生命 0-200): 角色的生命值
- energy (体力 0-200): 角色的体力
- charm (魅力 0-200): 角色的魅力值
- intelligence (智力 0-200): 角色的智力
- strength (力量 0-200): 角色的力量
- agility (敏捷 0-200): 角色的敏捷
- sexArousal (欲望 0-200): 角色的性欲望
- sexLibido (性欲 0-200): 角色的性欲强度
- sexSensitivity (敏感 0-200): 角色对性刺激的敏感度
- affection (好感 0-200): 对玩家或他人的好感度
- trust (信任 0-200): 对他人信任程度
- intimacy (亲密 0-200): 亲密程度

请分析故事情节，判断每个角色的数值属性应该有什么变化。返回JSON格式：
{
  "角色名": {
    "health": 变化值(正数增加，负数减少，如 +10 或 -5，或不变则不写),
    "energy": 变化值,
    "charm": 变化值,
    "intelligence": 变化值,
    "strength": 变化值,
    "agility": 变化值,
    "sexArousal": 变化值,
    "sexLibido": 变化值,
    "sexSensitivity": 变化值,
    "affection": 变化值,
    "trust": 变化值,
    "intimacy": 变化值
  }
}

注意：
1. 根据剧情合理设置变化值，一般单次变化在-20到+20之间
2. 如果某个属性没有变化，不要在JSON中列出
3. 如果所有属性都没变化，返回空对象 {}
4. 只返回JSON，不要其他内容`;

        try {
            const result = await ai.call(prompt, { 
                system: '你是一个角色属性分析助手，根据故事情节分析角色数值属性的合理变化。',
                temperature: 0.3 
            });
            
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return;
            
            let jsonStr = jsonMatch[0];
            jsonStr = jsonStr.replace(/"(\w+)":\s*\+(\d+)/g, '"$1": $2');
            
            const updates = JSON.parse(jsonStr);
            
            for (const char of characters) {
                const charUpdates = updates[char.name];
                if (!charUpdates || Object.keys(charUpdates).length === 0) continue;
                
                const dbChar = Data.getCharacter(worldId, char.id);
                const currentStats = dbChar?.stats || char.stats || {};
                const newStats = { ...currentStats };
                
                for (const [stat, change] of Object.entries(charUpdates)) {
                    if (typeof change === 'number') {
                        const currentValue = newStats[stat] || 0;
                        newStats[stat] = Math.max(0, Math.min(200, currentValue + change));
                    }
                }
                
                char.stats = newStats;
                
                Data.updateCharacter(worldId, char.id, { stats: newStats });
            }
            
            Data.saveStory(worldId, this.current);
            
            PluginSystem.triggerPluginEvent('characterStatsUpdated', {
                characters: characters.map(c => ({ id: c.id, name: c.name, stats: c.stats }))
            });
            
        } catch (e) {
            console.warn('更新角色属性失败:', e);
        }
    },

    async _generateChoices(content, characters, settings) {
        const charNames = characters.map(c => c.name).join('、');
        const world = Data.getCurrentWorld();
        const worldId = world?.id;
        
        let systemPrompt = '你是一个故事助手，生成的选择要符合剧情发展。';
        if (typeof StoryConfigPlugin !== 'undefined') {
            const pluginPrompt = StoryConfigPlugin.getWorldSystemPrompt(worldId);
            if (pluginPrompt) {
                systemPrompt = pluginPrompt;
            }
        }
        
        const prompt = `基于以下故事内容，生成3个让用户选择的剧情分支选项：

故事内容：
${content.substring(0, 500)}

角色：${charNames}

请生成3个符合故事发展、让用户决定剧情走向的选择项。每个选项用一句话描述，格式如下（只需要选项，不要其他内容）：
1. [选项1描述]
2. [选项2描述]
3. [选项3描述]`;

        try {
            const result = await ai.call(prompt, { 
                system: systemPrompt,
                temperature: 0.8 
            });
            
            const choices = result.split('\n')
                .map(line => line.replace(/^\d+[\.、]\s*/, '').trim())
                .filter(line => line.length > 0 && line.length < 100)
                .slice(0, 3);
            
            if (choices.length < 3) {
                return [
                    '继续发展当前情节',
                    '深入探索某个细节',
                    '改变故事方向'
                ];
            }
            
            return choices;
        } catch (e) {
            return [
                '继续发展当前情节',
                '深入探索某个细节',
                '改变故事方向'
            ];
        }
    },
    
    async _extractItemsFromStory(storyContent, worldId) {
        const inventoryPlugin = PluginSystem.get('inventory');
        if (!inventoryPlugin) return;
        
        const library = inventoryPlugin.getItemLibrary();
        if (library.length === 0) return;
        
        const characters = this.current.characters;
        if (!characters || characters.length === 0) return;
        
        const itemNames = library.map(i => i.name).join('、');
        const charNames = characters.map(c => c.name).join('、');
        
        const prompt = `根据以下故事内容，分析是否有出现以下物品（从物品库中匹配），并识别哪个角色获得了物品：

物品库：${itemNames}

角色：${charNames}

故事内容：
${storyContent.substring(0, 1200)}

请分析故事中物品的获得和使用情况，返回JSON格式：
{
  "获得": [
    {"物品": "物品名", "角色": "角色名"},
    {"物品": "物品名2", "角色": "角色名2"}
  ],
  "使用": [
    {"物品": "物品名", "角色": "角色名"}
  ]
}

注意：
1. "获得"指角色获得/拥有的物品，需要指明是哪个角色获得的
2. "使用"指角色使用/消耗的物品
3. 如果物品没有明确指定给哪个角色，默认给第一个角色
4. 只返回与物品库中物品名称匹配的内容
5. 如果没有匹配，返回空数组
6. 只返回JSON，不要其他内容`;

        try {
            const result = await ai.call(prompt, { 
                system: '你是一个物品分析助手，根据故事情节识别物品和获得者。',
                temperature: 0.3 
            });
            
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return;
            
            let jsonStr = jsonMatch[0];
            jsonStr = jsonStr.replace(/"(\w+)":\s*\+(\d+)/g, '"$1": $2');
            
            const itemData = JSON.parse(jsonStr);
            
            const gainedItems = itemData['获得'] || [];
            const usedItems = itemData['使用'] || [];
            
            for (const itemGain of gainedItems) {
                const itemName = itemGain['物品'] || itemGain.item || itemGain.name;
                let charName = itemGain['角色'] || itemGain.character || itemGain.owner;
                
                if (!charName) {
                    charName = characters[0].name;
                }
                
                const char = characters.find(c => c.name === charName);
                if (char) {
                    const libItem = library.find(i => i.name === itemName);
                    if (libItem) {
                        inventoryPlugin.addItem(worldId, char.id, libItem);
                        console.log(`[物品] ${char.name} 获得了 ${libItem.name}`);
                    }
                }
            }
            
            for (const itemUse of usedItems) {
                const itemName = itemUse['物品'] || itemUse.item || itemUse.name;
                let charName = itemUse['角色'] || itemUse.character || itemUse.user;
                
                const char = characters.find(c => c.name === charName);
                if (char) {
                    const used = inventoryPlugin.useItemByName(worldId, char.id, itemName);
                    if (used) {
                        console.log(`[物品] ${char.name} 使用了 ${itemName}`);
                    }
                }
            }
            
            if (gainedItems.length > 0 || usedItems.length > 0) {
                PluginSystem.triggerPluginEvent('itemsInStory', {
                    gained: gainedItems,
                    used: usedItems,
                    storyContent: storyContent.substring(0, 200)
                });
            }
            
        } catch (e) {
            console.warn('提取物品失败:', e);
        }
    },

    _cleanStoryContent(content) {
        if (!content) return content;
        
        let cleaned = content;
        
        const patterns = [
            /[\n\r]*[\*\-—]+\s*接下来可能的发展[：:]*[\n\r]*/gi,
            /[\n\r]*[\*\-—]+\s*请选择剧情走向[：:]*[\n\r]*/gi,
            /[\n\r]*[\*\-—]+\s*后续发展[：:]*[\n\r]*/gi,
            /[\n\r]*[\*\-—]+\s*可能的发展[：:]*[\n\r]*/gi,
            /[\n\r]*[\*\-—]+\s*发展选项[：:]*[\n\r]*/gi,
            /[\n\r]*✏️\s*自定义[\s\S]*?$/gi,
            /[\n\r]*\d+[\.、]\s+[\u4e00-\u9fa5]{2,10}[\s\S]*?$/gm
        ];
        
        for (const pattern of patterns) {
            cleaned = cleaned.replace(pattern, '');
        }
        
        cleaned = cleaned.trim();
        
        return cleaned;
    },

    async end(summary = '') {
        const world = Data.getCurrentWorld();
        if (!world || !this.current) throw new Error('没有进行中的故事');

        let storySummary = summary;
        
        if (!storySummary) {
            storySummary = await this._generateStoryTitle();
        }
        
        const archives = this.getArchives(world.id);
        const existingIdx = archives.findIndex(a => a.id === this.current.id);
        
        const archive = {
            id: this.current.id,
            worldId: world.id,
            title: storySummary,
            startTime: this.current.startTime,
            endTime: Date.now(),
            characters: this.current.characters,
            sceneCount: this.current.scenes.length,
            settings: this.current.settings,
            summary: storySummary,
            scenes: this.current.scenes,
            scene: this.current.scene,
            status: 'ended'
        };
        
        if (existingIdx !== -1) {
            archives[existingIdx] = archive;
        } else {
            archives.unshift(archive);
            this._checkArchiveForSummaries(world.id);
        }
        
        localStorage.setItem(`story_archives_${world.id}`, JSON.stringify(archives));
        
        this.current.status = 'ended';
        this.current.endTime = Date.now();
        
        Data.saveStory(world.id, null);
        this.current = null;
        
        return archive;
    },
    
    async _generateStoryTitle() {
        try {
            const scenes = this.current.scenes;
            if (!scenes || scenes.length === 0) {
                return '精彩的故事';
            }
            
            const firstScene = scenes[0]?.content || '';
            const lastScene = scenes[scenes.length - 1]?.content || '';
            
            const charNames = this.current.characters?.map(c => c.name).join('、') || '角色';
            
            const prompt = `请根据以下故事内容生成一个简短的故事标题（5-15个字）：

【故事开头】：
${firstScene.substring(0, 300)}

【故事结尾】：
${lastScene.substring(0, 300)}

【出场角色】：${charNames}

要求：
1. 标题要能概括故事的核心内容或主题
2. 字数控制在5-15个字之间
3. 不要包含引号或其他符号
4. 直接返回标题，不要其他内容`;

            const result = await ai.call(prompt, { 
                system: '你是一个故事标题生成助手，根据故事内容生成简洁有力的标题。',
                temperature: 0.5,
                maxTokens: 50
            });
            
            const title = result.trim().replace(/^["'""''「」【】\s]+|["'""''「」【】\s]+$/g, '');
            
            return title || '精彩的故事';
        } catch (e) {
            console.error('生成故事标题失败:', e);
            return '精彩的故事';
        }
    },

    getArchives(worldId) {
        try {
            return JSON.parse(localStorage.getItem(`story_archives_${worldId}`) || '[]');
        } catch { return []; }
    },
    
    getArchivedStories(worldId) {
        try {
            return JSON.parse(localStorage.getItem(`story_archived_${worldId}`) || '[]');
        } catch { return []; }
    },
    
    deleteArchive(archiveId) {
        const world = Data.getCurrentWorld();
        if (!world) return false;
        
        const archives = this.getArchives(world.id);
        const idx = archives.findIndex(a => a.id === archiveId);
        
        if (idx !== -1) {
            archives.splice(idx, 1);
            localStorage.setItem(`story_archives_${world.id}`, JSON.stringify(archives));
            return true;
        }
        
        return false;
    },
    
    deleteArchivedStory(archiveId) {
        const world = Data.getCurrentWorld();
        if (!world) return false;
        
        const archived = this.getArchivedStories(world.id);
        const idx = archived.findIndex(a => a.id === archiveId);
        
        if (idx !== -1) {
            archived.splice(idx, 1);
            localStorage.setItem(`story_archived_${world.id}`, JSON.stringify(archived));
            return true;
        }
        
        return false;
    },
    
    deleteLevel2Story(archiveId) {
        const world = Data.getCurrentWorld();
        if (!world) return false;
        
        const level2 = this.getLevel2Archives(world.id);
        const idx = level2.findIndex(a => a.id === archiveId);
        
        if (idx !== -1) {
            level2.splice(idx, 1);
            localStorage.setItem(`story_level2_${world.id}`, JSON.stringify(level2));
            return true;
        }
        
        return false;
    },
    
    deleteLevel3Story(archiveId) {
        const world = Data.getCurrentWorld();
        if (!world) return false;
        
        const level3 = this.getLevel3Archives(world.id);
        const idx = level3.findIndex(a => a.id === archiveId);
        
        if (idx !== -1) {
            level3.splice(idx, 1);
            localStorage.setItem(`story_level3_${world.id}`, JSON.stringify(level3));
            return true;
        }
        
        return false;
    },
    
    _checkArchive(worldId, archives) {
        let changed = false;
        
        for (let i = 0; i < archives.length; i++) {
            const story = archives[i];
            while (story.scenes && story.scenes.length > 10 && !story.level2Summary) {
                this._createLevel2SummarySync(worldId, story, archives);
                changed = true;
                break;
            }
        }
        
        const level2Archives = this.getLevel2Archives(worldId);
        
        while (level2Archives.length > 10) {
            this._createLevel3SummarySync(worldId, level2Archives);
            changed = true;
        }
        
        return changed;
    },
    
    getLevel2Archives(worldId) {
        try {
            return JSON.parse(localStorage.getItem(`story_level2_${worldId}`) || '[]');
        } catch { return []; }
    },
    
    getLevel3Archives(worldId) {
        try {
            return JSON.parse(localStorage.getItem(`story_level3_${worldId}`) || '[]');
        } catch { return []; }
    },
    
    _createLevel2SummarySync(worldId, story, archives) {
        const first10Scenes = story.scenes.slice(0, 10);
        const remainingScenes = story.scenes.slice(10);
        
        const level2Entry = {
            id: story.id + '_' + Date.now(),
            title: story.title + ' (前10幕)',
            originalTitle: story.title,
            startTime: story.startTime,
            endTime: story.endTime,
            characters: story.characters,
            sceneCount: 10,
            summary: '[待生成摘要]',
            archivedAt: Date.now()
        };
        
        const level2Archives = this.getLevel2Archives(worldId);
        level2Archives.unshift(level2Entry);
        
        const idx = archives.findIndex(a => a.id === story.id);
        if (idx !== -1) {
            archives[idx].level2Summary = '[待生成摘要]';
            archives[idx].scenes = remainingScenes;
            archives[idx].sceneCount = remainingScenes.length;
        }
        
        localStorage.setItem(`story_level2_${worldId}`, JSON.stringify(level2Archives));
        localStorage.setItem(`story_archives_${worldId}`, JSON.stringify(archives));
        
        this._generateLevel2SummaryAsync(worldId, level2Entry.id, first10Scenes, story.title);
    },
    
    async _generateLevel2SummaryAsync(worldId, entryId, scenes, storyTitle) {
        const aiSetting = StoryConfigPlugin.getAISetting('level2Summary', worldId);
        const ds = StoryConfigPlugin.getDataSources(worldId);

        if (!aiSetting.enabled) {
            return;
        }

        const contentLength = ds.storyContentLength || 800;
        const content = scenes.map(s => s.content).join('\n\n').substring(0, contentLength * 3);

        let template = aiSetting.template || '';
        template = template.replace('[所有场景内容]', content);

        if (aiSetting.customPrompt) {
            template += '\n\n' + aiSetting.customPrompt;
        }

        try {
            const summary = await ai.call(template, { maxTokens: aiSetting.maxTokens || 2000 });
            
            const level2 = this.getLevel2Archives(worldId);
            const idx = level2.findIndex(e => e.id === entryId);
            if (idx !== -1) {
                level2[idx].summary = summary;
                localStorage.setItem(`story_level2_${worldId}`, JSON.stringify(level2));
            }
            
            const archives = this.getArchives(worldId);
            const archIdx = archives.findIndex(a => a.title === storyTitle || a.title + ' (前10幕)' === level2[idx]?.title);
            if (archIdx !== -1) {
                archives[archIdx].level2Summary = summary;
                localStorage.setItem(`story_archives_${worldId}`, JSON.stringify(archives));
            }
        } catch (e) {
            console.error('生成摘要失败:', e);
        }
    },
    
    _createLevel3SummarySync(worldId, level2Archives) {
        const toSummarize = level2Archives.slice(0, 10);
        
        const level3Entry = {
            id: Data._genId(),
            title: '故事合集',
            stories: toSummarize.map(s => ({
                title: s.originalTitle || s.title,
                summary: s.summary
            })),
            summary: '[待生成综合摘要]',
            archivedAt: Date.now()
        };
        
        const level3Archives = this.getLevel3Archives(worldId);
        level3Archives.unshift(level3Entry);
        
        for (let i = 0; i < 10 && level2Archives.length > 0; i++) {
            level2Archives.shift();
        }
        
        localStorage.setItem(`story_level3_${worldId}`, JSON.stringify(level3Archives));
        localStorage.setItem(`story_level2_${worldId}`, JSON.stringify(level2Archives));
        
        this._generateLevel3SummaryAsync(worldId, level3Entry.id, toSummarize);
    },
    
    async _generateLevel3SummaryAsync(worldId, entryId, stories) {
        const aiSetting = StoryConfigPlugin.getAISetting('level3Summary', worldId);
        const ds = StoryConfigPlugin.getDataSources(worldId);

        if (!aiSetting.enabled) {
            return;
        }

        const contentLength = ds.storyContentLength || 800;
        const content = stories.map(s => s.summary).join('\n\n---\n\n').substring(0, contentLength * 5);

        let template = aiSetting.template || '';
        template = template.replace('[10个故事的摘要]', content);

        if (aiSetting.customPrompt) {
            template += '\n\n' + aiSetting.customPrompt;
        }

        try {
            const summary = await ai.call(template, { maxTokens: aiSetting.maxTokens || 3000 });
            
            const level3 = this.getLevel3Archives(worldId);
            const idx = level3.findIndex(e => e.id === entryId);
            if (idx !== -1) {
                level3[idx].summary = summary;
                localStorage.setItem(`story_level3_${worldId}`, JSON.stringify(level3));
            }
        } catch (e) {
            console.error('生成综合摘要失败:', e);
        }
    },
    
    async _createLevel3Summary(worldId, level2Archives, level3Archives) {
        const aiSetting = StoryConfigPlugin.getAISetting('level3Summary', worldId);
        const ds = StoryConfigPlugin.getDataSources(worldId);

        if (!aiSetting.enabled) {
            return;
        }

        const contentLength = ds.storyContentLength || 800;
        const toSummarize = level2Archives.slice(0, 10);
        const content = toSummarize.map(s => s.summary).join('\n\n---\n\n').substring(0, contentLength * 5);

        let template = aiSetting.template || '';
        template = template.replace('[10个故事的摘要]', content);

        if (aiSetting.customPrompt) {
            template += '\n\n' + aiSetting.customPrompt;
        }

        let summary = '';
        try {
            summary = await ai.call(template, { maxTokens: aiSetting.maxTokens || 3000 });
        } catch (e) {
            summary = '多个故事的综合摘要';
        }
        
        const level3Entry = {
            id: Data._genId(),
            title: '故事合集',
            stories: toSummarize.map(s => ({
                title: s.originalTitle || s.title,
                summary: s.summary
            })),
            summary: summary,
            archivedAt: Date.now()
        };
        
        level3Archives.unshift(level3Entry);
        
        for (const story of toSummarize) {
            const idx = level2Archives.findIndex(s => s.id === story.id);
            if (idx !== -1) {
                level2Archives.splice(idx, 1);
            }
        }
        
        localStorage.setItem(`story_level3_${worldId}`, JSON.stringify(level3Archives));
        localStorage.setItem(`story_level2_${worldId}`, JSON.stringify(level2Archives));
    },

    load(archiveId) {
        const world = Data.getCurrentWorld();
        if (!world) return null;
        
        const archives = this.getArchives(world.id);
        const archive = archives.find(a => a.id === archiveId);
        
        if (archive) {
            this.current = Data.getStory(world.id);
            return archive;
        }
        return null;
    },

    load(worldId) {
        this.current = Data.getStory(worldId);
        return this.current;
    },

    resumeArchive(archiveId) {
        const world = Data.getCurrentWorld();
        if (!world) return null;
        
        const archives = this.getArchives(world.id);
        const archive = archives.find(a => a.id === archiveId);
        
        if (!archive || !archive.scenes) return null;
        
        this.current = {
            id: archive.id,
            worldId: world.id,
            startTime: archive.startTime,
            characters: archive.characters,
            scene: archive.scene,
            settings: archive.settings,
            scenes: archive.scenes,
            status: 'ongoing',
            round: archive.scenes.length,
            endTime: null
        };
        
        Data.saveStory(world.id, this.current);
        
        return this.current;
    },

    _buildStartPrompt(characters, scene, settings, playerChar) {
        const charList = characters.map(c => {
            const profile = c.profile || {};
            const adult = c.adultProfile || {};
            return {
                name: c.name,
                gender: c.gender,
                age: c.age,
                appearance: profile.appearance || '',
                personality: profile.personality || '',
                backstory: profile.backstory || '',
                fetish: adult.fetish || [],
                turnOns: adult.turnOns || ''
            };
        });
        
        let playerInfo = '';
        if (playerChar) {
            if (playerChar.isCustom) {
                playerInfo = `\n玩家扮演的角色：${playerChar.name}`;
            } else {
                const profile = playerChar.profile || {};
                const adult = playerChar.adultProfile || {};
                playerInfo = `\n玩家扮演的角色：${playerChar.name}（${profile.personality || ''}，${profile.backstory || ''}）`;
            }
        }
        
        const ctx = Settings.buildPromptContext(settings);
        const world = Data.getCurrentWorld();
        const worldId = world?.id;
        const pluginContext = this._getPluginContext(worldId);
        
        let systemPrompt = '';
        if (typeof StoryConfigPlugin !== 'undefined') {
            const pluginPrompt = StoryConfigPlugin.getWorldSystemPrompt(worldId);
            if (pluginPrompt) {
                systemPrompt = pluginPrompt + '\n\n';
            }
        }
        
        return systemPrompt + `生成一个故事开头：
角色信息：${JSON.stringify(charList)}${playerInfo}
场景设定：${scene || '任意'}
风格要求：${ctx}${pluginContext}

请生成200-500字的故事开头，并自然地引出后续剧情发展的可能性。`;
    },

    _buildContext(characters, settings) {
        const world = Data.getCurrentWorld();
        const worldId = world?.id;
        
        let systemPrompt = '';
        if (typeof StoryConfigPlugin !== 'undefined') {
            const pluginPrompt = StoryConfigPlugin.getWorldSystemPrompt(worldId);
            if (pluginPrompt) {
                systemPrompt = pluginPrompt + '\n\n';
            }
        }
        
        const allHistory = this._getAllHistory(world.id);
        
        const ds = StoryConfigPlugin?.getDataSources ? StoryConfigPlugin.getDataSources(worldId) : null;
        const historyCount = ds?.historyScenes || 3;
        const recentScenes = historyCount > 0 ? this.current.scenes.slice(-historyCount) : [];
        const currentHistory = recentScenes.map((s, i) => {
            let text = s.content;
            if (s.choice) {
                text += `\n[用户选择了：${s.choice}]`;
            }
            return text;
        }).join('\n\n---\n\n');
        
        let historySection = '';
        if (allHistory.length > 0 && historyCount > 0) {
            historySection = `\n\n【之前的故事剧情】\n${allHistory.join('\n\n---\n\n')}`;
        }

        if (currentHistory) {
            historySection += `\n\n【当前故事最新剧情】\n${currentHistory}`;
        }
        
        const charList = this.current.characters;
        let charDesc = '';
        
        if (ds?.charDescriptionLength === 'short') {
            charDesc = charList.map(c => 
                `${c.name}：${c.profile?.personality || '暂无设定'}`
            ).join('；');
        } else if (ds?.charDescriptionLength === 'long') {
            charDesc = charList.map(c => {
                const profile = c.profile || {};
                const stats = c.stats ? `，属性:${JSON.stringify(c.stats)}` : '';
                return `${c.name}：${profile.personality || '暂无设定'}，${profile.appearance || '暂无描述'}，${profile.backstory || '暂无背景'}${stats}`;
            }).join('；');
        } else {
            charDesc = charList.map(c => {
                const profile = c.profile || {};
                return `${c.name}：${profile.personality || '暂无设定'}，${profile.appearance || '暂无描述'}`;
            }).join('；');
        }
        
        const ctx = Settings.buildPromptContext(settings);
        
        const contentLength = ds?.storyContentLength || 800;
        const maxHistoryLength = contentLength * 3;
        let finalHistorySection = historySection;
        if (historySection.length > maxHistoryLength) {
            finalHistorySection = historySection.substring(0, maxHistoryLength) + '\n\n[...]';
        }
        
        return systemPrompt + `基于以下设定继续故事：

角色：${charDesc}
背景：${world?.name || '自定义世界'}
设定：${ctx}
${finalHistorySection}

请生成下一段故事内容（100-300字），通过故事情节自然呈现，并根据内容提供后续发展的可能性。注意：
1. 响应用户上一次的选择
2. 根据角色设定发展故事
3. 适当埋下后续剧情的伏笔`;
    },
    
    _getAllHistory(worldId) {
        const allScenes = [];
        
        const archives = this.getArchives(worldId);
        for (const archive of archives) {
            const title = `[${archive.title}]`;
            
            if (archive.groupSummary && archive.groupSummary.length > 0) {
                for (let i = 0; i < archive.groupSummary.length; i++) {
                    const group = archive.groupSummary[i];
                    if (group.summary && group.summary !== '[待生成总结]') {
                        allScenes.push(`[${archive.title} - 第${i + 1}至${i + 10}幕总结]\n${group.summary}`);
                    } else if (group.scenes && group.scenes.length > 0) {
                        for (const scene of group.scenes) {
                            let text = scene.summary || scene.content;
                            if (scene.choice) {
                                text += `\n[用户选择了：${scene.choice}]`;
                            }
                            allScenes.push(`${title}${text}`);
                        }
                    }
                }
            }
            
            if (archive.scenes && archive.scenes.length > 0) {
                for (const scene of archive.scenes) {
                    let text = scene.summary || scene.content;
                    if (scene.choice) {
                        text += `\n[用户选择了：${scene.choice}]`;
                    }
                    allScenes.push(`${title}${text}`);
                }
            }
        }
        
        const level3 = this.getLevel3Archives(worldId);
        for (const collection of level3) {
            if (collection.summary && collection.summary !== '[待生成综合摘要]') {
                allScenes.push(`[${collection.title}]\n${collection.summary}`);
            }
        }
        
        return allScenes;
    },

    _showLoading(text) {
        document.getElementById('modalBody').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>${text}</p>
            </div>
        `;
        document.getElementById('modalTitle').textContent = '请稍候';
        document.getElementById('modal').classList.add('active');
    },

    _hideLoading() {
        document.getElementById('modal').classList.remove('active');
    },

    getCurrent() {
        return this.current;
    },

    isOngoing() {
        return this.current && this.current.status === 'ongoing';
    },

    getRound() {
        return this.current ? this.current.round : 0;
    },
    
    exportArchive(archiveId) {
        const world = Data.getCurrentWorld();
        if (!world) return null;
        
        let archive = null;
        
        const archives = this.getArchives(world.id);
        archive = archives.find(a => a.id === archiveId);
        
        if (!archive) {
            const archived = this.getArchivedStories(world.id);
            archive = archived.find(a => a.id === archiveId);
        }
        
        if (!archive) return null;
        
        const exportData = {
            type: 'story_archive',
            version: 1,
            exportTime: Date.now(),
            worldId: world.id,
            isArchived: !this.getArchives(world.id).find(a => a.id === archiveId),
            archive: archive
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `故事_${archive.title}_${new Date(archive.startTime).toLocaleDateString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return exportData;
    },
    
    importArchive(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (!data.archive) {
                throw new Error('无效的故事存档文件');
            }
            
            const world = Data.getCurrentWorld();
            if (!world) throw new Error('请先选择一个世界');
            
            const archive = data.archive;
            archive.worldId = world.id;
            archive.id = Data._genId();
            archive.startTime = Date.now();
            
            const archives = this.getArchives(world.id);
            archives.unshift(archive);
            this._checkArchiveForSummaries(world.id);
            
            return archive;
        } catch (e) {
            throw new Error('导入失败：' + e.message);
        }
    },
    
    getArchivedStoriesList(main) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const archived = this.getArchivedStories(world.id);
        
        if (archived.length === 0) {
            return '<div class="empty">暂无归档故事</div>';
        }
        
        return archived.map(a => `
            <div style="padding: 12px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1; cursor: pointer;" onclick="viewArchivedStory('${a.id}')">
                        <div style="font-weight: 500;">${a.title}</div>
                        <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">
                            ${Array.isArray(a.characters) ? a.characters.map(c => c.name).join('、') : a.characters} · ${a.sceneCount}幕 · ${new Date(a.startTime).toLocaleDateString()}
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="exportArchive('${a.id}')" style="font-size: 0.75rem; padding: 6px 10px;" title="导出">📤</button>
                </div>
            </div>
        `).join('');
    },

    _getPluginContext(worldId) {
        const plugins = PluginSystem.getEnabled();
        let context = '';
        
        for (const plugin of plugins) {
            if (plugin.getStoryContext) {
                const pluginCtx = plugin.getStoryContext(worldId);
                if (pluginCtx) {
                    context += '\n' + pluginCtx;
                }
            }
        }
        
        return context;
    }
};

window.Story = Story;
