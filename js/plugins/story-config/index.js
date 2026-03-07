PluginSystem.register('story-config', {
    description: 'AI设置系统 - 自定义AI输出风格和系统限制',
    features: ['自定义系统提示词', '输出风格设置', '输出格式设置', '世界级配置', '故事生成核心功能'],
    
    init() {
        console.log('Story-config plugin loaded');
        this._initDefaultPrompts();
        this._initStoryGeneration();
    },
    
    _initDefaultPrompts() {
        const defaultPrompts = {
            systemRole: '你是一个故事生成AI。请用故事的方式呈现内容。',
            outputRules: '只输出故事正文内容，不要包含任何选项、后续发展、剧情走向、选择提示等信息。',
            customRules: ''
        };
        
        if (!localStorage.getItem('story_system_prompts')) {
            localStorage.setItem('story_system_prompts', JSON.stringify(defaultPrompts));
        }
    },
    
    _initStoryGeneration() {
        this.storyGenerator = {
            buildStartPrompt: this._buildStartPrompt.bind(this),
            buildContext: this._buildContext.bind(this),
            generateChoices: this._generateChoices.bind(this),
            cleanStoryContent: this._cleanStoryContent.bind(this),
            updateCharacterProfiles: this._updateCharacterProfiles.bind(this),
            extractItemsFromStory: this._extractItemsFromStory.bind(this),
            getAllHistory: this._getAllHistory.bind(this),
            getPluginContext: this._getPluginContext.bind(this)
        };
    },
    
    getStoryGenerator() {
        return this.storyGenerator;
    },

    getWorldTimeAPI() {
        const world = Data.getCurrentWorld();
        if (!world) return null;
        const timePlugin = window.WorldTimePlugin;
        if (!timePlugin) return null;
        return timePlugin.getDisplayTime(world.id);
    },

    getProtagonistAge() {
        const timeInfo = this.getWorldTimeAPI();
        return timeInfo?.protagonistAge || null;
    },

    getCurrentYear() {
        const timeInfo = this.getWorldTimeAPI();
        return timeInfo?.year || new Date().getFullYear();
    },

    getTimeInfo() {
        const timeInfo = this.getWorldTimeAPI();
        if (!timeInfo) return '';
        if (timeInfo.storyStartAge === null) return '';
        return timeInfo.formatted;
    },
    
    _buildStartPrompt(characters, scene, settings, playerChar) {
        const world = Data.getCurrentWorld();
        const worldId = world?.id;
        const aiSetting = this.getAISetting('storyStart', worldId);
        const ds = this.getDataSources(worldId);

        if (!aiSetting.enabled) {
            return null;
        }

        const timePlugin = window.WorldTimePlugin;
        const timeInfo = worldId && timePlugin ? timePlugin.getDisplayTime(worldId) : null;

        const charList = characters.map(c => {
            const profile = c.profile || {};
            const adult = c.adultProfile || {};
            const charData = { name: c.name };

            if (ds.charFields.includes('gender')) charData.gender = c.gender;
            
            if (ds.charFields.includes('age')) {
                if (timeInfo && timeInfo.storyStartAge !== null && worldId) {
                    charData.age = timePlugin.getCharacterAge(c, worldId);
                } else {
                    charData.age = c.age;
                }
            }
            
            if (ds.charFields.includes('appearance')) charData.appearance = profile.appearance || '';
            if (ds.charFields.includes('personality')) charData.personality = profile.personality || '';
            if (ds.charFields.includes('backstory')) charData.backstory = profile.backstory || '';
            if (ds.includeAdultProfile && ds.charFields.includes('fetish')) charData.fetish = adult.fetish || [];
            if (ds.includeAdultProfile && ds.charFields.includes('turnOns')) charData.turnOns = adult.turnOns || '';
            if (ds.charFields.includes('stats')) charData.stats = c.stats || {};

            return charData;
        });

        let playerInfo = '';
        if (playerChar) {
            if (playerChar.isCustom) {
                playerInfo = `\n玩家扮演的角色：${playerChar.name}`;
            } else {
                const profile = playerChar.profile || {};
                const adult = playerChar.adultProfile || {};
                let details = [];
                if (ds.charFields.includes('personality') && profile.personality) details.push(profile.personality);
                if (ds.charFields.includes('backstory') && profile.backstory) details.push(profile.backstory);
                playerInfo = `\n玩家扮演的角色：${playerChar.name}${details.length > 0 ? '（' + details.join('，') + '）' : ''}`;
            }
        }

        const ctx = Settings.buildPromptContext(settings);
        const pluginContext = this._getPluginContext(worldId);
        let systemPrompt = this.getWorldSystemPrompt(worldId) || '';

        let template = aiSetting.template || '';
        template = template.replace('[系统提示词]', systemPrompt);
        template = template.replace('[角色JSON]', JSON.stringify(charList));
        template = template.replace('[角色信息]', JSON.stringify(charList));
        template = template.replace('[场景]', scene || '任意');
        template = template.replace('[场景设定]', scene || '任意');
        template = template.replace('[风格设置]', ctx + pluginContext);
        template = template.replace('[风格要求]', ctx + pluginContext);

        if (timeInfo && timeInfo.storyStartAge !== null) {
            template = template.replace('[主角年龄]', String(timeInfo.protagonistAge));
            template = template.replace('[故事年份]', String(timeInfo.year));
            template = template.replace('[故事时间]', timeInfo.formatted);
            template = template.replace('[已过年数]', String(timeInfo.yearsPassed));
            template += `\n\n【重要】故事时间设定：主角目前${timeInfo.protagonistAge}岁（故事从${timeInfo.storyStartAge}岁开始，至今已过${timeInfo.yearsPassed}年）。请根据这个年龄设定来编写合适的剧情。`;
        }

        if (aiSetting.customPrompt) {
            template += '\n\n' + aiSetting.customPrompt;
        }

        return template;
    },
    
    _buildContext(currentStory, characters, settings) {
        const world = Data.getCurrentWorld();
        const worldId = world?.id;
        const aiSetting = this.getAISetting('storyContinue', worldId);
        const ds = this.getDataSources(worldId);

        if (!aiSetting.enabled) {
            return null;
        }

        const timePlugin = window.WorldTimePlugin;
        const timeInfo = worldId && timePlugin ? timePlugin.getDisplayTime(worldId) : null;

        let systemPrompt = this.getWorldSystemPrompt(worldId) || '';

        const allHistory = this._getAllHistory(world.id);

        const historyCount = ds.historyScenes || 3;
        const recentScenes = historyCount > 0 ? currentStory.scenes.slice(-historyCount) : [];
        const currentHistoryText = recentScenes.map((s, i) => {
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

        if (currentHistoryText) {
            historySection += `\n\n【当前故事最新剧情】\n${currentHistoryText}`;
        }

        const charDesc = characters.map(c => {
            const profile = c.profile || {};
            const parts = [];
            parts.push(c.name);

            if (timeInfo && timeInfo.storyStartAge !== null && worldId) {
                const dynamicAge = timePlugin.getCharacterAge(c, worldId);
                parts.push(`${dynamicAge}岁`);
            } else if (c.age) {
                parts.push(`${c.age}岁`);
            }

            if (ds.charDescriptionLength === 'short') {
                if (profile.personality) parts.push(profile.personality);
            } else if (ds.charDescriptionLength === 'medium') {
                if (profile.personality) parts.push(profile.personality);
                if (profile.appearance) parts.push(profile.appearance);
                if (profile.backstory) parts.push(profile.backstory);
            } else if (ds.charDescriptionLength === 'long') {
                if (profile.personality) parts.push(profile.personality);
                if (profile.appearance) parts.push(profile.appearance);
                if (profile.backstory) parts.push(profile.backstory);
                if (ds.charFields.includes('stats') && c.stats) {
                    parts.push('属性:' + JSON.stringify(c.stats));
                }
            }

            return parts.join('：');
        }).join('；');

        const ctx = Settings.buildPromptContext(settings);

        let template = aiSetting.template || '';
        template = template.replace('[系统提示词]', systemPrompt);
        template = template.replace('[角色描述]', charDesc);
        template = template.replace('[角色]', charDesc);
        template = template.replace('[世界名]', world?.name || '自定义世界');
        template = template.replace('[背景]', world?.name || '自定义世界');
        template = template.replace('[风格设置]', ctx);
        template = template.replace('[设定]', ctx);
        template = template.replace('[之前的故事剧情]', historySection);
        template = template.replace('[当前故事最新剧情]', currentHistoryText);

        if (timeInfo && timeInfo.storyStartAge !== null) {
            template = template.replace('[主角年龄]', String(timeInfo.protagonistAge));
            template = template.replace('[故事年份]', String(timeInfo.year));
            template = template.replace('[故事时间]', timeInfo.formatted);
            template = template.replace('[已过年数]', String(timeInfo.yearsPassed));
            template += `\n\n【当前故事时间】主角${timeInfo.protagonistAge}岁（从${timeInfo.storyStartAge}岁开始，已过${timeInfo.yearsPassed}年，${timeInfo.formatted}）`;
        }

        if (aiSetting.customPrompt) {
            template += '\n\n' + aiSetting.customPrompt;
        }

        return template;
    },
    
    async _generateChoices(content, characters, settings) {
        const world = Data.getCurrentWorld();
        const worldId = world?.id;
        const aiSetting = this.getAISetting('generateChoices', worldId);
        const ds = this.getDataSources(worldId);

        if (!aiSetting.enabled) {
            return ['继续发展当前情节', '深入探索某个细节', '改变故事方向'];
        }

        const charNames = characters.map(c => c.name).join('、');

        let systemPrompt = this.getWorldSystemPrompt(worldId) || '';

        const contentLength = ds.storyContentLength || 800;
        let template = aiSetting.template || '';
        template = template.replace('[系统提示词]', systemPrompt);
        template = template.replace('[内容摘要]', content.substring(0, contentLength));
        template = template.replace('[故事内容]', content.substring(0, contentLength));
        template = template.replace('[内容]', content.substring(0, contentLength));
        template = template.replace('[角色列表]', charNames);
        template = template.replace('[角色]', charNames);

        if (aiSetting.customPrompt) {
            template += '\n\n' + aiSetting.customPrompt;
        }

        try {
            const result = await ai.call(template, {
                system: systemPrompt,
                temperature: aiSetting.temperature || 0.8
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
    
    async _updateCharacterProfiles(storyContent, characters, worldId) {
        const aiSetting = this.getAISetting('updateStats', worldId);
        const ds = this.getDataSources(worldId);

        if (!aiSetting.enabled) {
            return;
        }

        if (!characters || characters.length === 0) return;

        const charNames = characters.map(c => c.name).join('、');

        const contentLength = ds.storyContentLength || 800;
        let template = aiSetting.template || '';
        template = template.replace(/\[内容\]/g, storyContent.substring(0, contentLength));
        template = template.replace(/\[故事内容\]/g, storyContent.substring(0, contentLength));
        template = template.replace('[角色列表]', charNames);
        template = template.replace('[角色]', charNames);

        if (aiSetting.customPrompt) {
            template += '\n\n' + aiSetting.customPrompt;
        }

        try {
            const result = await ai.call(template, {
                system: '你是一个角色属性分析助手，根据故事情节分析角色数值属性的合理变化。',
                temperature: aiSetting.temperature || 0.3
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
            
            PluginSystem.triggerPluginEvent('characterStatsUpdated', {
                characters: characters.map(c => ({ id: c.id, name: c.name, stats: c.stats }))
            });
            
        } catch (e) {
            console.warn('更新角色属性失败:', e);
        }
    },
    
    async _extractItemsFromStory(storyContent, characters, worldId) {
        const aiSetting = this.getAISetting('extractItems', worldId);
        const ds = this.getDataSources(worldId);

        if (!aiSetting.enabled) {
            return;
        }

        const inventoryPlugin = PluginSystem.get('inventory');
        if (!inventoryPlugin) return;

        const library = inventoryPlugin.getItemLibrary();
        if (library.length === 0) return;

        if (!characters || characters.length === 0) return;

        const itemNames = library.map(i => i.name).join('、');
        const charNames = characters.map(c => c.name).join('、');

        const contentLength = ds.storyContentLength || 800;
        let template = aiSetting.template || '';
        template = template.replace('[物品库]', itemNames);
        template = template.replace('[物品列表]', itemNames);
        template = template.replace('[角色列表]', charNames);
        template = template.replace('[角色]', charNames);
        template = template.replace(/\[内容\]/g, storyContent.substring(0, contentLength));
        template = template.replace(/\[故事内容\]/g, storyContent.substring(0, contentLength));

        if (aiSetting.customPrompt) {
            template += '\n\n' + aiSetting.customPrompt;
        }

        try {
            const result = await ai.call(template, {
                system: '你是一个物品分析助手，根据故事情节识别物品和获得者。',
                temperature: aiSetting.temperature || 0.3
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
    
    _getAllHistory(worldId) {
        const Story = window.Story;
        if (!Story) return [];
        
        const allScenes = [];
        
        const archives = Story.getArchives(worldId);
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
                    let text = scene.content;
                    if (scene.choice) {
                        text += `\n[用户选择了：${scene.choice}]`;
                    }
                    allScenes.push(`${title}\n${text}`);
                }
            }
            if (archive.level2Summary && archive.level2Summary !== '[待生成摘要]') {
                allScenes.push(`[${archive.title} - 前10幕摘要]\n${archive.level2Summary}`);
            }
        }
        
        const level2 = Story.getLevel2Archives(worldId);
        for (const story of level2) {
            if (story.summary && story.summary !== '[待生成摘要]') {
                allScenes.push(`[${story.originalTitle || story.title}]\n${story.summary}`);
            }
        }
        
        const level3 = Story.getLevel3Archives(worldId);
        for (const collection of level3) {
            if (collection.summary && collection.summary !== '[待生成综合摘要]') {
                allScenes.push(`[${collection.title}]\n${collection.summary}`);
            }
        }
        
        return allScenes;
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
    },
    
    _getDefaultAISettings() {
        return {
            dataSources: {
                title: '数据源设置',
                enabled: true,
                charFields: ['name', 'gender', 'age', 'appearance', 'personality', 'backstory', 'fetish', 'turnOns'],
                storyContentLength: 800,
                historyScenes: 3,
                charDescriptionLength: 'medium',
                includeAdultProfile: true
            },
            storyStart: {
                title: '故事开头生成',
                enabled: true,
                template: `[系统提示词]\n\n生成一个故事开头：\n角色信息：[角色JSON]\n场景设定：[场景]\n风格要求：[风格设置]\n\n请生成200-500字的故事开头，并自然地引出后续剧情发展的可能性。`,
                customPrompt: ''
            },
            storyContinue: {
                title: '继续故事',
                enabled: true,
                template: `[系统提示词]\n\n基于以下设定继续故事：\n角色：[角色描述]\n背景：[世界名]\n设定：[风格设置]\n[之前的故事剧情]\n[当前故事最新剧情]\n\n请生成下一段故事内容（100-300字），通过故事情节自然呈现。\n注意：\n1. 响应用户上一次的选择\n2. 根据角色设定发展故事\n3. 适当埋下后续剧情的伏笔`,
                customPrompt: ''
            },
            itemStory: {
                title: '物品使用剧情',
                enabled: true,
                template: `[系统提示词]\n\n根据以下情节继续故事：\n[上下文]\n\n【新的情节】\n[角色]使用了[物品名]\n物品效果：[物品效果]\n[物品描述]\n\n请生成100-200字的故事内容。`,
                customPrompt: ''
            },
            intimateContinue: {
                title: '亲密互动继续',
                enabled: true,
                template: `[系统提示词]\n\n根据用户选择的亲密互动继续故事：\n[亲密互动内容]\n\n上下文：\n[上下文]\n\n角色：[角色列表]\n\n请生成100-200字的故事内容。`,
                customPrompt: ''
            },
            generateChoices: {
                title: '生成剧情选项',
                enabled: true,
                template: `[系统提示词]\n\n基于以下故事内容，生成3个让用户选择的剧情分支选项：\n\n故事内容：\n[内容摘要]\n\n角色：[角色列表]\n\n请生成3个符合故事发展、让用户决定剧情走向的选择项。每个选项用一句话描述，格式如下（只需要选项，不要其他内容）：\n1. [选项1描述]\n2. [选项2描述]\n3. [选项3描述]`,
                temperature: 0.8,
                customPrompt: ''
            },
            updateStats: {
                title: '更新角色属性',
                enabled: true,
                template: `根据以下故事内容，分析角色在剧情中的数值属性变化。\n\n故事内容：\n[内容]\n\n角色：[角色列表]\n\n可用属性：\n- health (生命 0-200)\n- energy (体力 0-200)\n- charm (魅力 0-200)\n- intelligence (智力 0-200)\n- strength (力量 0-200)\n- agility (敏捷 0-200)\n- sexArousal (欲望 0-200)\n- sexLibido (性欲 0-200)\n- sexSensitivity (敏感 0-200)\n- affection (好感 0-200)\n- trust (信任 0-200)\n- intimacy (亲密 0-200)\n\n请分析故事情节，判断每个角色的数值属性应该有什么变化。返回JSON格式：\n{\n  "角色名": {\n    "属性名": 变化值\n  }\n}\n\n注意：\n1. 根据剧情合理设置变化值，一般单次变化在-20到+20之间\n2. 如果某个属性没有变化，不要在JSON中列出\n3. 如果所有属性都没变化，返回空对象 {}`,
                temperature: 0.3,
                customPrompt: ''
            },
            extractItems: {
                title: '提取物品信息',
                enabled: true,
                template: `根据以下故事内容，分析是否有出现以下物品（从物品库中匹配），并识别哪个角色获得了物品：\n\n物品库：[物品列表]\n\n角色：[角色列表]\n\n故事内容：\n[内容]\n\n请分析故事中物品的获得和使用情况，返回JSON格式：\n{\n  "获得": [\n    {"物品": "物品名", "角色": "角色名"}\n  ],\n  "使用": [\n    {"物品": "物品名", "角色": "角色名"}\n  ]\n}\n\n注意：\n1. "获得"指角色获得/拥有的物品\n2. "使用"指角色使用/消耗的物品\n3. 如果物品没有明确指定给哪个角色，默认给第一个角色\n4. 只返回与物品库中物品名称匹配的内容\n5. 如果没有匹配，返回空数组`,
                temperature: 0.3,
                customPrompt: ''
            },
            level1Summary: {
                title: '一级故事摘要（每个剧情结束时生成）',
                enabled: false,
                template: `请用约500字总结以下故事内容，生成一个简短但包含关键信息的概况摘要：

[故事内容]

要求：
- 保留主要人物、场景和关键剧情
- 描述故事的核心发展和结局
- 简洁明了，概括性强`,
                maxTokens: 1000,
                customPrompt: ''
            },
            level2Summary: {
                title: '二级综合摘要（每次总结10个一级）',
                enabled: true,
                template: `请用约2000字将以下10个一级故事摘要**合并总结为1个综合摘要**，描述从开始到结束期间的完整剧情主线：\n\n[10个一级摘要]\n\n要求：\n- 不要列出每个一级摘要的单独内容\n- 而是按时间顺序，用连贯的叙述描述整个故事的主要发展\n- 整合所有人物关系和剧情线索，保留核心剧情和关键转折点`,
                maxTokens: 3000,
                customPrompt: ''
            },
            level3Summary: {
                title: '三级终极摘要（每次总结10个二级）',
                enabled: true,
                template: `请用约3000字将以下10个二级故事摘要**合并总结为1个终极摘要**，描述从故事开始到结束的完整宏大叙事：\n\n[10个二级摘要]\n\n要求：\n- 不要列出每个二级摘要的单独内容\n- 而是统合所有剧情线，用宏大的叙述描述整个故事的来龙去脉\n- 包含所有重要人物命运、剧情走向和最终结局`,
                maxTokens: 4000,
                customPrompt: ''
            }
        };
    },

    getAISettings() {
        const stored = localStorage.getItem('story_ai_settings');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {}
        }
        return this._getDefaultAISettings();
    },

    saveAISettings(settings) {
        localStorage.setItem('story_ai_settings', JSON.stringify(settings));
    },

    getWorldAISettings(worldId) {
        if (!worldId) return this.getAISettings();
        const stored = localStorage.getItem(`story_ai_settings_${worldId}`);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {}
        }
        return this.getAISettings();
    },

    saveWorldAISettings(worldId, settings) {
        localStorage.setItem(`story_ai_settings_${worldId}`, JSON.stringify(settings));
    },

    getAISetting(key, worldId = null) {
        let settings = worldId ? this.getWorldAISettings(worldId) : this.getAISettings();
        if (!settings) {
            settings = this._getDefaultAISettings();
        }
        return settings?.[key] || this._getDefaultAISettings()?.[key];
    },

    getDataSources(worldId = null) {
        return this.getAISetting('dataSources', worldId);
    },

    getWorldSystemPrompt(worldId) {
        let aiSettings = worldId ? this.getWorldAISettings(worldId) : this.getAISettings();
        if (!aiSettings) {
            aiSettings = this._getDefaultAISettings();
        }
        const storyStart = aiSettings?.storyStart;
        if (storyStart?.template) {
            return storyStart.template.split('\n')[0] || '你是一个故事生成AI。';
        }
        return '你是一个故事生成AI。请用故事的方式呈现内容。';
    },

    getTimeAPI() {
        return {
            getWorldTimeAPI: this.getWorldTimeAPI.bind(this),
            getProtagonistAge: this.getProtagonistAge.bind(this),
            getCurrentYear: this.getCurrentYear.bind(this),
            getTimeInfo: this.getTimeInfo.bind(this)
        };
    }
});

window.StoryConfigPlugin = PluginSystem.get('story-config');
