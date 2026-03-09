PluginSystem.register('story-config', {
    description: 'AI设置系统 - 自定义AI输出风格和系统限制',
    features: ['自定义系统提示词', '输出风格设置', '输出格式设置', '世界级配置', '故事生成核心功能'],
    
    init() {
        window.StoryConfigPlugin = this;
        console.log('Story-config plugin loaded');
        this._initDefaultPrompts();
        this._initStoryGeneration();
    },
    
    _initDefaultPrompts() {
        const defaultPrompts = {
            systemRole: '你是一个色情故事生成AI。请用色情故事的方式呈现内容。专注于性场景的详细描写，包括肢体动作、内心描写、感官描写和语气描写。只输出故事正文内容，不要包含任何选项、后续发展、剧情走向、选择提示等信息。\n\n【重要限制】剧情中女角色不能和陌生人、路人或其他未建立关系的角色进行亲密行为。所有互动必须由主角和已建立关系的角色完成，如果需要多人参与，请用主角的分身、神奇道具、魔法道具、玩具等来代替。',
            outputRules: '只输出故事正文内容，不要包含任何选项、后续发展、剧情走向、选择提示等信息。用词直白露骨，直接描写性器官接触、插入、抽动、高潮等细节。',
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
            updateCharacterRelationships: this._updateCharacterRelationships.bind(this),
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
    
    _buildStartPrompt(characters, scene, settings, playerChar, charRatio) {
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
        
        const ratio = charRatio || 80;
        if (ratio < 100 && characters.length > 0) {
            const allChars = Data.getCharacters(worldId);
            const selectedCharIds = characters.map(c => c.id);
            const selectedNames = characters.map(c => c.name);
            const otherNames = allChars.filter(c => !selectedCharIds.includes(c.id)).map(c => c.name);
            
            if (otherNames.length > 0) {
                template += `\n\n【角色出场比例】\n重点角色：${selectedNames.join('、')}（占比约${ratio}%）\n其他角色：${otherNames.join('、')}（占比约${100 - ratio}%）\n注意：所有角色都可以出现在剧情中，但重点角色的戏份应该更多。`;
            }
        }

        if (aiSetting.customPrompt) {
            template += '\n\n' + aiSetting.customPrompt;
        }

        if (timePlugin && worldId) {
            const relationContext = timePlugin.getRelationshipContext(worldId);
            if (relationContext) {
                template += relationContext;
            }
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

        const historyCount = ds.historyScenes || 9999;
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
        
        const ratio = currentStory.charRatio || 80;
        if (ratio < 100 && characters.length > 0) {
            const allChars = Data.getCharacters(worldId);
            const selectedCharIds = characters.map(c => c.id);
            const selectedNames = characters.map(c => c.name);
            const otherNames = allChars.filter(c => !selectedCharIds.includes(c.id)).map(c => c.name);
            
            if (otherNames.length > 0) {
                template += `\n\n【角色出场比例】\n重点角色：${selectedNames.join('、')}（占比约${ratio}%）\n其他角色：${otherNames.join('、')}（占比约${100 - ratio}%）\n注意：所有角色都可以出现在剧情中，但重点角色的戏份应该更多。`;
            }
        }

        if (aiSetting.customPrompt) {
            template += '\n\n' + aiSetting.customPrompt;
        }

        if (timePlugin && worldId) {
            const relationContext = timePlugin.getRelationshipContext(worldId);
            if (relationContext) {
                template += relationContext;
            }
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
    
    async _updateCharacterRelationships(storyContent, characters, worldId) {
        const aiSetting = this.getAISetting('updateRelationship', worldId);
        const ds = this.getDataSources(worldId);
        const timePlugin = window.WorldTimePlugin;
        
        if (!aiSetting?.enabled) {
            return;
        }
        
        if (!characters || characters.length === 0) return;
        
        const charNames = characters.map(c => c.name).join('、');
        
        const currentRelations = characters.map(c => {
            const rel = timePlugin.getCharacterRelationship(worldId, c.id);
            return `${c.name}: ID${rel.id}(${rel.emoji}${rel.name})`;
        }).join('；');
        
        const contentLength = ds.storyContentLength || 800;
        let template = aiSetting.template || '';
        template = template.replace('[内容]', storyContent.substring(0, contentLength));
        template = template.replace('[故事内容]', storyContent.substring(0, contentLength));
        template = template.replace('[角色列表]', charNames);
        template = template.replace('[角色]', charNames);
        template = template.replace('[当前关系]', currentRelations);
        
        if (aiSetting.customPrompt) {
            template += '\n\n' + aiSetting.customPrompt;
        }
        
        try {
            const result = await ai.call(template, {
                system: '你是一个角色关系分析助手，根据故事情节分析角色与主角的关系。',
                temperature: aiSetting.temperature || 0.3
            });
            
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return;
            
            let jsonStr = jsonMatch[0];
            
            const updates = JSON.parse(jsonStr);
            
            for (const char of characters) {
                const targetId = updates[char.name];
                if (targetId === undefined || typeof targetId !== 'number') continue;
                
                const currentRel = timePlugin.getCharacterRelationshipLevel(worldId, char.id);
                if (targetId !== currentRel) {
                    const relationTypes = timePlugin.getRelationTypes();
                    const validId = relationTypes.some(r => r.id === targetId) ? targetId : currentRel;
                    
                    timePlugin.setCharacterRelationship(worldId, char.id, validId);
                    
                    const oldRel = timePlugin.getRelationType(currentRel);
                    const newRel = timePlugin.getRelationType(validId);
                    console.log(`[关系更新] ${char.name}: ${oldRel.emoji}${oldRel.name} → ${newRel.emoji}${newRel.name}`);
                }
            }
            
        } catch (e) {
            console.warn('更新角色关系失败:', e);
        }
    },
    
    _getAllHistory(worldId) {
        const Story = window.Story;
        if (!Story) return [];
        
        const archives = Story.getArchives(worldId);
        const allScenes = [];
        
        // 三级储存 - 从全局存储读取
        const level3Archives = Story.getLevel3Archives(worldId);
        for (const l3 of level3Archives) {
            if (l3.summary && l3.summary !== '[待生成综合摘要]') {
                allScenes.push(`[三级储存]\n${l3.summary}`);
            }
        }
        
        // 二级储存 - 从全局存储读取
        const level2Archives = Story.getLevel2Archives(worldId);
        for (const l2 of level2Archives) {
            if (l2.summary && l2.summary !== '[待生成总结]') {
                allScenes.push(`[二级储存]\n${l2.summary}`);
            }
        }
        
        // 一级储存 - 存档列表
        for (const archive of archives) {
            const title = archive.title ? `[${archive.title}]` : '';
            if (archive.fullSummary) {
                allScenes.push(`${title}[一级储存]\n${archive.fullSummary}`);
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
                template: `[系统提示词]

【重要限制】剧情中不能出现陌生人、路人或其他未建立关系的角色。所有互动必须由主角和已建立关系的角色完成，如果需要多人参与，请用主角的分身、神奇道具、魔法道具、玩具等来代替。

生成一个故事开头：
角色信息：[角色JSON]
场景设定：[场景]
风格要求：[风格设置]

请生成200-500字的故事开头，并自然地引出后续剧情发展的可能性。
重要限制：
1. 时间跨度最多1天，不要出现跨越多年、数月或数日的大段时间跳跃
2. 故事应该从故事开始的时间点直接展开
3. 如果需要时间推进，最多推进几小时到1天`,
                customPrompt: ''
            },
            storyContinue: {
                title: '继续故事',
                enabled: true,
                template: `[系统提示词]

【重要限制】剧情中不能出现陌生人、路人或其他未建立关系的角色。所有互动必须由主角和已建立关系的角色完成，如果需要多人参与，请用主角的分身、神奇道具、魔法道具、玩具等来代替。

基于以下设定继续故事：
角色：[角色描述]
背景：[世界名]
设定：[风格设置]
[之前的故事剧情]
[当前故事最新剧情]

请生成下一段故事内容（100-300字），通过故事情节自然呈现。
注意：
1. 响应用户上一次的选择
2. 根据角色设定发展故事
3. 适当埋下后续剧情的伏笔
4. 如果故事中有明确的时间推进（如几小时后、几天后、几个月后等），请在故事结束后另起一行输出【时间变化：X天】或【时间变化：X月】。如果时间没有明显变化，输出【时间变化：0天】。`,
                customPrompt: ''
            },
            itemStory: {
                title: '物品使用剧情',
                enabled: true,
                template: `[系统提示词]

【重要限制】剧情中不能出现陌生人、路人或其他未建立关系的角色。所有互动必须由主角和已建立关系的角色完成，如果需要多人参与，请用主角的分身、神奇道具、魔法道具、玩具等来代替。

根据以下情节继续故事：
[上下文]

【新的情节】
[角色]使用了[物品名]
物品效果：[物品效果]
[物品描述]

请生成100-200字的故事内容。
如果故事中有明确的时间推进，请在故事结束后另起一行输出【时间变化：X天】或【时间变化：X月】。如果时间没有明显变化，输出【时间变化：0天】。`,
                customPrompt: ''
            },
            intimateContinue: {
                title: '亲密互动继续',
                enabled: true,
                template: `[系统提示词]

【重要限制】剧情中不能出现陌生人、路人或其他未建立关系的角色。所有亲密互动必须由主角一人完成，如果需要多人参与，请用主角的分身、神奇道具、魔法道具、玩具等来代替。

根据用户选择的亲密互动继续故事：
[亲密互动内容]

上下文：
[上下文]

角色：[角色列表]

请生成100-200字的故事内容。
如果故事中有明确的时间推进，请在故事结束后另起一行输出【时间变化：X天】或【时间变化：X月】。如果时间没有明显变化，输出【时间变化：0天】。`,
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
            updateRelationship: {
                title: '更新角色关系',
                enabled: true,
                template: `根据以下故事内容，分析角色与主角的关系应该是什么。

故事内容：
[内容]

角色：[角色列表]

当前关系：
[当前关系]

关系库（选择最合适的关系ID）：
0-9: 通用等级（陌生人→认识→熟人→朋友→暧昧→恋人→知己→情人→伴侣→配偶）
10-18: 恋爱细分（女朋友、男朋友、未婚妻、未婚夫、妻子、丈夫、前女友/男友、暗恋对象）
19-32: 血缘（父亲、母亲、儿子、女儿、哥哥、姐姐、弟弟、妹妹、爷爷、奶奶、外公、外婆、孙子、孙女）
33-36: 亲戚（叔叔、阿姨、舅舅、姨妈）
37-45: 社会（老师、学生、同事、上司、下属、合作伙伴、邻居、同学、朋友的朋友）
46-54: 敌对/特殊（敌人、仇人、情敌、竞争对手、背叛者、救命恩人、恩人、债主、债户）

请根据故事情节，判断每个角色与主角的关系应该是什么。返回JSON格式：
{
  "角色名": 目标关系ID
}

注意：
1. 仔细阅读剧情，根据实际发展设置关系
2. 关系可以是任意ID，不一定只能升级
3. 如果关系没有变化，不要在JSON中列出
4. 0表示陌生人，ID越大并不代表越亲密`,
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
                enabled: true,
                template: `请用约500字总结以下故事内容，生成一个简短但包含关键信息的概况摘要：

[故事内容]

要求：
- 严格按照故事中的时间背景和场景设定进行总结
- 保留主要人物、场景和关键剧情
- 描述故事的核心发展和结局
- 简洁明了，概括性强
- 确保摘要与原故事的时间背景、场景设定完全一致，不要添加故事中没有的时间背景或场景元素`,
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
                template: `请用约3000字将以下10个二级故事摘要**合并总结为1个终极摘要**，描述从故事开始到结束的完整宏大叙事：

[10个二级摘要]

要求：
- 不要列出每个二级摘要的单独内容
- 而是统合所有剧情线，用宏大的叙述描述整个故事的来龙去脉
- 包含所有重要人物命运、剧情走向和最终结局`,
                maxTokens: 4000,
                customPrompt: ''
            },
            adultContinue: {
                title: '成人内容继续',
                enabled: true,
                template: `[系统提示词]

【重要限制】剧情中不能出现陌生人、路人或其他未建立关系的角色。所有亲密互动必须由主角一人完成，如果需要多人参与（如使用玩具、按摩棒等道具，或需要分身的场景），请用主角的分身、神奇道具、魔法道具、玩具等来代替。

兴奋值：[兴奋值]/100
当前阶段：[阶段]（[阶段名称]）
尺度级别：[尺度]
阶段限制：[阶段描述]

【必须融入的玩法】（选取1-2个，自然融入剧情）：
[标签列表]

【冷却中的标签】（避免重复使用）：
[冷却列表]

【历史剧情】
[上下文]

请生成100-300字的故事情节，自然融入上述玩法描写。`,
                customPrompt: '',
                addToPrompt: true
            },
            adultStart: {
                title: '成人内容开头',
                enabled: true,
                template: `[系统提示词]

【重要限制】剧情中不能出现陌生人、路人或其他未建立关系的角色。所有亲密互动必须由主角一人完成，如果需要多人参与（如使用玩具、按摩棒等道具，或需要分身的场景），请用主角的分身、神奇道具、魔法道具、玩具等来代替。

兴奋值：[兴奋值]/100
当前阶段：[阶段]（[阶段名称]）
尺度级别：[尺度]
阶段限制：[阶段描述]

【必须融入的玩法】（选取1-2个，自然融入剧情）：
[标签列表]

请生成200-500字的故事开头，自然融入上述玩法。`,
                customPrompt: '',
                addToPrompt: true
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
    },

    extractTimeChange(content) {
        if (!content) return 0;
        
        const timePattern = /【时间变化[：:]\s*(\d+)\s*(天|月|年|小时|小时候|日后|月后|年后)?】/i;
        const match = content.match(timePattern);
        
        if (match) {
            const value = parseInt(match[1], 10);
            const unit = match[2] || '天';
            
            if (unit === '年') {
                return value * 365;
            } else if (unit === '月') {
                return value * 30;
            } else if (unit === '天' || unit === '日后' || unit === '天后') {
                return value;
            } else if (unit === '小时' || unit === '个小时' || unit === '小时后') {
                return Math.ceil(value / 24);
            } else {
                return value;
            }
        }
        
        const hourMatch = content.match(/(\d+)\s*个?小时/);
        if (hourMatch) {
            return Math.ceil(parseInt(hourMatch[1], 10) / 24);
        }
        
        const dayMatch = content.match(/(\d+)\s*天/);
        if (dayMatch) {
            return parseInt(dayMatch[1], 10);
        }
        
        const monthMatch = content.match(/(\d+)\s*个月/);
        if (monthMatch) {
            return parseInt(monthMatch[1], 10) * 30;
        }
        
        return 0;
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

    saveArchives(worldId, archives) {
        localStorage.setItem(`story_archives_${worldId}`, JSON.stringify(archives));
    },

    saveLevel2Archives(worldId, archives) {
        localStorage.setItem(`story_level2_${worldId}`, JSON.stringify(archives));
    },

    saveLevel3Archives(worldId, archives) {
        localStorage.setItem(`story_level3_${worldId}`, JSON.stringify(archives));
    },

    deleteArchive(worldId, archiveId) {
        const archives = this.getArchives(worldId);
        const idx = archives.findIndex(a => a.id === archiveId);
        
        if (idx !== -1) {
            archives.splice(idx, 1);
            this.saveArchives(worldId, archives);
            return true;
        }
        
        return false;
    },

    deleteArchivedStory(worldId, archiveId) {
        const archived = this.getArchivedStories(worldId);
        const idx = archived.findIndex(a => a.id === archiveId);
        
        if (idx !== -1) {
            archived.splice(idx, 1);
            localStorage.setItem(`story_archived_${worldId}`, JSON.stringify(archived));
            return true;
        }
        
        return false;
    },

    deleteLevel2Story(worldId, archiveId) {
        const level2 = this.getLevel2Archives(worldId);
        const idx = level2.findIndex(a => a.id === archiveId);
        
        if (idx !== -1) {
            level2.splice(idx, 1);
            this.saveLevel2Archives(worldId, level2);
            return true;
        }
        
        return false;
    },

    deleteLevel3Story(worldId, archiveId) {
        const level3 = this.getLevel3Archives(worldId);
        const idx = level3.findIndex(a => a.id === archiveId);
        
        if (idx !== -1) {
            level3.splice(idx, 1);
            this.saveLevel3Archives(worldId, level3);
            return true;
        }
        
        return false;
    },

    updateArchiveInPlace(worldId, currentStory) {
        const archives = this.getArchives(worldId);
        const idx = archives.findIndex(a => a.id === currentStory.id);
        
        if (idx !== -1) {
            archives[idx].sceneCount = currentStory.scenes.length;
            archives[idx].fullSummary = currentStory.scenes.map(s => s.content).join('\n\n');
            this.saveArchives(worldId, archives);
        }
    },

    checkArchiveForSummaries(archives, worldId) {
        let changed = false;
        
        let totalStoryCount = 0;
        for (const archive of archives) {
            if (archive.stories && Array.isArray(archive.stories)) {
                totalStoryCount += archive.stories.length;
            } else if (archive.fullSummary) {
                totalStoryCount += 1;
            }
        }
        
        if (totalStoryCount > 25) {
            let storiesToSummarize = [];
            let remainingArchives = [];
            
            for (const archive of archives) {
                if (archive.stories && Array.isArray(archive.stories)) {
                    if (storiesToSummarize.length < 10) {
                        const remaining = archive.stories.slice(10 - storiesToSummarize.length);
                        const toAdd = archive.stories.slice(0, 10 - storiesToSummarize.length);
                        storiesToSummarize = storiesToSummarize.concat(toAdd);
                        if (remaining.length > 0) {
                            remainingArchives.push({ ...archive, stories: remaining });
                        }
                    } else {
                        remainingArchives.push(archive);
                    }
                } else if (archive.fullSummary && storiesToSummarize.length < 10) {
                    storiesToSummarize.push({
                        title: archive.title,
                        content: archive.fullSummary,
                        endTime: archive.endTime,
                        sceneCount: archive.sceneCount,
                        characters: archive.characters
                    });
                } else {
                    remainingArchives.push(archive);
                }
            }
            
            const level2Archives = this.getLevel2Archives(worldId);
            
            for (const story of storiesToSummarize) {
                const level2Entry = {
                    id: Data._genId(),
                    archive: {
                        id: Data._genId(),
                        title: story.title,
                        content: story.content,
                        endTime: story.endTime,
                        sceneCount: story.sceneCount,
                        characters: story.characters
                    },
                    summary: story.content || story.title,
                    createdAt: Date.now()
                };
                level2Archives.unshift(level2Entry);
            }
            
            this.saveLevel2Archives(worldId, level2Archives);
            
            archives.length = 0;
            archives.push(...remainingArchives);
            
            changed = true;
        }
        
        const level2Archives = this.getLevel2Archives(worldId);
        if (level2Archives.length > 25) {
            const level2ToSummarize = level2Archives.slice(0, 10);
            const remainingLevel2 = level2Archives.slice(10);
            
            const level3Archives = this.getLevel3Archives(worldId);
            
            for (const l2 of level2ToSummarize) {
                const level3Entry = {
                    id: Data._genId(),
                    level2Archive: {
                        id: l2.id,
                        summary: l2.summary,
                        createdAt: l2.createdAt
                    },
                    summary: l2.summary,
                    createdAt: Date.now()
                };
                level3Archives.unshift(level3Entry);
            }
            
            this.saveLevel3Archives(worldId, level3Archives);
            this.saveLevel2Archives(worldId, remainingLevel2);
            
            changed = true;
        }
        
        if (changed) {
            this.saveArchives(worldId, archives);
        }
    },

    async generateSceneSummary(content, choice) {
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

    async generateFullStorySummary(worldId, story) {
        try {
            const aiSetting = this.getAISetting('level1Summary', worldId);
            
            if (!aiSetting?.enabled) {
                return this.generateSimpleSummary(story);
            }
            
            const scenes = story.scenes;
            if (!scenes || scenes.length === 0) {
                return '这是一个简短的故事。';
            }
            
            const content = scenes.map((s, i) => {
                let text = s.content;
                if (s.choice) {
                    text += `\n[用户选择了：${s.choice}]`;
                }
                return `[场景${i + 1}]\n${text}`;
            }).join('\n\n');
            
            let template = aiSetting.template || '';
            template = template.replace('[故事内容]', content);
            
            const timePlugin = window.WorldTimePlugin;
            if (timePlugin && worldId) {
                const timeInfo = timePlugin.getDisplayTime(worldId);
                if (timeInfo && timeInfo.formatted) {
                    template += `\n\n【时间背景】故事发生在${timeInfo.formatted}，请严格按照此时间背景进行总结。`;
                }
            }
            
            if (aiSetting.customPrompt) {
                template += '\n\n' + aiSetting.customPrompt;
            }
            
            const result = await ai.call(template, {
                temperature: aiSetting.temperature || 0.3,
                maxTokens: aiSetting.maxTokens || 1000
            });
            
            return result.trim();
        } catch (e) {
            console.error('生成一级总结失败:', e);
            return this.generateSimpleSummary(story);
        }
    },

    generateSimpleSummary(story) {
        const scenes = story.scenes;
        if (!scenes || scenes.length === 0) {
            return '这是一个简短的故事。';
        }
        
        return scenes.map((s, i) => {
            let text = s.content;
            if (s.choice) {
                text += `\n[用户选择了：${s.choice}]`;
            }
            return `[场景${i + 1}]\n${text}`;
        }).join('\n\n');
    },

    async generateStoryTitle(story) {
        try {
            const scenes = story.scenes;
            if (!scenes || scenes.length === 0) {
                return '精彩的故事';
            }
            
            const firstScene = scenes[0]?.content || '';
            const lastScene = scenes[scenes.length - 1]?.content || '';
            
            const charNames = story.characters?.map(c => c.name).join('、') || '角色';
            
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

    async generateGlobalLevel2Summary(worldId, entryId, archives) {
        try {
            const aiSetting = this.getAISetting('level2Summary', worldId);
            if (!aiSetting || !aiSetting.enabled) return;
            
            const content = archives.map(a => a.fullSummary || a.summary).join('\n\n---\n\n');
            
            let template = aiSetting.template || '';
            template = template.replace('[所有场景内容]', content);
            
            if (aiSetting.customPrompt) {
                template += '\n\n' + aiSetting.customPrompt;
            }
            
            ai.call(template, { maxTokens: aiSetting.maxTokens || 2000 }).then(summary => {
                const level2Archives = this.getLevel2Archives(worldId);
                const entry = level2Archives.find(e => e.id === entryId);
                if (entry) {
                    entry.summary = summary;
                    this.saveLevel2Archives(worldId, level2Archives);
                }
            }).catch(e => {
                console.error('生成全局二级总结失败:', e);
            });
        } catch (e) {
            console.error('生成全局二级总结失败:', e);
        }
    },

    async generateGlobalLevel3Summary(worldId, entryId, level2Archives) {
        try {
            const aiSetting = this.getAISetting('level3Summary', worldId);
            if (!aiSetting || !aiSetting.enabled) return;
            
            const content = level2Archives.map(l2 => l2.summary).join('\n\n---\n\n');
            
            let template = aiSetting.template || '';
            template = template.replace('[10个故事的摘要]', content);
            
            if (aiSetting.customPrompt) {
                template += '\n\n' + aiSetting.customPrompt;
            }
            
            ai.call(template, { maxTokens: aiSetting.maxTokens || 3000 }).then(summary => {
                const level3Archives = this.getLevel3Archives(worldId);
                const entry = level3Archives.find(e => e.id === entryId);
                if (entry) {
                    entry.summary = summary;
                    this.saveLevel3Archives(worldId, level3Archives);
                }
            }).catch(e => {
                console.error('生成全局三级总结失败:', e);
            });
        } catch (e) {
            console.error('生成全局三级总结失败:', e);
        }
    },

    async generateLevel2Summary(worldId, entryId, scenes) {
        try {
            const aiSetting = this.getAISetting('level2Summary', worldId);
            if (!aiSetting || !aiSetting.enabled) return;
            
            const content = scenes.map(s => s.summary).join('； ');
            
            let template = aiSetting.template || '';
            template = template.replace('[所有场景内容]', content);
            
            if (aiSetting.customPrompt) {
                template += '\n\n' + aiSetting.customPrompt;
            }
            
            ai.call(template, { maxTokens: aiSetting.maxTokens || 2000 }).then(summary => {
                const archives = this.getArchives(worldId);
                const archive = archives.find(a => a.id === entryId);
                if (archive && archive.level2Stories && archive.level2Stories[0]) {
                    archive.level2Stories[0].summary = summary;
                    this.saveArchives(worldId, archives);
                }
            }).catch(e => {
                console.error('生成二级总结失败:', e);
            });
        } catch (e) {
            console.error('生成二级总结失败:', e);
        }
    },

    async generateLevel3SummaryForArchive(worldId, archiveId, level2Stories) {
        try {
            const aiSetting = this.getAISetting('level3Summary', worldId);
            if (!aiSetting || !aiSetting.enabled) return;
            
            const content = level2Stories.map(s => s.summary).join('\n\n---\n\n');
            
            let template = aiSetting.template || '';
            template = template.replace('[10个故事的摘要]', content);
            
            if (aiSetting.customPrompt) {
                template += '\n\n' + aiSetting.customPrompt;
            }
            
            ai.call(template, { maxTokens: aiSetting.maxTokens || 3000 }).then(summary => {
                const archives = this.getArchives(worldId);
                const archive = archives.find(a => a.id === archiveId);
                if (archive && archive.level3Stories && archive.level3Stories[0]) {
                    archive.level3Stories[0].summary = summary;
                    this.saveArchives(worldId, archives);
                }
            }).catch(e => {
                console.error('生成三级总结失败:', e);
            });
        } catch (e) {
            console.error('生成三级总结失败:', e);
        }
    },

    async generateGroupSummary(worldId, archiveId, scenes) {
        try {
            const aiSetting = this.getAISetting('level2Summary', worldId);
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
            if (archive && archive.level2Stories && archive.level2Stories[0]) {
                archive.level2Stories[0].summary = summary;
                this.saveArchives(worldId, archives);
            }
        } catch (e) {
            console.error('生成十幕总结失败:', e);
        }
    },

    async createLevel2Summary(worldId, story, archives) {
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
        
        this.saveLevel2Archives(worldId, level2Archives);
        this.saveArchives(worldId, archives);
        
        this.generateLevel2Summary(worldId, level2Entry.id, first10Scenes, story.title);
    },

    async generateLevel2SummaryAsync(worldId, entryId, scenes, storyTitle) {
        const aiSetting = this.getAISetting('level2Summary', worldId);
        const ds = this.getDataSources(worldId);

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
                this.saveLevel2Archives(worldId, level2);
            }
            
            const archives = this.getArchives(worldId);
            const archIdx = archives.findIndex(a => a.title === storyTitle || a.title + ' (前10幕)' === level2[idx]?.title);
            if (archIdx !== -1) {
                archives[archIdx].level2Summary = summary;
                this.saveArchives(worldId, archives);
            }
        } catch (e) {
            console.error('生成摘要失败:', e);
        }
    },

    async createLevel3Summary(worldId, level2Archives, level3Archives) {
        const aiSetting = this.getAISetting('level3Summary', worldId);
        const ds = this.getDataSources(worldId);

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
        
        this.saveLevel3Archives(worldId, level3Archives);
        this.saveLevel2Archives(worldId, level2Archives);
    },

    async generateLevel3SummaryAsync(worldId, entryId, stories) {
        const aiSetting = this.getAISetting('level3Summary', worldId);
        const ds = this.getDataSources(worldId);

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
                this.saveLevel3Archives(worldId, level3);
            }
        } catch (e) {
            console.error('生成综合摘要失败:', e);
        }
    },

    exportArchive(worldId, archiveId) {
        let archive = null;
        
        const archives = this.getArchives(worldId);
        archive = archives.find(a => a.id === archiveId);
        
        if (!archive) {
            const archived = this.getArchivedStories(worldId);
            archive = archived.find(a => a.id === archiveId);
        }
        
        if (!archive) return null;
        
        const exportData = {
            type: 'story_archive',
            version: 1,
            exportTime: Date.now(),
            worldId: worldId,
            isArchived: !this.getArchives(worldId).find(a => a.id === archiveId),
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

    importArchive(worldId, jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (!data.archive) {
                throw new Error('无效的故事存档文件');
            }
            
            const archive = data.archive;
            archive.worldId = worldId;
            archive.id = Data._genId();
            archive.startTime = Date.now();
            
            const archives = this.getArchives(worldId);
            archives.unshift(archive);
            this.checkArchiveForSummaries(archives, worldId);
            
            return archive;
        } catch (e) {
            throw new Error('导入失败：' + e.message);
        }
    },

    getArchivedStoriesList(worldId) {
        const archived = this.getArchivedStories(worldId);
        
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
    }
});
