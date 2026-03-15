const Story = {
    current: null,
    history: [],
    _isCompressing: false,
    
    _getPlugin() {
        return this;
    },
    
    async _ensurePluginsInitialized() {
        if (PluginSystem && !PluginSystem.loaded) {
            await PluginSystem.init();
        }
    },
    
    _validateStartConfig(config) {
        const world = Data.getCurrentWorld();
        if (!world) throw new Error('请先选择一个世界');
        
        const characters = Data.getCharacters(world.id) || [];
        if (characters.length === 0) throw new Error('请先添加角色');
        
        const existingStory = Story.load(world.id);
        const userSelectedNode = window._userSelectedStoryNode;
        if (existingStory && existingStory.status === 'ongoing' && !userSelectedNode) {
            throw new Error('当前世界已有进行中的故事，请先结束或继续当前故事');
        }
        
        const storyNodeName = userSelectedNode || window._currentStoryNode || world.currentStoryNode;
        let currentStoryNodeData = null;
        if (storyNodeName && world.storyNodes) {
            const node = world.storyNodes.find(n => n.name === storyNodeName);
            if (node && node.data) {
                currentStoryNodeData = node.data;
            }
        }
        
        return { world, characters, storyNodeName, currentStoryNodeData };
    },

    _selectCharacters(characters, config) {
        // 确保 characters 是一个数组
        const chars = Array.isArray(characters) ? characters : [];
        const mainChars = chars.filter(c => c && c.role && (c.role === '主角' || c.role === '女主'));
        const selectedChars = Array.isArray(config?.characters) && config.characters.length > 0
            ? chars.filter(c => c && config.characters.includes(c.id))
            : mainChars.length > 0 ? mainChars : chars.slice(0, 3);
        
        let playerCharInfo = null;
        if (config?.playerChar) {
            if (config.playerChar.startsWith('custom:')) {
                playerCharInfo = { name: config.playerChar.substring(7), isCustom: true };
            } else {
                const char = chars.find(c => c && c.id === config.playerChar);
                if (char) {
                    playerCharInfo = { id: char.id, name: char.name, profile: char.profile || {}, adultProfile: char.adultProfile || {} };
                }
            }
        }
        
        return { selectedChars, playerCharInfo };
    },

    _buildHistoryContext(plugin, worldId) {
        const archives = plugin.getArchives(worldId);
        const level3Archives = plugin.getLevel3Archives(worldId);
        const level2Archives = plugin.getLevel2Archives(worldId);
        
        let historyContext = '';
        if (level3Archives.length > 0) {
            historyContext += '\n\n【很久以前的故事】\n';
            for (const l3 of level3Archives) {
                if (l3.summary) {
                    historyContext += l3.summary + '\n\n';
                }
            }
        }
        
        if (level2Archives.length > 0) {
            historyContext += '\n【之前的故事】\n';
            for (const l2 of level2Archives) {
                if (l2.summary) {
                    historyContext += l2.summary + '\n\n';
                }
            }
        }
        
        let lastSummary = '';
        for (let i = archives.length - 1; i >= 0; i--) {
            if (archives[i].fullSummary) {
                lastSummary = archives[i].fullSummary;
                break;
            }
        }
        
        let isResume = false;
        const manualSummary = localStorage.getItem(`story_manual_summary_${worldId}`);
        if (manualSummary && manualSummary.trim()) {
            if (lastSummary) {
                historyContext += '\n【之前保存的剧情总结】\n' + manualSummary;
            } else {
                historyContext += '\n【上一个故事】\n' + manualSummary;
            }
            isResume = true;
        } else if (lastSummary) {
            historyContext += '\n【上一个故事】\n' + lastSummary;
            isResume = true;
        }
        
        return { historyContext, isResume };
    },

    _buildResumePrompt(plugin, world, selectedChars, historyContext) {
        const charNames = selectedChars.map(c => c.name).join('、');
        const playerChar = selectedChars.find(c => c.isPlayer) || selectedChars[0];
        const stage = this._getTemplateStage(world.id, playerChar?.id);
        
        const promptManager = window.PromptManagerPlugin;
        if (promptManager) {
            const presetId = this._getTemplatePresetId('story', world.id, playerChar?.id);
            return promptManager.getTemplateWithPreset('story', presetId, {
                '角色列表': charNames,
                '世界名': world.name,
                '世界设定': world.description || world.name || '',
                '历史剧情': historyContext
            }, stage);
        }
        
        throw new Error('提示词管理插件未加载');
    },

    _buildNewStoryPrompt(plugin, selectedChars, config, settings, playerCharInfo, currentStoryNodeData) {
        const charNames = selectedChars.map(c => c.name).join('、');
        const playerChar = selectedChars.find(c => c.isPlayer) || selectedChars[0];
        const world = Data.getCurrentWorld();
        
        const promptManager = window.PromptManagerPlugin;
        if (promptManager && world) {
            const stage = this._getTemplateStage(world.id, playerChar?.id);
            const presetId = this._getTemplatePresetId('story', world.id, playerChar?.id);
            let prompt = promptManager.getTemplateWithPreset('story', presetId, {
                '角色列表': charNames,
                '场景': config.scene || '',
                '角色JSON': JSON.stringify(selectedChars),
                '世界设定': world.description || world.name || '',
                '角色详情': JSON.stringify(selectedChars)
            }, stage);
            
            if (currentStoryNodeData && currentStoryNodeData.customStartScene) {
                const customScene = currentStoryNodeData.customStartScene;
                const stageInfo = currentStoryNodeData.startStage ? `\n【当前剧情阶段】${currentStoryNodeData.startStage}` : '';
                prompt = prompt.replace(
                    /【场景设定】.*$/m,
                    `【场景设定】${customScene}${stageInfo}`
                );
            }
            
            return prompt;
        }
        
        throw new Error('提示词管理插件未加载或世界未选择');
    },

    _buildStartPrompt(plugin, world, selectedChars, config, settings, playerCharInfo, historyContext, isResume, currentStoryNodeData) {
        if (isResume) {
            return this._buildResumePrompt(plugin, world, selectedChars, historyContext);
        } else {
            return this._buildNewStoryPrompt(plugin, selectedChars, config, settings, playerCharInfo, currentStoryNodeData);
        }
    },

    _checkSimpleStoryMode() {
        const simpleStoryPlugin = PluginSystem.get('simple-story');
        if (simpleStoryPlugin && typeof simpleStoryPlugin.isSimpleStoryMode === 'function') {
            return simpleStoryPlugin.isSimpleStoryMode();
        }
        return false;
    },

    async _updateCharacterStats(worldId, storyContent) {
        const allChars = Data.getCharacters(worldId) || [];
        const oldStats = {};
        for (const char of allChars) {
            const dbChar = Data.getCharacter(worldId, char.id);
            oldStats[char.id] = { ...(dbChar?.stats || char.stats || {}) };
        }
        
        await window.CharacterStatsPlugin?.updateCharacterStats(storyContent, allChars, worldId);
        
        const adultPlugin = window.AdultTagsPlugin;
        if (adultPlugin) {
            adultPlugin.parseAllStatChanges(storyContent, allChars);
        }
        
        const statChanges = {};
        for (const char of allChars) {
            const dbChar = Data.getCharacter(worldId, char.id);
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
        
        return statChanges;
    },

    async _handleTimeChange(worldId, content, plugin, maxTimeJump = 1) {
        const timePlugin = window.WorldTimePlugin;
        if (timePlugin && plugin) {
            const timeChange = plugin.extractTimeChange(content);
            if (timeChange > 0) {
                const actualTimeChange = Math.min(timeChange, maxTimeJump);
                timePlugin.advanceTime(worldId, actualTimeChange);
                console.log(`[时间推进] 开场白时间推进 ${actualTimeChange} 天${timeChange > maxTimeJump ? `（限制最大值${maxTimeJump}天）` : ''}`);
            } else {
                console.log(`[时间] 开场白未指定时间变化，时间保持不变`);
            }
        }
    },

    _createStoryObject(world, selectedChars, settings, playerCharInfo, config, storyNodeName, cleanContent, isResume) {
        return {
            id: Data._genId(),
            worldId: world.id,
            startTime: Date.now(),
            storyNode: storyNodeName,
            characters: selectedChars.map(c => ({
                id: c.id,
                name: c.name,
                profile: c.profile || {},
                adultProfile: c.adultProfile || {},
                stats: c.stats || {}
            })),
            playerChar: playerCharInfo || this.current?.playerChar,
            scene: config.scene || this.current?.scene,
            settings: settings,
            charRatio: config.charRatio || 80,
            scenes: [{ 
                content: cleanContent, 
                choice: null,
                choices: [],
                timestamp: Date.now(),
                summary: ''
            }],
            status: 'ongoing',
            round: 1,
            isResume: isResume
        };
    },

    async _processGeneratedStory(content, world, selectedChars, settings, playerCharInfo, config, storyNodeName, isResume) {
        const plugin = this._getPlugin();
        
        await this._handleTimeChange(world.id, content, plugin, 1);
        
        const cleanContent = plugin.getStoryGenerator().cleanStoryContent(content);
        
        this.current = this._createStoryObject(world, selectedChars, settings, playerCharInfo, config, storyNodeName, cleanContent, isResume);
        
        const firstSummary = await plugin.generateSceneSummary(cleanContent, null);
        this.current.scenes[0].summary = firstSummary;
        
        const choices = await plugin.getStoryGenerator().generateChoices(content, selectedChars, settings);
        this.current.scenes[0].choices = choices;
        
        const statChanges = await this._updateCharacterStats(world.id, cleanContent);
        this.current.scenes[0].statChanges = statChanges;
        
        const allChars = Data.getCharacters(world.id) || [];
        await plugin.getStoryGenerator().extractItemsFromStory(cleanContent, allChars, world.id);
        
        await plugin.getStoryGenerator().updateCharacterRelationships(cleanContent, allChars, world.id);
        
        let protagonistAgeValue = 18;
        const displayTime = window.WorldTimePlugin?.getDisplayTime(world.id);
        if (displayTime) {
            protagonistAgeValue = displayTime.protagonistAge;
        }
        
        PluginSystem.triggerPluginEvent('storyStarted', {
            worldId: world.id,
            characters: selectedChars.map(c => c.name),
            scene: config.scene,
            protagonistAge: protagonistAgeValue
        });
        
        PluginSystem.triggerPluginEvent('sceneGenerated', {
            sceneIndex: 0,
            content: content,
            choice: null
        });
    },

    async start(config) {
        await this._ensurePluginsInitialized();
        
        const { world, characters, storyNodeName, currentStoryNodeData } = this._validateStartConfig(config);
        
        if (window.TimePlugin) {
            window.TimePlugin.initAllCharactersAge(world.id);
        }
        
        this._resetArousalOnNewStory(world.id);
        
        const settings = Settings.get(world.id);
        
        const { selectedChars, playerCharInfo } = this._selectCharacters(characters, config);
        
        const plugin = this._getPlugin();
        if (!plugin) throw new Error('故事配置插件未加载');
        
        const { historyContext, isResume } = this._buildHistoryContext(plugin, world.id);
        
        const prompt = this._buildStartPrompt(plugin, world, selectedChars, config, settings, playerCharInfo, historyContext, isResume, currentStoryNodeData);
        
        const simpleStoryMode = this._checkSimpleStoryMode();
        
        PluginSystem.triggerPluginEvent('beforeStoryGenerate', {
            prompt: prompt,
            simpleStoryMode: simpleStoryMode
        });
        
        const adultTriggeredStart = this._checkAndApplyAdultTagsToStart(world.id, prompt);
        
        if (adultTriggeredStart && adultTriggeredStart.triggered) {
            prompt += '\n\n' + adultTriggeredStart.template;
            const adultPlugin = window.AdultTagsPlugin;
            const needConfirm = adultPlugin && adultPlugin.shouldConfirm();
            
            if (needConfirm) {
                const selectedTags = await this._showAdultConfirmDialog();
                if (selectedTags === null) {
                    console.log('[成人标签] 用户取消添加成人内容');
                    prompt = prompt.replace(/【成人内容要求】[\s\S]*$/gm, '');
                } else if (selectedTags.length > 0) {
                    console.log('[成人标签] 用户选择的玩法:', selectedTags);
                    const promptTag = adultPlugin.buildPromptWithSelectedTags(selectedTags);
                    prompt = prompt.replace(/【成人内容要求】[\s\S]*$/gm, '');
                    prompt += '\n\n' + promptTag;
                }
            }
        }
        
        this._showLoading('正在生成故事开头...');
        
        try {
            let content = await ai.call(prompt, {
                temperature: 0.8,
                length: '中篇'
            });
            
            PluginSystem.triggerPluginEvent('afterStoryGenerate', {
                content: content,
                simpleStoryMode: simpleStoryMode
            });
            
            await this._processGeneratedStory(content, world, selectedChars, settings, playerCharInfo, config, storyNodeName, isResume);
            
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
        
        this.current = Data.getStory(world.id);
        
        if (!world || !this.current) throw new Error('没有进行中的故事');
        if (this.current.status !== 'ongoing') throw new Error('故事已结束，请开始新故事');
        
        if (window.TimePlugin) {
            window.TimePlugin.initAllCharactersAge(world.id);
        }
        
        const settings = Settings.get(world.id);
        let characters = Data.getCharacters(world.id) || [];
        
        if (options.characters && Array.isArray(options.characters) && options.characters.length > 0) {
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
        const plugin = this._getPlugin();
        
        if (choice) {
            const context = plugin.getStoryGenerator().buildContext(this.current, characters, settings);
            const charNames = characters.map(c => c.name).join('、');
            const playerChar = characters.find(c => c.isPlayer) || characters[0];
            
            let userChoiceText = choice;
            if (isItemUse && options.item && options.targetChar) {
                const charName = options.userChar ? options.userChar.name : '';
                userChoiceText = `${charName}对${options.targetChar.name}使用了【${options.item.name}】（效果：${JSON.stringify(options.item.effects || {})}）`;
            } else if (isIntimate) {
                userChoiceText = `亲密互动：${choice}`;
            }
            
            const promptManager = window.PromptManagerPlugin;
            if (promptManager) {
                const stage = this._getTemplateStage(world.id, playerChar?.id);
                const presetId = this._getTemplatePresetId('story', world.id, playerChar?.id);
                
                let intimatePrompt = '';
                if (isIntimate) {
                    intimatePrompt = '请描述亲密互动过程，自然融入剧情。用词直白露骨，直接描写性器官接触、插入、抽动、高潮等细节；描写要流畅如小说，避免罗列；只描述亲密互动过程，自然融入剧情。';
                }
                
                let itemPrompt = '';
                if (isItemUse) {
                    itemPrompt = '请根据物品效果生成相应的剧情，物品效果：' + JSON.stringify(options.item.effects || {});
                }
                
                let adultPrompt = '';
                const adultTriggered = this._checkAndApplyAdultTags(world.id, '');
                if (adultTriggered && adultTriggered.triggered) {
                    adultPrompt = adultTriggered.template;
                    const adultPlugin = window.AdultTagsPlugin;
                    const needConfirm = adultPlugin && adultPlugin.shouldConfirm();
                    
                    if (needConfirm) {
                        const selectedTags = await this._showAdultConfirmDialog();
                        if (selectedTags === null) {
                            console.log('[成人标签] 用户取消添加成人内容');
                            adultPrompt = '';
                        } else if (selectedTags && selectedTags.length > 0) {
                            console.log('[成人标签] 用户选择的玩法:', selectedTags);
                            adultPrompt = adultPlugin.buildPromptWithSelectedTags(selectedTags);
                        }
                    }
                }
                
                prompt = promptManager.getTemplateWithPreset('story', presetId, {
                    '用户选择': userChoiceText,
                    '上下文': context,
                    '角色列表': charNames,
                    '亲密互动': intimatePrompt,
                    '物品使用': itemPrompt,
                    '成人标签': adultPrompt
                }, stage);

             }
        } else {
            const context = plugin.getStoryGenerator().buildContext(this.current, characters, settings);
            const charNames = characters.map(c => c.name).join('、');
            const playerChar = characters.find(c => c.isPlayer) || characters[0];
            
            const promptManager = window.PromptManagerPlugin;
            if (promptManager) {
                const stage = this._getTemplateStage(world.id, playerChar?.id);
                const presetId = this._getTemplatePresetId('story', world.id, playerChar?.id);
                prompt = promptManager.getTemplateWithPreset('story', presetId, {
                    '上下文': context,
                    '角色列表': charNames
                }, stage);
                

            }
        }
        
        const simpleStoryPlugin = PluginSystem.get('simple-story');
        let simpleStoryMode = false;
        if (simpleStoryPlugin && typeof simpleStoryPlugin.isSimpleStoryMode === 'function') {
            simpleStoryMode = simpleStoryPlugin.isSimpleStoryMode();
            }
            
            // 触发故事生成前事件
        PluginSystem.triggerPluginEvent('beforeStoryGenerate', {
            prompt: prompt,
            simpleStoryMode: simpleStoryMode
        });
        
        this._showLoading(isItemUse ? '正在生成物品使用剧情...' : '正在生成故事...');
        
        try {
            let temperature = 0.7;
            let content = await ai.call(prompt, { temperature: temperature, length: '中篇' });
            
            // 触发故事生成后事件
            PluginSystem.triggerPluginEvent('afterStoryGenerate', {
                content: content,
                simpleStoryMode: simpleStoryMode
            });
            
            const timePlugin = window.WorldTimePlugin;
            if (timePlugin && plugin) {
                const timeChange = plugin.extractTimeChange(content);
                if (timeChange > 0) {
                    timePlugin.advanceTime(world.id, timeChange);
                    console.log(`[时间推进] AI指定推进 ${timeChange} 天`);
                } else {
                    console.log(`[时间] AI未指定时间变化，时间保持不变`);
                }
            }
            
            const cleanContent = plugin.getStoryGenerator().cleanStoryContent(content);
            
            const newScene = {
                content: cleanContent,
                choice: choice,
                choices: [],
                timestamp: Date.now()
            };
            
            const summary = await plugin.generateSceneSummary(cleanContent, choice);
            newScene.summary = summary;
            
            this.current.scenes.push(newScene);
            
            const choices = await plugin.getStoryGenerator().generateChoices(content, this.current.characters, settings);
            const lastScene = this.current.scenes[this.current.scenes.length - 1];
            if (lastScene) {
                lastScene.choices = choices;
            }
            
            this.current.round = this.current.scenes.length;
            
            const allChars = Data.getCharacters(world.id) || [];
            const oldStats = {};
            for (const char of allChars) {
                oldStats[char.id] = { ...(char.stats || {}) };
            }
            
            await window.CharacterStatsPlugin?.updateCharacterStats(cleanContent, allChars, world.id);
            
            const adultPlugin = window.AdultTagsPlugin;
            if (adultPlugin) {
                adultPlugin.parseAllStatChanges(cleanContent, allChars);
            }
            
            const statChanges = {};
            for (const char of allChars) {
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
            
            await plugin.getStoryGenerator().extractItemsFromStory(cleanContent, allChars, world.id);
            
            await plugin.getStoryGenerator().updateCharacterRelationships(cleanContent, allChars, world.id);
            
            this._increaseExcitementAfterStory(world.id, cleanContent);
            
            const sceneCount = this.current.scenes.length;
            if (sceneCount > 0 && sceneCount % 5 === 0) {
                window.unlockNextStoryNode && window.unlockNextStoryNode();
            }
            
            Data.saveStory(world.id, this.current);
            plugin.updateArchiveInPlace(world.id, this.current);
            plugin.checkArchiveForSummaries(plugin.getArchives(world.id), world.id);
            this._hideLoading();
            return this.current;
        } catch (err) {
            this._hideLoading();
            throw err;
        }
    },

    _increaseExcitementAfterStory(worldId, storyContent) {
        const adultPlugin = window.AdultTagsPlugin;
        if (!adultPlugin || !adultPlugin.isEnabled()) return;
        
        const characters = Data.getCharacters(worldId) || [];
        if (!characters || characters.length === 0) return;
        
        const playerChar = characters.find(c => c.isPlayer) || characters[0];
        if (!playerChar || !playerChar.stats) return;
        
        const arousal = playerChar.stats.arousal || 0;
        const currentArousal = adultPlugin.getArousal(worldId);
        console.log(`[性欲] 当前性欲: ${arousal}（由AI根据故事内容分析更新），插件性欲: ${currentArousal}`);
        
        const allChars = Data.getCharacters(worldId) || [];
        adultPlugin.parseAllStatChanges(storyContent, allChars);
    },

    _resetArousalOnNewStory(worldId) {
        const adultPlugin = window.AdultTagsPlugin;
        if (!adultPlugin) return;
        
        const characters = Data.getCharacters(worldId) || [];
        if (characters && characters.length > 0) {
            for (const char of characters) {
                if (char.stats) {
                    char.stats.arousal = 0;
                    char.stats.sexArousal = 0;
                    char.stats.sexExcitement = 0;
                    Data.updateCharacter(worldId, char.id, char);
                }
            }
            console.log(`[性欲] 新故事开始，所有角色的性欲已重置为0`);
        }
        
        adultPlugin.clearCooldown(worldId);
        console.log(`[性欲] 新故事开始，冷却列表已清空`);
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
        const characters = Data.getCharacters(world.id) || [];
        
        if (options.characters && Array.isArray(options.characters) && options.characters.length > 0) {
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
        
        const promptManager = window.PromptManagerPlugin;
        let prompt;
        
        if (!promptManager) {
            throw new Error('提示词管理插件未加载');
        }
        
        if (promptManager) {
            const playerChar = currentStory.characters.find(c => c.isPlayer) || currentStory.characters[0];
            const stage = this._getTemplateStage(world.id, playerChar?.id);
            const presetId = this._getTemplatePresetId('generateChoices', world.id, playerChar?.id);
            prompt = promptManager.getTemplateWithPreset('generateChoices', presetId, {
                '内容摘要': lastContent,
                '故事内容': lastContent,
                '内容': lastContent,
                '角色列表': charNames,
                '角色': charNames,
                '上下文备注': contextNote
            }, stage);
        }
        
        const result = await ai.call(prompt, { 
            temperature: aiSetting?.temperature || 0.8,
            length: '中篇'
        });
        
        let choices = [];
        
        // 解析格式：选项1（类型）：内容 或 选项1（日常）：林逸走到书桌前坐下...
        const regex = /选项[1-4]（([^）]+)）[：:]\s*(.+)/g;
        let match;
        while ((match = regex.exec(result)) !== null) {
            const text = match[2].trim();
            // 去掉开头的选项编号
            const cleanText = text.replace(/^[选项\d（日常色色淫荡）\s:：]+/, '').trim();
            choices.push({ type: match[1].trim(), text: cleanText });
        }

        // 备用解析：1. 内容
        if (choices.length === 0) {
            const regex4 = /^[1-4][.、]\s*(.+)$/gm;
            while ((match = regex4.exec(result)) !== null) {
                choices.push({ type: '', text: match[1].trim() });
            }
        }

        // 备用解析：按行分割
        if (choices.length === 0) {
            choices = result.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && line.length < 100)
                .map(text => ({ type: '', text }));
        }
        
        // 过滤掉无效选项
        choices = choices.filter(choice => {
            const text = typeof choice === 'object' ? choice.text : choice;
            if (!text || text.trim() === '') return false;
            if (text.length < 3) return false;
            if (text.includes('生成') && text.includes('选项')) return false;
            if (text.includes('请') && text.includes('输出')) return false;
            if (text.length > 150) return false;
            return true;
        });
        
        return choices.slice(0, 5);
    },

    async end(summary = '') {
        await this._ensurePluginsInitialized();
        const world = Data.getCurrentWorld();
        if (!world || !this.current) throw new Error('没有进行中的故事');

        this._showLoading('正在保存故事...');
        
        let storySummary = summary;
        
        if (!storySummary) {
            storySummary = await this._getPlugin()?.generateStoryTitle(this.current);
        }
        
        const fullSummary = await this._getPlugin()?.generateFullStorySummary(world.id, this.current);
        const corePlot = await this._getPlugin()?.generateCorePlot(world.id, this.current);
        
        const archives = this.getArchives(world.id);
        
        const isDuplicate = archives.some(a => 
            a.stories?.some(s => s.title === storySummary && s.content === fullSummary)
        );
        
        if (isDuplicate) {
            throw new Error('相同内容的故事已存在，请勿重复保存');
        }
        
        let activeArchive = archives.find(a => a.worldId === world.id);
        
        if (activeArchive) {
            activeArchive.stories = activeArchive.stories || [];
            activeArchive.stories.push({
                title: storySummary,
                content: fullSummary,
                corePlot: corePlot,
                endTime: Date.now(),
                sceneCount: this.current.scenes.length,
                characters: this.current.characters
            });
            
            activeArchive.fullSummary = fullSummary;
            activeArchive.sceneCount = this.current.scenes.length;
            activeArchive.endTime = Date.now();
            
            this._getPlugin()?.checkArchiveForSummaries(archives, world.id);
            
            localStorage.setItem(`story_archives_${world.id}`, JSON.stringify(archives));
        } else {
            const archive = {
                id: Data._genId(),
                worldId: world.id,
                title: storySummary,
                fullSummary: fullSummary,
                startTime: this.current.startTime,
                endTime: Date.now(),
                characters: this.current.characters,
                settings: this.current.settings,
                sceneCount: this.current.scenes.length,
                stories: [{
                    title: storySummary,
                    content: fullSummary,
                    corePlot: corePlot,
                    endTime: Date.now(),
                    sceneCount: this.current.scenes.length,
                    characters: this.current.characters
                }]
            };
            
            archives.unshift(archive);
            
            this._getPlugin()?.checkArchiveForSummaries(archives, world.id);
            
            localStorage.setItem(`story_archives_${world.id}`, JSON.stringify(archives));
            
            await this._compressToLevel2(world.id, archives);
        }
        
        this.current.status = 'ended';
        this.current.endTime = Date.now();
        
        Data.saveStory(world.id, null);
        this.current = null;
        
        this._hideLoading();
        
        return activeArchive || archives[0];
    },
    
    async _compressToLevel2(worldId, archives) {
        if (Story._isCompressing) {
            console.log('[压缩] 压缩正在进行中，跳过');
            return;
        }
        
        Story._isCompressing = true;
        
        try {
            const level2Archives = this.getLevel2Archives(worldId);
            
            const allStories = [];
            for (const archive of archives) {
                if (archive.stories) {
                    for (const story of archive.stories) {
                        allStories.push({
                            title: story.title,
                            summary: story.content,
                            endTime: story.endTime,
                            characters: story.characters
                        });
                    }
                }
            }
            
            const MAX_SAVE = 25;
            const COMPRESS_COUNT = 10;
            
            if (allStories.length > MAX_SAVE) {
                const storiesToCompress = allStories.slice(0, COMPRESS_COUNT);
                
                const combinedContent = storiesToCompress.map(s => s.summary).join('\n\n---\n\n');
                const promptManager = window.PromptManagerPlugin;
                const prompt = promptManager.getTemplateWithPreset('level2Summary', 'default', {
                    '一级故事摘要内容': combinedContent,
                    '故事内容': combinedContent,
                    '内容': combinedContent
                });
                const level2Summary = await ai.call(prompt, { temperature: 0.7, maxTokens: 2500 });
                
                level2Archives.unshift({
                    id: Data._genId(),
                    worldId: worldId,
                    summary: level2Summary,
                    storyCount: storiesToCompress.length,
                    createdAt: Date.now()
                });
                
                localStorage.setItem(`story_level2_${worldId}`, JSON.stringify(level2Archives));
                
                const remainingStories = allStories.slice(COMPRESS_COUNT);
                if (remainingStories.length > 0) {
                    for (let i = archives.length - 1; i >= 0; i--) {
                        if (archives[i].stories && archives[i].stories.length > 0) {
                            archives[i].stories = archives[i].stories.slice(0, -Math.min(archives[i].stories.length, COMPRESS_COUNT));
                            if (archives[i].stories.length === 0) {
                                archives.splice(i, 1);
                            }
                            COMPRESS_COUNT -= archives[i].stories.length || 0;
                            if (COMPRESS_COUNT <= 0) break;
                        }
                    }
                    localStorage.setItem(`story_archives_${worldId}`, JSON.stringify(archives));
                }
                
                await this._compressToLevel3(worldId, level2Archives);
            }
        } finally {
            Story._isCompressing = false;
        }
    },
    
    async _compressToLevel3(worldId, level2Archives) {
        const level3Archives = this.getLevel3Archives(worldId);
        
        const MAX_SAVE = 25;
        const COMPRESS_COUNT = 10;
        
        if (level2Archives.length > MAX_SAVE) {
            const level2ToCompress = level2Archives.slice(0, COMPRESS_COUNT);
            
            const combinedContent = level2ToCompress.map(l2 => l2.summary).join('\n\n---\n\n');
            const promptManager = window.PromptManagerPlugin;
            const prompt = promptManager.getTemplateWithPreset('level3Summary', 'default', {
                '二级故事摘要内容': combinedContent,
                '故事内容': combinedContent,
                '内容': combinedContent
            });
            const level3Summary = await ai.call(prompt, { temperature: 0.7, maxTokens: 3500 });
            
            level3Archives.unshift({
                id: Data._genId(),
                worldId: worldId,
                summary: level3Summary,
                level2Count: level2ToCompress.length,
                createdAt: Date.now()
            });
            
            localStorage.setItem(`story_level3_${worldId}`, JSON.stringify(level3Archives));
            
            const remainingLevel2 = level2Archives.slice(COMPRESS_COUNT);
            localStorage.setItem(`story_level2_${worldId}`, JSON.stringify(remainingLevel2));
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

    load(worldId) {
        this.current = Data.getStory(worldId);
        return this.current;
    },

    loadArchive(archiveId) {
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

    resumeArchive(archiveId) {
        const world = Data.getCurrentWorld();
        if (!world) return null;
        
        const archives = this.getArchives(world.id);
        const archive = archives.find(a => a.id === archiveId);

        if (!archive) return null;
        
        this._showLoading('正在生成继续的故事...');
        
        const _this = this;
        
        return (async function() {
            await _this._ensurePluginsInitialized();
            try {
                const characters = Data.getCharacters(world.id) || [];
                const settings = Settings.get(world.id);
                
                let historyContext = '';
                
                const level3Archives = Story.getLevel3Archives(world.id);
                if (level3Archives.length > 0) {
                    historyContext += '\n\n【很久以前的故事】\n';
                    for (const l3 of level3Archives) {
                        if (l3.summary) {
                            historyContext += l3.summary + '\n\n';
                        }
                    }
                }
                
                const level2Archives = Story.getLevel2Archives(world.id);
                if (level2Archives.length > 0) {
                    historyContext += '\n【之前的故事】\n';
                    for (const l2 of level2Archives) {
                        if (l2.summary) {
                            historyContext += l2.summary + '\n\n';
                        }
                    }
                }
                
                if (archive.fullSummary) {
                    historyContext += '\n【上一个故事】\n' + archive.fullSummary;
                }
                
                let archiveCharacters = archive.characters;
                if (archive.stories && archive.stories.length > 0) {
                    const lastStory = archive.stories[archive.stories.length - 1];
                    if (lastStory.characters) {
                        archiveCharacters = lastStory.characters;
                    }
                }
                
                const selectedChars = archiveCharacters && archiveCharacters.length > 0 
                    ? characters.filter(c => archiveCharacters.some(ac => ac.id === c.id))
                    : characters.slice(0, 3);
                
                const charNames = selectedChars.map(c => c.name).join('、');
                
                let prompt;
                const promptManager = window.PromptManagerPlugin;
                if (promptManager) {
                    const playerChar = selectedChars.find(c => c.isPlayer) || selectedChars[0];
                    const stage = this._getTemplateStage(world.id, playerChar?.id);
                    const presetId = this._getTemplatePresetId('storyContinue', world.id, playerChar?.id);
                    prompt = promptManager.getTemplateWithPreset('story', presetId, {
                        '角色列表': charNames,
                        '世界名': world.name,
                        '世界设定': world.description || world.name || '',
                        '历史剧情': historyContext,
                        '之前的故事剧情': historyContext,
                        '当前故事最新剧情': ''
                    }, stage);
                } else {
                    throw new Error('提示词管理插件未加载');
                }
                
                const content = await ai.call(prompt, {
                    temperature: 0.8,
                    length: '中篇'
                });
                const plugin = _this._getPlugin();
                const cleanContent = plugin ? plugin.getStoryGenerator().cleanStoryContent(content) : content;
                
                const sceneSummary = plugin ? await plugin.generateSceneSummary(cleanContent, null) : '';
                const choices = plugin ? await plugin.getStoryGenerator().generateChoices(content, selectedChars, settings) : [];
                
                _this.current = {
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
                    settings: settings,
                    scenes: [{
                        content: cleanContent,
                        choice: null,
                        choices: choices,
                        timestamp: Date.now(),
                        summary: sceneSummary
                    }],
                    status: 'ongoing',
                    round: 1,
                    isResume: true,
                    allHistoryContent: historyContext,
                    fullSummary: archive.stories && archive.stories.length > 0 
                        ? archive.stories[archive.stories.length - 1].content 
                        : archive.fullSummary
                };
                
                Data.saveStory(world.id, _this.current);
                _this._hideLoading();
                
                return _this.current;
            } catch (err) {
                _this._hideLoading();
                throw err;
            }
        })();
    },

    _buildContext(characters, settings) {
        const world = Data.getCurrentWorld();
        const worldId = world?.id;
        

        
        let historySection = '';
        
        const chatHistory = this._getChatHistory(world.id);
        
        if (this.current.allHistoryContent && typeof this.current.allHistoryContent === 'string') {
            historySection = `\n\n【之前的故事剧情】\n${this.current.allHistoryContent}\n\n【当前故事最新剧情】`;
        } else if (this.current.allHistoryContent && Array.isArray(this.current.allHistoryContent) && this.current.allHistoryContent.length > 0) {
            const historyTexts = this.current.allHistoryContent.map(h => h.content).join('\n\n=== 前情提要 ===\n\n');
            historySection = `\n\n【之前的故事剧情】\n${historyTexts}\n\n【当前故事最新剧情】`;
        } else {
            const allHistory = this._getAllHistory(world.id);
            const ds = plugin?.getDataSources ? plugin.getDataSources(worldId) : null;
            const historyCount = ds?.historyScenes || 9999;
            const recentScenes = historyCount > 0 ? this.current.scenes.slice(-historyCount) : [];
            const currentHistory = recentScenes.map((s, i) => {
                let text = s.content;
                if (s.choice) {
                    text += `\n[用户选择了：${s.choice}]`;
                }
                return text;
            }).join('\n\n---\n\n');
            
            if (allHistory.length > 0 && historyCount > 0) {
                historySection = `\n\n【之前的故事剧情】\n${allHistory.join('\n\n---\n\n')}`;
            }

            if (currentHistory) {
                historySection += `\n\n【当前故事最新剧情】\n${currentHistory}`;
            }
        }
        
        if (chatHistory.length > 0) {
            historySection += `\n\n【之前的聊天记录】\n${chatHistory.join('\n\n---\n\n')}`;
        }
        
        const charList = this.current.characters;
        let charDesc = '';
        
        const ds = plugin?.getDataSources ? plugin.getDataSources(worldId) : null;
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
        
        const promptManager = window.PromptManagerPlugin;
        if (promptManager) {
            const playerChar = this.current.characters.find(c => c.isPlayer) || this.current.characters[0];
            const stage = this._getTemplateStage(worldId, playerChar?.id);
            const presetId = this._getTemplatePresetId('storyContinue', worldId, playerChar?.id);
                    const template = promptManager.getTemplateWithPreset('story', presetId, {
                '角色描述': charDesc,
                '角色列表': charDesc,
                '世界名': world?.name || '自定义世界',
                '世界设定': world?.description || world?.name || '',
                '之前的故事剧情': finalHistorySection,
                '当前故事最新剧情': '',
                '历史剧情': finalHistorySection
            }, stage);
            return template;
        }
        
        throw new Error('提示词管理插件未加载');

    },
    
    _getAllHistory(worldId) {
        const allScenes = [];
        
        const level3Archives = this.getLevel3Archives(worldId);
        for (const l3 of level3Archives) {
            if (l3.summary && l3.summary !== '[待生成综合摘要]') {
                allScenes.push(`[三级储存]\n${l3.summary}`);
            }
        }
        
        const level2Archives = this.getLevel2Archives(worldId);
        for (const l2 of level2Archives) {
            if (l2.summary && l2.summary !== '[待生成总结]') {
                allScenes.push(`[二级储存]\n${l2.summary}`);
            }
        }
        
        const archives = this.getArchives(worldId);
        for (const archive of archives) {
            const title = archive.title ? `[${archive.title}]` : '';
            if (archive.fullSummary) {
                allScenes.push(`${title}[一级储存]\n${archive.fullSummary}`);
            }
        }
        
        return allScenes;
    },
    
    _getChatHistory(worldId) {
        const allChatHistory = [];
        
        try {
            const sessionsData = localStorage.getItem(`chat_sessions_${worldId}`);
            if (!sessionsData) return allChatHistory;
            
            const sessions = JSON.parse(sessionsData);
            if (!Array.isArray(sessions) || sessions.length === 0) return allChatHistory;
            
            for (const session of sessions) {
                if (session.messages && Array.isArray(session.messages) && session.messages.length > 0) {
                    const chatLines = [];
                    const sessionTitle = session.title ? `[${session.title}]` : '';
                    
                    for (const msg of session.messages) {
                        if (msg.content) {
                            const role = msg.role === 'user' ? (msg.playerName || '你') : (msg.characterName || '角色');
                            chatLines.push(`${role}：${msg.content}`);
                        }
                    }
                    
                    if (chatLines.length > 0) {
                        allChatHistory.push(`${sessionTitle}聊天记录：\n${chatLines.join('\n')}`);
                    }
                }
            }
        } catch (e) {
            console.error('获取聊天历史失败:', e);
        }
        
        return allChatHistory;
    },
    
    _getTemplateStage(worldId, charId = null) {
        const adultPlugin = window.AdultTagsPlugin;
        if (adultPlugin) {
            return adultPlugin.getStage(null, worldId, charId);
        }
        return 1;
    },
    
    _getTemplatePresetId(category, worldId, charId = null) {
        return 'default';
    },
    

    
    getStoryGenerator() {
        return {
            cleanStoryContent: function(content) {
                return content.replace(/【故事】/g, '').trim();
            },
            
            generateChoices: async function(content, characters, settings) {
                const promptManager = window.PromptManagerPlugin;
                if (!promptManager) {
                    console.warn('[选项生成] 提示词管理插件未加载');
                    return [{ type: '', text: '继续故事' }, { type: '', text: '探索更多' }, { type: '', text: '休息一下' }, { type: '', text: '其他' }];
                }
                
                const charNames = characters.map(c => c.name).join('、');
                
                // 获取上下文信息
                const plugin = PluginSystem.get('story');
                let contextNote = '';
                if (plugin) {
                    try {
                        const generator = plugin.getStoryGenerator();
                        const context = generator.buildContext(settings, characters, settings);
                        if (context) contextNote = context;
                    } catch (e) {
                        console.warn('[选项生成] 获取上下文失败:', e);
                    }
                }
                
                const variables = {
                    '内容摘要': content,
                    '故事内容': content,
                    '内容': content,
                    '角色列表': charNames,
                    '角色': charNames,
                    '上下文': contextNote,
                    '上下文备注': contextNote
                };
                
                const prompt = promptManager.getTemplateWithPreset('generateChoices', 'default', variables);
                
                if (!prompt || !prompt.trim()) {
                    console.warn('[选项生成] 提示词为空');
                    return [{ type: '', text: '继续故事' }, { type: '', text: '探索更多' }, { type: '', text: '休息一下' }, { type: '', text: '其他' }];
                }
                
                const result = await ai.call(prompt, { temperature: 0.8, maxTokens: 200 });
                
                if (!result) {
                    console.warn('[选项生成] AI返回为空');
                    return [{ type: '', text: '继续故事' }, { type: '', text: '探索更多' }, { type: '', text: '休息一下' }, { type: '', text: '其他' }];
                }
                
                if (typeof result !== 'string') {
                    console.warn('[选项生成] AI返回格式错误:', typeof result);
                    return [{ type: '', text: '继续故事' }, { type: '', text: '探索更多' }, { type: '', text: '休息一下' }, { type: '', text: '其他' }];
                }
                
                const lines = result.split('\n');
                if (!lines || lines.length === 0) {
                    console.warn('[选项生成] AI返回内容为空');
                    return [{ type: '', text: '继续故事' }, { type: '', text: '探索更多' }, { type: '', text: '休息一下' }, { type: '', text: '其他' }];
                }
                
                return lines
                    .map(line => line ? line.replace(/^\d+[.、]\s*/, '').trim() : '')
                    .filter(line => line && line.length > 0 && line.length < 100)
                    .slice(0, 5)
                    .map(text => ({ type: '', text }));
            },
            
            buildContext: function(story, characters, settings) {
                const recentScenes = story.scenes.slice(-3);
                return recentScenes.map((scene, index) => {
                    let text = scene.content;
                    if (scene.choice) {
                        text += `\n[用户选择了：${scene.choice}]`;
                    }
                    return text;
                }).join('\n\n---\n\n');
            },
            
            extractItemsFromStory: async function(content, characters, worldId) {
                const promptManager = window.PromptManagerPlugin;
                if (!promptManager) {
                    console.warn('[物品提取] 提示词管理插件未加载');
                    return;
                }

                const variables = {
                    '内容': content,
                    '故事内容': content
                };

                const prompt = promptManager.getTemplateWithPreset('extractItems', 'default', variables);
                
                if (!prompt || !prompt.trim()) {
                    console.warn('[物品提取] 提示词为空');
                    return;
                }

                try {
                    const result = await ai.call(prompt, { temperature: 0.3, maxTokens: 100 });
                    console.log('[物品提取] AI分析结果:', result);
                    
                    // 解析结果并添加物品
                    this._applyExtractedItems(result, worldId);
                } catch (e) {
                    console.error('[物品提取] 失败:', e);
                }
            },
            
            _applyExtractedItems: function(result, worldId) {
                const inventoryPlugin = PluginSystem.get('inventory');
                if (!inventoryPlugin) {
                    console.warn('[物品提取] 物品插件未加载');
                    return;
                }
                
                const library = inventoryPlugin.getItemLibrary();
                const libraryNames = library.map(i => i.name.toLowerCase());
                
                const items = result.split(/[,，、\n]/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && s.length < 20);
                
                let addedCount = 0;
                for (const itemName of items) {
                    const matchIndex = library.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
                    if (matchIndex >= 0) {
                        const libraryItem = library[matchIndex];
                        try {
                            const item = {
                                name: libraryItem.name,
                                type: libraryItem.type,
                                description: libraryItem.description || '故事中提取的物品',
                                effects: libraryItem.effects || {}
                            };
                            inventoryPlugin.addItem(worldId, null, item);
                            console.log('[物品提取] 添加物品:', libraryItem.name);
                            addedCount++;
                        } catch (e) {
                            console.warn('[物品提取] 添加失败:', itemName, e);
                        }
                    } else {
                        console.log('[物品提取] 跳过非素材库物品:', itemName);
                    }
                }
                console.log('[物品提取] 完成，共添加', addedCount, '个物品');
            },
            
            updateCharacterRelationships: function(content, characters, worldId) {
                // 简单实现，实际项目中可能需要更复杂的逻辑
                console.log('[故事生成器] 更新角色关系');
            }
        };
    },
    
    getArchives(worldId) {
        try {
            return JSON.parse(localStorage.getItem(`story_archives_${worldId}`) || '[]');
        } catch { return []; }
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
    
    extractTimeChange(content) {
        // 简单实现，实际项目中可能需要更复杂的逻辑
        return 0;
    },
    
    async generateSceneSummary(content, choice) {
        const promptManager = window.PromptManagerPlugin;
        const prompt = promptManager.getTemplateWithPreset('sceneSummary', 'default', {
            '内容摘要': content,
            '故事内容': content,
            '内容': content
        });
        return await ai.call(prompt, { temperature: 0.7, maxTokens: 100 });
    },
    
    async generateStoryTitle(story) {
        const content = story.scenes.map(s => s.content).join('\n\n');
        const promptManager = window.PromptManagerPlugin;
        const prompt = promptManager.getTemplateWithPreset('storyTitle', 'default', {
            '故事内容': content,
            '内容': content
        });
        return await ai.call(prompt, { temperature: 0.8, maxTokens: 50 });
    },
    
    async generateFullStorySummary(worldId, story) {
        const content = story.scenes.map(s => s.content).join('\n\n');
        const promptManager = window.PromptManagerPlugin;
        const prompt = promptManager.getTemplateWithPreset('level1Summary', 'default', {
            '故事内容': content,
            '内容': content
        });
        return await ai.call(prompt, { temperature: 0.7, maxTokens: 700 });
    },
    
    async generateCorePlot(worldId, story) {
        const content = story.scenes.map(s => s.content).join('\n\n');
        const promptManager = window.PromptManagerPlugin;
        const prompt = promptManager.getTemplateWithPreset('level2Summary', 'default', {
            '故事内容': content,
            '内容': content
        });
        return await ai.call(prompt, { temperature: 0.7, maxTokens: 2500 });
    },
    
    async generateLevel3Summary(worldId, level2Summaries) {
        const content = level2Summaries.map(s => s.summary).join('\n\n---\n\n');
        const promptManager = window.PromptManagerPlugin;
        const prompt = promptManager.getTemplateWithPreset('level3Summary', 'default', {
            '所有故事的摘要': content,
            '故事内容': content,
            '内容': content
        });
        return await ai.call(prompt, { temperature: 0.7, maxTokens: 3500 });
    },
    
    updateArchiveInPlace(worldId, story) {
        // 简单实现，实际项目中可能需要更复杂的逻辑
        console.log('[故事配置] 更新存档');
    },
    
    checkArchiveForSummaries(archives, worldId) {
        // 简单实现，实际项目中可能需要更复杂的逻辑
        console.log('[故事配置] 检查存档摘要');
    },
    

    
    getDataSources(worldId) {
        return {
            historyScenes: 3,
            charDescriptionLength: 'medium',
            storyContentLength: 800
        };
    },

    _checkAndApplyAdultTagsToStart(worldId, prompt) {
        const adultPlugin = window.AdultTagsPlugin;
        if (!adultPlugin || !adultPlugin.isEnabled()) return { triggered: false, template: '' };

        const shouldTrigger = adultPlugin.shouldTrigger('');
        if (!shouldTrigger) {
            console.log('[成人标签] 开头故事未触发关键词，跳过成人内容');
            return { triggered: false, template: '' };
        }

        const adultData = adultPlugin.buildAdultPromptTemplate(worldId, '');
        if (!adultData || !adultData.supplement) return { triggered: false, template: '' };

        return { triggered: true, template: adultData.supplement };
    },

    _checkAndApplyAdultTags(worldId, prompt) {
        const adultPlugin = window.AdultTagsPlugin;
        if (!adultPlugin || !adultPlugin.isEnabled()) return { triggered: false, template: '' };

        const lastContent = this.current?.scenes?.[this.current.scenes.length - 1]?.content || '';
        
        const shouldTrigger = adultPlugin.shouldTrigger(lastContent);
        if (!shouldTrigger) {
            console.log('[成人标签] 场景未匹配关键词，跳过成人内容');
            return { triggered: false, template: '' };
        }

        const adultData = adultPlugin.buildAdultPromptTemplate(worldId, lastContent);
        if (!adultData || !adultData.supplement) return { triggered: false, template: '' };

        return { triggered: true, template: adultData.supplement };
    },

    async _showAdultConfirmDialog() {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            
            if (!modal || !modalTitle || !modalBody) {
                resolve(null);
                return;
            }

            const plugin = window.AdultTagsPlugin;
            const world = Data.getCurrentWorld();
            let tags = [];
            if (plugin && world) {
                const lastContent = this.current?.scenes?.[this.current.scenes.length - 1]?.content || '';
                tags = plugin.selectRandomTags(world.id, 5, null, null, lastContent);
            }

            modalTitle.textContent = '🔞 成人内容触发';
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <p style="margin-bottom: 15px; font-size: 1.1rem;">
                        检测到场景匹配成人标签，请选择要融入的玩法：
                    </p>
                    ${tags.length > 0 ? `
                        <div style="background: var(--bg); padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left; max-height: 300px; overflow-y: auto;">
                            <p style="margin-bottom: 10px; color: var(--text-dim); font-size: 0.9rem;">可多选（点击选择）：</p>
                            ${tags.map((t, i) => `
                                <label style="display: inline-block; padding: 8px 16px; background: var(--card); border: 2px solid var(--border); border-radius: 20px; margin: 4px; cursor: pointer; transition: all 0.2s;">
                                    <input type="checkbox" value="${i}" style="margin-right: 8px;" onchange="this.parentElement.style.background=this.checked?'var(--accent)':'var(--card)';this.parentElement.style.color=this.checked?'var(--bg)':'var(--text)';">
                                    <span>${t}</span>
                                </label>
                            `).join('')}
                        </div>
                    ` : '<p style="color: var(--text-dim);">未匹配到合适的玩法</p>'}
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-primary" id="adultConfirmYes" style="padding: 10px 24px; font-size: 0.95rem;">
                            ✅ 确认选择
                        </button>
                        <button class="btn btn-secondary" id="adultConfirmAll" style="padding: 10px 24px; font-size: 0.95rem;">
                            全部添加
                        </button>
                        <button class="btn btn-secondary" id="adultConfirmNo" style="padding: 10px 24px; font-size: 0.95rem;">
                            ❌ 跳过
                        </button>
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
            
            document.getElementById('adultConfirmYes')?.addEventListener('click', () => {
                const checkboxes = modalBody.querySelectorAll('input[type="checkbox"]:checked');
                const selectedTags = Array.from(checkboxes).map(cb => tags[cb.value]);
                modal.classList.remove('active');
                resolve(selectedTags.length > 0 ? selectedTags : null);
            });
            
            document.getElementById('adultConfirmAll')?.addEventListener('click', () => {
                modal.classList.remove('active');
                resolve(tags);
            });
            
            document.getElementById('adultConfirmNo')?.addEventListener('click', () => {
                modal.classList.remove('active');
                resolve(null);
            });
        });
    },

    _applyAdultTags(worldId, prompt, systemPrompt) {
        const adultPlugin = window.AdultTagsPlugin;
        if (!adultPlugin || !adultPlugin.isEnabled()) return;

        const lastContent = this.current?.scenes?.[this.current.scenes.length - 1]?.content || '';
        
        const shouldTrigger = adultPlugin.shouldTrigger(lastContent);
        if (!shouldTrigger) {
            console.log('[成人标签] 场景未匹配关键词，跳过成人内容');
            return;
        }

        const adultData = adultPlugin.buildAdultPromptTemplate(worldId, lastContent);

        if (!adultData || !adultData.supplement) return;

        prompt += '\n\n' + adultData.supplement;
    },

    _showLoading(text) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modal && modalBody && modalTitle) {
            modalBody.innerHTML = `
                <div class="loading" style="text-align: center; padding: 40px 20px;">
                    <div class="spinner" style="width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <p style="color: var(--text);">${text}</p>
                    <p style="color: var(--text-dim); font-size: 0.85rem; margin-top: 10px;">请稍候，AI正在思考中...</p>
                </div>
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            `;
            modalTitle.textContent = '处理中';
            modal.classList.add('active');
        }
    },

    _hideLoading() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
        }
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
        a.download = `故事_${archive.title}_${archive.startTime ? new Date(archive.startTime).toLocaleDateString() : '未知'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return exportData;
    },
    
    importArchive(jsonString) {
        try {
            if (!jsonString || typeof jsonString !== 'string') {
                throw new Error('导入失败：请提供有效的JSON字符串');
            }
            
            const trimmed = jsonString.trim();
            if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
                throw new Error('导入失败：文件格式无效，必须是JSON对象');
            }
            
            const data = JSON.parse(trimmed);
            
            if (!data.archive) {
                throw new Error('无效的故事存档文件：缺少archive数据');
            }
            
            const archive = data.archive;
            
            if (!archive.title || typeof archive.title !== 'string') {
                throw new Error('无效的故事存档：缺少标题');
            }
            
            if (archive.title.length > 100) {
                throw new Error('标题过长，请确保标题在100个字符以内');
            }
            
            if (!archive.startTime || typeof archive.startTime !== 'number') {
                archive.startTime = Date.now();
            }
            
            if (archive.scenes && !Array.isArray(archive.scenes)) {
                throw new Error('无效的存档数据：scenes必须是数组');
            }
            
            if (archive.characters && !Array.isArray(archive.characters)) {
                throw new Error('无效的存档数据：characters必须是数组');
            }
            
            const world = Data.getCurrentWorld();
            if (!world) throw new Error('请先选择一个世界');
            
            archive.worldId = world.id;
            archive.id = Data._genId();
            
            const archives = this.getArchives(world.id);
            archives.unshift(archive);
            this._getPlugin()?.checkArchiveForSummaries(archives, world.id);
            
            localStorage.setItem(`story_archives_${world.id}`, JSON.stringify(archives));
            
            return archive;
        } catch (e) {
            if (e instanceof SyntaxError) {
                throw new Error('导入失败：文件格式不正确，请确保是有效的JSON文件');
            }
            if (e instanceof RangeError) {
                throw new Error('导入失败：数据过大，请检查文件内容');
            }
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
                            ${Array.isArray(a.characters) ? a.characters.map(c => c.name).join('、') : a.characters} · ${a.sceneCount}幕 · ${a.startTime ? new Date(a.startTime).toLocaleDateString() : '未知'}
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
