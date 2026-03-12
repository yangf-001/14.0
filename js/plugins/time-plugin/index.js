const TimePlugin = {
    _config: {
        enabled: true,
        showAgeInStory: true,
        birthdayEnabled: true,
        birthdayAdvanceDays: 7
    },

    _relationTypes: [],
    _relationLoaded: false,

    setCharacterBirthday(worldId, charId, month, day) {
        const timeData = this._getWorldTime(worldId);
        if (!timeData.characterBirthdays) {
            timeData.characterBirthdays = {};
        }
        timeData.characterBirthdays[charId] = { month: parseInt(month), day: parseInt(day) };
        this._saveWorldTime(worldId, timeData);
    },

    getCharacterBirthday(worldId, charId) {
        const timeData = this._getWorldTime(worldId);
        return timeData.characterBirthdays?.[charId] || null;
    },

    getCharacterBirthdayString(worldId, charId) {
        const birthday = this.getCharacterBirthday(worldId, charId);
        if (!birthday) return null;
        return `${birthday.month}月${birthday.day}日`;
    },

    getCharactersWithBirthday(worldId) {
        const timeData = this._getWorldTime(worldId);
        const characters = Data.getCharacters(worldId);
        const birthdays = timeData.characterBirthdays || {};
        
        return characters
            .filter(char => birthdays[char.id])
            .map(char => ({
                id: char.id,
                name: char.name,
                month: birthdays[char.id].month,
                day: birthdays[char.id].day,
                birthdayString: `${birthdays[char.id].month}月${birthdays[char.id].day}日`
            }));
    },

    getUpcomingBirthdays(worldId, days = 7) {
        const timeData = this._getWorldTime(worldId);
        const currentYear = timeData.currentYear;
        const currentMonth = timeData.currentMonth;
        const currentDay = timeData.currentDay;
        
        const birthdays = timeData.characterBirthdays || {};
        const characters = Data.getCharacters(worldId);
        const upcoming = [];
        
        for (const char of characters) {
            const b = birthdays[char.id];
            if (!b) continue;
            
            let isUpcoming = false;
            if (b.month > currentMonth || (b.month === currentMonth && b.day >= currentDay)) {
                const daysUntil = (b.month - currentMonth) * 30 + (b.day - currentDay);
                if (daysUntil <= days) {
                    isUpcoming = true;
                }
            } else {
                const daysUntil = (12 - currentMonth + b.month) * 30 + (b.day - currentDay);
                if (daysUntil <= days) {
                    isUpcoming = true;
                }
            }
            
            if (isUpcoming) {
                const daysUntil = b.month > currentMonth || (b.month === currentMonth && b.day >= currentDay)
                    ? (b.month - currentMonth) * 30 + (b.day - currentDay)
                    : (12 - currentMonth + b.month) * 30 + (b.day - currentDay);
                
                upcoming.push({
                    id: char.id,
                    name: char.name,
                    month: b.month,
                    day: b.day,
                    birthdayString: `${b.month}月${b.day}日`,
                    daysUntil: daysUntil,
                    isToday: b.month === currentMonth && b.day === currentDay
                });
            }
        }
        
        return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    },

    checkBirthdayEvents(worldId) {
        const config = this._getConfig();
        if (!config.birthdayEnabled) return [];
        
        const timeData = this._getWorldTime(worldId);
        const birthdays = timeData.characterBirthdays || {};
        const characters = Data.getCharacters(worldId);
        const events = [];
        
        for (const char of characters) {
            const b = birthdays[char.id];
            if (!b) continue;
            
            if (b.month === timeData.currentMonth && b.day === timeData.currentDay) {
                const baseAge = timeData.characterAges?.[char.id]?.baseAge || char.age;
                const yearsPassed = timeData.currentYear - (timeData.storyStartYear || timeData.currentYear);
                const currentAge = (timeData.protagonistAge || baseAge) + (char.age - (timeData.protagonistAge || baseAge)) + yearsPassed;
                
                events.push({
                    type: 'birthday',
                    charId: char.id,
                    charName: char.name,
                    age: currentAge + 1,
                    birthdayString: `${b.month}月${b.day}日`
                });
            }
        }
        
        return events;
    },

    getBirthdayContext(worldId) {
        const config = this._getConfig();
        if (!config.birthdayEnabled) return '';
        
        const upcoming = this.getUpcomingBirthdays(worldId, config.birthdayAdvanceDays || 7);
        if (upcoming.length === 0) return '';
        
        const today = upcoming.filter(b => b.isToday);
        const soon = upcoming.filter(b => !b.isToday);
        
        let context = '\n【生日信息】';
        
        if (today.length > 0) {
            context += '\n今天是以下角色的生日：' + today.map(b => `${b.name}(${b.birthdayString})`).join('、') + '！';
        }
        
        if (soon.length > 0) {
            context += '\n近期生日：' + soon.map(b => `${b.name}(${b.birthdayString},还有${b.daysUntil}天)`).join('、') + '。';
        }
        
        return context;
    },

    getBirthdayAPI() {
        return {
            setCharacterBirthday: this.setCharacterBirthday.bind(this),
            getCharacterBirthday: this.getCharacterBirthday.bind(this),
            getCharacterBirthdayString: this.getCharacterBirthdayString.bind(this),
            getCharactersWithBirthday: this.getCharactersWithBirthday.bind(this),
            getUpcomingBirthdays: this.getUpcomingBirthdays.bind(this),
            checkBirthdayEvents: this.checkBirthdayEvents.bind(this),
            getBirthdayContext: this.getBirthdayContext.bind(this)
        };
    },

    async _loadRelationTypes() {
        if (this._relationLoaded) return;
        
        const getUserContentPath = () => {
            const script = document.currentScript;
            if (script && script.src) {
                const scriptUrl = new URL(script.src);
                const pluginDir = scriptUrl.pathname.replace(/[^/]*$/, '');
                return pluginDir + 'user-content/';
            }
            
            const scripts = document.getElementsByTagName('script');
            for (let s of scripts) {
                if (s.src && s.src.includes('time-plugin')) {
                    const scriptUrl = new URL(s.src);
                    const pluginDir = scriptUrl.pathname.replace(/[^/]*$/, '');
                    return pluginDir + 'user-content/';
                }
            }
            
            return 'js/plugins/time-plugin/user-content/';
        };
        
        const possiblePaths = [
            getUserContentPath() + 'relationships.txt'
        ];
        
        for (const path of possiblePaths) {
            try {
                const response = await fetch(path);
                if (response && response.ok) {
                    const text = await response.text();
                    
                    const lines = text.split('\n');
                    this._relationTypes = [];
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('[')) {
                            continue;
                        }
                        
                        const parts = trimmed.split('|');
                        if (parts.length >= 4) {
                            this._relationTypes.push({
                                id: parseInt(parts[0], 10),
                                name: parts[1],
                                emoji: parts[2],
                                description: parts[3]
                            });
                        }
                    }
                    
                    this._relationLoaded = true;
                    console.log('[TimePlugin] 关系库加载成功:', this._relationTypes.length, '种关系，路径:', path);
                    return;
                }
            } catch (e) {
                console.warn('[TimePlugin] 尝试加载关系库失败:', path, e);
            }
        }
        
        console.warn('[TimePlugin] 所有路径都失败，使用默认关系');
        this._relationTypes = [
            { id: 0, name: '陌生人', emoji: '👤', description: '初次见面，互不了解' },
            { id: 1, name: '认识', emoji: '👋', description: '知道对方的名字和基本身份' },
            { id: 2, name: '熟人', emoji: '🤝', description: '有过交集，但关系较浅' },
            { id: 3, name: '朋友', emoji: '👫', description: '可以正常交流，有一定信任' },
            { id: 4, name: '暧昧', emoji: '💕', description: '对对方有好感，关系微妙' },
            { id: 5, name: '恋人', emoji: '💖', description: '开始交往，确认恋爱关系' },
            { id: 6, name: '女朋友', emoji: '💑', description: '亲密的恋爱关系' },
            { id: 7, name: '未婚妻', emoji: '💍', description: '订婚后的关系' },
            { id: 8, name: '妻子', emoji: '🏩', description: '婚姻关系' }
        ];
        this._relationLoaded = true;
    },

    _getConfig() {
        const stored = localStorage.getItem('time_plugin_config');
        if (stored) {
            try {
                return { ...this._config, ...JSON.parse(stored) };
            } catch (e) {}
        }
        return this._config;
    },

    _saveConfig(config) {
        localStorage.setItem('time_plugin_config', JSON.stringify(config));
    },

    _getWorldTime(worldId) {
        const key = `world_time_${worldId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            worldId: worldId,
            currentYear: 2024,
            currentMonth: 1,
            currentDay: 1,
            storyStartYear: null,
            protagonistAge: null,
            characterAges: {},
            timeSpeed: 1,
            lastUpdate: Date.now(),
            characterRelations: {}
        };
    },

    _saveWorldTime(worldId, timeData) {
        const key = `world_time_${worldId}`;
        timeData.lastUpdate = Date.now();
        localStorage.setItem(key, JSON.stringify(timeData));
    },

    getConfig() {
        return this._getConfig();
    },

    saveConfig(config) {
        this._saveConfig(config);
        this._config = config;
    },

    getWorldTime(worldId) {
        return this._getWorldTime(worldId);
    },

    saveWorldTime(worldId, timeData) {
        this._saveWorldTime(worldId, timeData);
    },

    resetWorldTime(worldId) {
        const key = `world_time_${worldId}`;
        localStorage.removeItem(key);
    },

    resetRelationships(worldId) {
        const timeData = this._getWorldTime(worldId);
        timeData.characterRelations = {};
        this._saveWorldTime(worldId, timeData);
    },

    setStoryStartTime(worldId, protagonistAge, startYear = 2024) {
        const timeData = this._getWorldTime(worldId);
        timeData.currentYear = startYear;
        timeData.currentMonth = 1;
        timeData.currentDay = 1;
        timeData.storyStartYear = startYear;
        timeData.protagonistAge = protagonistAge;
        this._saveWorldTime(worldId, timeData);
        return timeData;
    },

    setCharacterBaseAge(worldId, charId, baseAge) {
        const timeData = this._getWorldTime(worldId);
        timeData.characterAges[charId] = {
            ...timeData.characterAges[charId],
            baseAge: baseAge,
            relationToProtagonist: timeData.characterAges[charId]?.relationToProtagonist || 0
        };
        this._saveWorldTime(worldId, timeData);
    },

    getCharacterRelation(worldId, charId) {
        const timeData = this._getWorldTime(worldId);
        return timeData.characterAges[charId]?.relationToProtagonist || 0;
    },

    setCharacterRelation(worldId, charId, relationOffset) {
        const timeData = this._getWorldTime(worldId);
        const char = Data.getCharacter(worldId, charId);
        if (!char) return;

        if (!timeData.characterAges[charId]) {
            timeData.characterAges[charId] = { baseAge: char.age, relationToProtagonist: 0 };
        }
        
        timeData.characterAges[charId].baseAge = char.age;
        timeData.characterAges[charId].relationToProtagonist = relationOffset;
        
        this._saveWorldTime(worldId, timeData);
    },

    initNewCharacterAge(worldId, charId) {
        const timeData = this._getWorldTime(worldId);
        const char = Data.getCharacter(worldId, charId);
        if (!char || !timeData.storyStartYear || timeData.protagonistAge === null) {
            return;
        }

        const relation = char.age - timeData.protagonistAge;
        timeData.characterAges[charId] = {
            baseAge: char.age,
            relationToProtagonist: relation
        };
        
        this._saveWorldTime(worldId, timeData);
    },

    initAllCharactersAge(worldId) {
        const timeData = this._getWorldTime(worldId);
        if (!timeData.storyStartYear || timeData.protagonistAge === null) {
            return;
        }

        const characters = Data.getCharacters(worldId);
        let hasChanges = false;
        
        characters.forEach(char => {
            if (!timeData.characterAges[char.id] || timeData.characterAges[char.id].relationToProtagonist === undefined) {
                const relation = char.age - timeData.protagonistAge;
                timeData.characterAges[char.id] = {
                    baseAge: char.age,
                    relationToProtagonist: relation
                };
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            this._saveWorldTime(worldId, timeData);
        }
    },

    advanceTime(worldId, days = 1) {
        const timeData = this._getWorldTime(worldId);
        
        if (!timeData.storyStartYear) {
            timeData.storyStartYear = timeData.currentYear;
        }
        
        timeData.currentDay += days;
        while (timeData.currentDay > 30) {
            timeData.currentDay -= 30;
            timeData.currentMonth += 1;
        }
        while (timeData.currentMonth > 12) {
            timeData.currentMonth -= 12;
            timeData.currentYear += 1;
        }

        this._saveWorldTime(worldId, timeData);
        
        const birthdayEvents = this.checkBirthdayEvents(worldId);
        if (birthdayEvents.length > 0) {
            for (const event of birthdayEvents) {
                console.log(`[生日事件] 今天是${event.charName}的生日！TA满${event.age}岁了！`);
                PluginSystem.triggerPluginEvent('birthday', event);
            }
        }
        
        return timeData;
    },

    getDisplayTime(worldId) {
        const timeData = this._getWorldTime(worldId);
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekDay = weekDays[now.getDay()];
        
        if (!timeData.storyStartYear) {
            return {
                year: timeData.currentYear,
                month: timeData.currentMonth,
                day: timeData.currentDay,
                protagonistAge: null,
                storyStartAge: null,
                yearsPassed: 0,
                formatted: `公元${timeData.currentYear}年${timeData.currentMonth}月${timeData.currentDay}日 ${hours}:${minutes} 星期${weekDay}`
            };
        }
        
        const yearsPassed = timeData.currentYear - timeData.storyStartYear;
        const currentAge = timeData.protagonistAge !== null ? timeData.protagonistAge + yearsPassed : null;
        
        return {
            year: timeData.currentYear,
            month: timeData.currentMonth,
            day: timeData.currentDay,
            protagonistAge: currentAge,
            storyStartAge: timeData.protagonistAge,
            yearsPassed: yearsPassed,
            formatted: `公元${timeData.currentYear}年${timeData.currentMonth}月${timeData.currentDay}日 ${hours}:${minutes} 星期${weekDay}`
        };
    },

    getCharacterAge(char, worldId) {
        const timeData = this._getWorldTime(worldId);
        if (!timeData.storyStartYear || timeData.protagonistAge === null) {
            return char.age;
        }

        const existingRelation = timeData.characterAges[char.id];
        
        if (!existingRelation || existingRelation.relationToProtagonist === undefined) {
            const relation = char.age - timeData.protagonistAge;
            timeData.characterAges[char.id] = {
                baseAge: char.age,
                relationToProtagonist: relation
            };
            this._saveWorldTime(worldId, timeData);
            
            const yearsPassed = timeData.currentYear - timeData.storyStartYear;
            const dynamicAge = timeData.protagonistAge + relation + yearsPassed;
            return Math.max(0, Math.min(999, dynamicAge));
        }

        const relation = existingRelation.relationToProtagonist || 0;
        const yearsPassed = timeData.currentYear - timeData.storyStartYear;
        
        const baseAge = existingRelation.baseAge || char.age;
        const dynamicAge = timeData.protagonistAge + relation + yearsPassed;
        
        return Math.max(0, Math.min(999, dynamicAge));
    },

    getCharacterDynamicAge(worldId, charId) {
        const char = Data.getCharacter(worldId, charId);
        if (!char) return null;

        return this.getCharacterAge(char, worldId);
    },

    getWorldTimeDisplay(worldId) {
        return this.getDisplayTime(worldId);
    },

    getAllCharactersWithAge(worldId) {
        const characters = Data.getCharacters(worldId);
        const timeDisplay = this.getWorldTimeDisplay(worldId);

        return characters.map(char => {
            const dynamicAge = this.getCharacterDynamicAge(worldId, char.id);
            return {
                id: char.id,
                name: char.name,
                baseAge: char.age,
                dynamicAge: dynamicAge,
                role: char.role,
                gender: char.gender
            };
        });
    },

    setStoryStartAge(worldId, age, startYear) {
        const currentTime = this.getDisplayTime(worldId);
        if (currentTime && currentTime.storyStartAge !== null) {
            return false;
        }

        this.setStoryStartTime(worldId, age, startYear);
        return true;
    },

    advanceDays(worldId, days) {
        return this.advanceTime(worldId, days);
    },

    setCharacterRelationAge(worldId, charId, relationOffset) {
        this.setCharacterRelation(worldId, charId, relationOffset);
        return true;
    },

    getRelationTypes() {
        if (!this._relationLoaded || this._relationTypes.length === 0) {
            this._loadRelationTypes();
            // 如果_relationTypes仍然为空，返回默认关系类型数组
            if (this._relationTypes.length === 0) {
                return [
                    { id: 0, name: '陌生人', emoji: '👤', description: '初次见面，互不了解' },
                    { id: 1, name: '认识', emoji: '👋', description: '知道对方的名字和基本身份' },
                    { id: 2, name: '熟人', emoji: '🤝', description: '有过交集，但关系较浅' },
                    { id: 3, name: '朋友', emoji: '👫', description: '可以正常交流，有一定信任' },
                    { id: 4, name: '暧昧', emoji: '💕', description: '对对方有好感，关系微妙' },
                    { id: 5, name: '恋人', emoji: '💖', description: '开始交往，确认恋爱关系' },
                    { id: 6, name: '女朋友', emoji: '💑', description: '亲密的恋爱关系' },
                    { id: 7, name: '未婚妻', emoji: '💍', description: '订婚后的关系' },
                    { id: 8, name: '妻子', emoji: '🏩', description: '婚姻关系' }
                ];
            }
        }
        return this._relationTypes;
    },

    getRelationType(id) {
        if (!this._relationLoaded || this._relationTypes.length === 0) {
            this._loadRelationTypes();
            // 返回默认关系类型，避免undefined
            return { id: 0, name: '陌生人', emoji: '👤', description: '初次见面，互不了解' };
        }
        return this._relationTypes.find(r => r.id === id) || this._relationTypes[0] || { id: 0, name: '陌生人', emoji: '👤', description: '初次见面，互不了解' };
    },

    getCharacterRelationship(worldId, charId) {
        if (!this._relationLoaded || this._relationTypes.length === 0) {
            this._loadRelationTypes();
            // 返回默认关系类型，避免undefined
            return { id: 0, name: '陌生人', emoji: '👤', description: '初次见面，互不了解' };
        }
        const timeData = this._getWorldTime(worldId);
        const relation = timeData.characterRelations?.[charId];
        if (relation === undefined) {
            return this._relationTypes[0] || { id: 0, name: '陌生人', emoji: '👤', description: '初次见面，互不了解' };
        }
        return this.getRelationType(relation);
    },

    getCharacterRelationshipLevel(worldId, charId) {
        const timeData = this._getWorldTime(worldId);
        return timeData.characterRelations?.[charId] || 0;
    },

    setCharacterRelationship(worldId, charId, relationLevel) {
        const timeData = this._getWorldTime(worldId);
        if (!timeData.characterRelations) {
            timeData.characterRelations = {};
        }
        const oldLevel = timeData.characterRelations[charId] || 0;
        
        const maxId = this._relationTypes.length > 0 ? Math.max(...this._relationTypes.map(r => r.id)) : 54;
        timeData.characterRelations[charId] = Math.max(0, Math.min(maxId, relationLevel));
        
        this._saveWorldTime(worldId, timeData);
        
        if (oldLevel !== relationLevel) {
            this._onRelationshipChanged(worldId, charId, oldLevel, relationLevel);
        }
        return { old: oldLevel, new: relationLevel };
    },

    updateCharacterRelationship(worldId, charId, delta) {
        const current = this.getCharacterRelationshipLevel(worldId, charId);
        return this.setCharacterRelationship(worldId, charId, current + delta);
    },

    initCharacterRelationship(worldId, charId) {
        const timeData = this._getWorldTime(worldId);
        if (!timeData.characterRelations) {
            timeData.characterRelations = {};
        }
        if (timeData.characterRelations[charId] === undefined) {
            timeData.characterRelations[charId] = 0;
            this._saveWorldTime(worldId, timeData);
        }
    },

    initAllCharactersRelationship(worldId) {
        const timeData = this._getWorldTime(worldId);
        if (!timeData.characterRelations) {
            timeData.characterRelations = {};
        }
        const characters = Data.getCharacters(worldId);
        let hasChanges = false;
        characters.forEach(char => {
            if (timeData.characterRelations[char.id] === undefined) {
                timeData.characterRelations[char.id] = 0;
                hasChanges = true;
            }
        });
        if (hasChanges) {
            this._saveWorldTime(worldId, timeData);
        }
    },

    getAllRelationships(worldId) {
        const timeData = this._getWorldTime(worldId);
        const characters = Data.getCharacters(worldId);
        return characters.map(char => {
            const relationLevel = timeData.characterRelations?.[char.id] || 0;
            const relationType = this.getRelationType(relationLevel);
            return {
                charId: char.id,
                charName: char.name,
                level: relationLevel,
                name: relationType.name,
                emoji: relationType.emoji,
                description: relationType.description
            };
        });
    },

    _onRelationshipChanged(worldId, charId, oldLevel, newLevel) {
        const char = Data.getCharacter(worldId, charId);
        if (!char) return;
        
        const oldType = this.getRelationType(oldLevel);
        const newType = this.getRelationType(newLevel);
        
        console.log(`[关系变化] ${char.name}: ${oldType.emoji}${oldType.name} → ${newType.emoji}${newType.name}`);
        
        PluginSystem.triggerPluginEvent('relationshipChanged', {
            worldId,
            charId,
            charName: char.name,
            oldLevel,
            newLevel,
            oldRelation: oldType,
            newRelation: newType
        });
    },

    getRelationshipContext(worldId) {
        this.initAllCharactersRelationship(worldId);
        const relationships = this.getAllRelationships(worldId);
        
        const nonStranger = relationships.filter(r => r.level > 0);
        if (nonStranger.length === 0) {
            return '';
        }
        
        const context = nonStranger.map(r => `${r.charName}与主角的关系: ${r.emoji}${r.name}`).join('；');
        return `\n【当前人物关系】${context}`;
    },

    getPluginStats(worldId) {
        const timeDisplay = this.getWorldTimeDisplay(worldId);
        const characters = this.getAllCharactersWithAge(worldId);

        return {
            time: timeDisplay,
            characters: characters,
            totalCharacters: characters.length
        };
    },

    renderTimeInfoPanel(worldId) {
        this.initAllCharactersAge(worldId);
        this.initAllCharactersRelationship(worldId);
        
        const stats = this.getPluginStats(worldId);
        const relationships = this.getAllRelationships(worldId);
        const config = this._getConfig();
        
        let birthdaySection = '';
        if (config.birthdayEnabled) {
            const charactersWithBirthday = this.getCharactersWithBirthday(worldId);
            const upcomingBirthdays = this.getUpcomingBirthdays(worldId, config.birthdayAdvanceDays || 7);
            
            const birthdayListHtml = charactersWithBirthday.length > 0 
                ? charactersWithBirthday.map(b => {
                    const upcoming = upcomingBirthdays.find(u => u.id === b.id);
                    let info = b.birthdayString;
                    if (upcoming) {
                        if (upcoming.isToday) {
                            info += ' 🎂今日生日！';
                        } else {
                            info += ` (${upcoming.daysUntil}天后)`;
                        }
                    }
                    return `<span class="time-birthday-item">${b.name}: ${info}</span>`;
                }).join('')
                : '<span class="time-tip">暂无生日信息</span>';
            
            birthdaySection = `
                <div class="time-birthday-section">
                    <div class="time-char-list-title">🎂 生日信息</div>
                    <div class="time-birthday-list">${birthdayListHtml}</div>
                </div>
            `;
        }

        if (!stats.time || stats.time.storyStartAge === null) {
            return `
                <div class="time-plugin-panel">
                    <div class="time-plugin-header">
                        <span class="time-icon">⏰</span>
                        <span>时间插件</span>
                    </div>
                    <div class="time-plugin-content">
                        <p class="time-tip">故事尚未设置开始时间</p>
                        <button class="btn btn-primary" onclick="TimePluginUI.showSetupModal()">设置故事时间</button>
                    </div>
                </div>
            `;
        }

        const charListHtml = stats.characters.map(char => {
            const ageDiff = char.dynamicAge - stats.time.protagonistAge;
            let ageDiffText = '';
            if (ageDiff > 0) ageDiffText = `(+${ageDiff})`;
            else if (ageDiff < 0) ageDiffText = `(${ageDiff})`;

            const rel = relationships.find(r => r.charId === char.id);
            const relDisplay = rel && rel.level > 0 ? ` ${rel.emoji}${rel.name}` : '';

            return `
                <div class="time-char-item">
                    <span class="time-char-name">${char.name}</span>
                    <span class="time-char-value">${char.dynamicAge}岁 ${ageDiffText}${relDisplay}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="time-plugin-panel">
                <div class="time-plugin-header">
                    <span class="time-icon">⏰</span>
                    <span>时间插件</span>
                </div>
                <div class="time-plugin-content">
                    <div class="time-info-grid">
                        <div class="time-info-item">
                            <span class="time-label">📅 故事时间</span>
                            <span class="time-value">${stats.time.formatted}</span>
                        </div>
                        <div class="time-info-item">
                            <span class="time-label">👤 主角年龄</span>
                            <span class="time-value highlight">${stats.time.protagonistAge}岁</span>
                        </div>
                        <div class="time-info-item">
                            <span class="time-label">📆 已过年数</span>
                            <span class="time-value">${stats.time.yearsPassed}年</span>
                        </div>
                    </div>
                    ${birthdaySection}
                    <div class="time-char-list">
                        <div class="time-char-list-title">🎭 角色年龄与关系</div>
                        ${charListHtml}
                    </div>
                    <div class="time-actions">
                        <button class="btn btn-secondary" onclick="TimePluginUI.showTimeModal()">⏱️ 调整时间</button>
                        <button class="btn btn-secondary" onclick="TimePluginUI.showRelationModal()">👥 年龄关系</button>
                        <button class="btn btn-secondary" onclick="TimePluginUI.showRelationshipModal()">❤️ 角色关系</button>
                        ${config.birthdayEnabled ? `<button class="btn btn-secondary" onclick="TimePluginUI.showBirthdayModal()">🎂 生日设置</button>` : ''}
                        <button class="btn btn-secondary" onclick="TimePluginUI.showResetConfirm()">🔄 重置</button>
                    </div>
                </div>
            </div>
        `;
    }
};

if (window.TimePlugin) {
    console.log('[TimePlugin] Plugin already loaded, skipping...');
} else {
    window.TimePlugin = TimePlugin;
    window.WorldTimePlugin = TimePlugin;
}

const TimePluginUI = {
    showSetupModal() {
        const world = Data.getCurrentWorld();
        if (!world) return;

        const modal = document.createElement('div');
        modal.className = 'modal active';
        
        const characters = Data.getCharacters(world.id);
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>⏰ 设置故事时间</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>👤 选择主角</label>
                        <select id="setupProtagonistId" onchange="TimePluginUI.onProtagonistChange()">
                            ${characters.map(c => 
                                `<option value="${c.id}" data-age="${c.age}">${c.name} (${c.role || '配角'} - ${c.age || 18}岁)</option>`
                            ).join('')}
                        </select>
                        <small style="color: var(--text-dim); font-size: 0.75rem;">选择故事的主角，该角色的年龄将作为基准</small>
                    </div>
                    <div class="form-group">
                        <label>👤 主角故事开始年龄</label>
                        <input type="number" id="setupProtagonistAge" value="18" min="1" max="100">
                        <small style="color: var(--text-dim); font-size: 0.75rem;">设置主角从几岁开始故事（可以与角色原始年龄不同）</small>
                    </div>
                    <div class="form-group">
                        <label>📅 故事开始年份</label>
                        <input type="number" id="setupStartYear" value="${new Date().getFullYear()}" min="1900" max="2100">
                    </div>
                    <div class="form-tip">
                        <p>💡 设置后，每次剧情推进都会自动更新角色年龄</p>
                        <p>💡 AI可在故事中加入【时间变化：X天】来控制时间推进</p>
                        <p>💡 角色年龄 = 主角新年龄 + (角色原始年龄 - 主角原始年龄) + 已过年数</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="TimePluginUI.setupStoryTime()">确定</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const firstChar = characters[0];
        if (firstChar) {
            document.getElementById('setupProtagonistAge').value = firstChar.age || 18;
        }
    },

    onProtagonistChange() {
        const select = document.getElementById('setupProtagonistId');
        const selectedOption = select.options[select.selectedIndex];
        const age = parseInt(selectedOption.dataset.age) || 18;
        document.getElementById('setupProtagonistAge').value = age;
    },

    setupStoryTime() {
        const world = Data.getCurrentWorld();
        if (!world) return;

        const protagonistId = document.getElementById('setupProtagonistId').value;
        const newProtagonistAge = parseInt(document.getElementById('setupProtagonistAge').value) || 18;
        const year = parseInt(document.getElementById('setupStartYear').value) || new Date().getFullYear();

        const characters = Data.getCharacters(world.id);
        
        const timeData = TimePlugin._getWorldTime(world.id);
        
        const protagonist = characters.find(c => c.id === protagonistId);
        const originalProtagonistAge = protagonist?.age || 18;
        
        characters.forEach(char => {
            if (char.age !== undefined) {
                const relation = char.age - originalProtagonistAge;
                timeData.characterAges[char.id] = {
                    baseAge: char.age,
                    relationToProtagonist: relation
                };
            }
        });
        
        timeData.currentYear = year;
        timeData.currentMonth = 1;
        timeData.currentDay = 1;
        timeData.storyStartYear = year;
        timeData.protagonistAge = newProtagonistAge;
        
        TimePlugin._saveWorldTime(world.id, timeData);

        document.querySelector('.modal.active')?.remove();

        if (this.refreshCallback) {
            this.refreshCallback();
        }
    },

    showTimeModal() {
        const world = Data.getCurrentWorld();
        if (!world) return;

        const current = TimePlugin.getDisplayTime(world.id);

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h3>⏱️ 调整故事时间</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>📅 当前时间</label>
                        <div class="form-value">${current.formatted}</div>
                    </div>
                    <div class="form-group">
                        <label>👤 主角当前年龄</label>
                        <div class="form-value highlight">${current.protagonistAge}岁</div>
                    </div>
                    <div class="form-group">
                        <label>⏰ 推进天数</label>
                        <input type="number" id="advanceDays" value="1" min="1" max="365">
                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                            <button class="btn btn-secondary" onclick="TimePluginUI.advanceDays(1)">+1天</button>
                            <button class="btn btn-secondary" onclick="TimePluginUI.advanceDays(7)">+7天</button>
                            <button class="btn btn-secondary" onclick="TimePluginUI.advanceDays(30)">+30天</button>
                            <button class="btn btn-secondary" onclick="TimePluginUI.advanceDays(365)">+1年</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    advanceDays(days) {
        const world = Data.getCurrentWorld();
        if (!world) return;

        const input = document.getElementById('advanceDays');
        const daysToAdvance = parseInt(input.value) || days;

        TimePlugin.advanceTime(world.id, daysToAdvance);

        const current = TimePlugin.getDisplayTime(world.id);
        document.querySelector('.modal-body .form-value.highlight').textContent = `${current.protagonistAge}岁`;

        if (this.refreshCallback) {
            this.refreshCallback();
        }
    },

    showRelationModal() {
        const world = Data.getCurrentWorld();
        if (!world) return;

        const characters = Data.getCharacters(world.id);
        const currentTime = TimePlugin.getDisplayTime(world.id);

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 550px;">
                <div class="modal-header">
                    <h3>👥 设置角色年龄关系</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p class="time-tip">设置角色与主角的年龄差（正数表示比主角大，负数表示比主角小）</p>
                    <p class="time-tip" style="color: var(--accent);">💡 角色当前年龄 = 主角年龄(${currentTime.protagonistAge}岁) + 年龄差 + 已过年数(${currentTime.yearsPassed}年)</p>
                    <div id="relationList" style="max-height: 350px; overflow-y: auto;">
                        ${characters.map(char => {
                            const relation = TimePlugin.getCharacterRelation(world.id, char.id);
                            const currentCharAge = currentTime.protagonistAge ? currentTime.protagonistAge + relation + currentTime.yearsPassed : char.age;
                            return `
                                <div class="form-group" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: var(--bg); border-radius: 6px; margin-bottom: 8px;">
                                    <label style="min-width: 80px; font-weight: 500;">${char.name}</label>
                                    <span style="font-size: 0.8rem; color: var(--text-dim);">原始${char.age}岁</span>
                                    <input type="number" class="relation-input" data-char-id="${char.id}" value="${relation}" style="width: 60px;" onchange="TimePluginUI.updateAgeDisplay(this)">
                                    <span>岁差</span>
                                    <span class="time-result" data-char-id="${char.id}" data-original-age="${char.age}" style="color: var(--accent); font-weight: 500;">
                                        → 当前${currentCharAge}岁
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="TimePluginUI.saveRelations()">保存</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('.relation-input').forEach(input => {
            input.addEventListener('change', function() {
                TimePluginUI.updateAgeDisplay(this);
            });
        });
    },

    updateAgeDisplay(input) {
        const charId = input.dataset.charId;
        const resultSpan = document.querySelector(`.time-result[data-char-id="${charId}"]`);
        const char = Data.getCharacter(Data.getCurrentWorld()?.id, charId);
        const world = Data.getCurrentWorld();
        if (!resultSpan || !char || !world) return;

        const relation = parseInt(input.value) || 0;
        const currentTime = TimePlugin.getDisplayTime(world.id);
        const currentCharAge = currentTime.protagonistAge ? currentTime.protagonistAge + relation + currentTime.yearsPassed : char.age;
        resultSpan.textContent = `→ 当前${currentCharAge}岁`;
    },

    saveRelations() {
        const world = Data.getCurrentWorld();
        if (!world) return;

        document.querySelectorAll('.relation-input').forEach(input => {
            const charId = input.dataset.charId;
            const relation = parseInt(input.value) || 0;
            TimePlugin.setCharacterRelation(world.id, charId, relation);
        });

        document.querySelector('.modal.active')?.remove();

        if (this.refreshCallback) {
            this.refreshCallback();
        }
    },

    showRelationshipModal() {
        const world = Data.getCurrentWorld();
        if (!world) return;

        TimePlugin.initAllCharactersRelationship(world.id);
        const relationships = TimePlugin.getAllRelationships(world.id);
        const relationTypes = TimePlugin.getRelationTypes();

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>❤️ 角色关系管理</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p class="time-tip">设置角色与主角的关系（0级为陌生人）</p>
                    <div id="relationshipList" style="max-height: 400px; overflow-y: auto;">
                        ${relationships.map(rel => {
                            const options = relationTypes.map(rt => 
                                `<option value="${rt.id}" ${rt.id === rel.level ? 'selected' : ''}>${rt.emoji} ${rt.name}</option>`
                            ).join('');
                            return `
                                <div class="form-group" style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg); border-radius: 6px; margin-bottom: 8px;">
                                    <label style="min-width: 80px; font-weight: 500;">${rel.charName}</label>
                                    <span style="font-size: 0.75rem; color: var(--text-dim);">当前: ${rel.emoji}${rel.name}</span>
                                    <select class="relationship-select" data-char-id="${rel.charId}" style="flex: 1;">
                                        ${options}
                                    </select>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="form-tip" style="margin-top: 15px;">
                        <p>💡 关系等级：</p>
                        <p style="font-size: 0.75rem; color: var(--text-dim);">${relationTypes.slice(0, 9).map(rt => `${rt.id}-${rt.emoji}${rt.name}`).join('； ')}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="TimePluginUI.saveRelationships()">保存</button>
                    <button class="btn btn-secondary" onclick="TimePluginUI.resetAllRelationships()">重置所有关系</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveRelationships() {
        const world = Data.getCurrentWorld();
        if (!world) return;

        document.querySelectorAll('.relationship-select').forEach(select => {
            const charId = select.dataset.charId;
            const level = parseInt(select.value, 10);
            TimePlugin.setCharacterRelationship(world.id, charId, level);
        });

        document.querySelector('.modal.active')?.remove();

        if (this.refreshCallback) {
            this.refreshCallback();
        }
    },

    resetAllRelationships() {
        const world = Data.getCurrentWorld();
        if (!world) return;

        if (confirm('确定要重置所有角色关系吗？所有角色将变回陌生人。')) {
            TimePlugin.resetRelationships(world.id);
            
            document.querySelectorAll('.relationship-select').forEach(select => {
                select.value = '0';
            });
        }
    },

    showResetConfirm() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h3>🔄 重置时间系统</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p>确定要重置故事时间吗？重置后：</p>
                    <ul>
                        <li>清除所有已积累的时间</li>
                        <li>角色年龄将恢复为初始值</li>
                        <li>需要重新设置故事开始时间</li>
                    </ul>
                </div>
                <div class="modal-footer">
                    <button class="btn" style="background: var(--danger);" onclick="TimePluginUI.resetTime()">确定重置</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    resetTime() {
        const world = Data.getCurrentWorld();
        if (!world) return;

        TimePlugin.resetWorldTime(world.id);

        document.querySelector('.modal.active')?.remove();

        if (this.refreshCallback) {
            this.refreshCallback();
        }
    },
    
    setRefreshCallback(callback) {
        this.refreshCallback = callback;
    },

    showBirthdayModal() {
        const world = Data.getCurrentWorld();
        if (!world) return;

        const characters = Data.getCharacters(world.id);

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 550px;">
                <div class="modal-header">
                    <h3>🎂 设置角色生日</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p class="time-tip">设置角色的生日（月-日），系统会在适当时机提醒生日信息</p>
                    <div id="birthdayList" style="max-height: 350px; overflow-y: auto;">
                        ${characters.map(char => {
                            const birthday = TimePlugin.getCharacterBirthday(world.id, char.id);
                            const month = birthday ? birthday.month : '';
                            const day = birthday ? birthday.day : '';
                            return `
                                <div class="form-group" style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg); border-radius: 6px; margin-bottom: 8px;">
                                    <label style="min-width: 80px; font-weight: 500;">${char.name}</label>
                                    <input type="number" class="birthday-month" data-char-id="${char.id}" value="${month}" min="1" max="12" placeholder="月" style="width: 60px;">
                                    <span>月</span>
                                    <input type="number" class="birthday-day" data-char-id="${char.id}" value="${day}" min="1" max="31" placeholder="日" style="width: 60px;">
                                    <span>日</span>
                                    ${birthday ? `<button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="TimePluginUI.clearBirthday(${char.id})">清除</button>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="TimePluginUI.saveBirthdays()">保存</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    saveBirthdays() {
        const world = Data.getCurrentWorld();
        if (!world) return;

        const monthInputs = document.querySelectorAll('.birthday-month');
        const dayInputs = document.querySelectorAll('.birthday-day');

        monthInputs.forEach(monthInput => {
            const charId = monthInput.dataset.charId;
            const dayInput = document.querySelector(`.birthday-day[data-char-id="${charId}"]`);
            const month = parseInt(monthInput.value);
            const day = parseInt(dayInput.value);

            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                TimePlugin.setCharacterBirthday(world.id, charId, month, day);
            }
        });

        document.querySelector('.modal.active')?.remove();

        if (this.refreshCallback) {
            this.refreshCallback();
        }
    },

    clearBirthday(charId) {
        const world = Data.getCurrentWorld();
        if (!world) return;

        const timeData = TimePlugin._getWorldTime(world.id);
        if (timeData.characterBirthdays && timeData.characterBirthdays[charId]) {
            delete timeData.characterBirthdays[charId];
            TimePlugin._saveWorldTime(world.id, timeData);
        }

        const monthInput = document.querySelector(`.birthday-month[data-char-id="${charId}"]`);
        const dayInput = document.querySelector(`.birthday-day[data-char-id="${charId}"]`);
        if (monthInput) monthInput.value = '';
        if (dayInput) dayInput.value = '';

        const row = monthInput?.closest('.form-group');
        const clearBtn = row?.querySelector('button');
        if (clearBtn) clearBtn.remove();
    }
};

window.TimePluginUI = TimePluginUI;

PluginSystem.register('time-plugin', {
    description: '时间插件 - 故事时间与角色年龄动态管理',
    features: ['动态年龄计算', '时间推进管理', '角色年龄关系设置', '时间重置', '独立世界时间', '角色关系监测', '生日管理'],

    init() {
        console.log('Time plugin loaded');
        TimePlugin._loadRelationTypes();
    },

    getStoryContext(worldId) {
        const relationshipContext = TimePlugin.getRelationshipContext(worldId);
        const birthdayContext = TimePlugin.getBirthdayContext(worldId);
        return relationshipContext + birthdayContext;
    },

    getRelationshipAPI() {
        return {
            getRelationTypes: TimePlugin.getRelationTypes.bind(TimePlugin),
            getCharacterRelationship: TimePlugin.getCharacterRelationship.bind(TimePlugin),
            getCharacterRelationshipLevel: TimePlugin.getCharacterRelationshipLevel.bind(TimePlugin),
            setCharacterRelationship: TimePlugin.setCharacterRelationship.bind(TimePlugin),
            updateCharacterRelationship: TimePlugin.updateCharacterRelationship.bind(TimePlugin),
            getAllRelationships: TimePlugin.getAllRelationships.bind(TimePlugin),
            getRelationshipContext: TimePlugin.getRelationshipContext.bind(TimePlugin)
        };
    },

    getBirthdayAPI() {
        return {
            setCharacterBirthday: TimePlugin.setCharacterBirthday.bind(TimePlugin),
            getCharacterBirthday: TimePlugin.getCharacterBirthday.bind(TimePlugin),
            getCharacterBirthdayString: TimePlugin.getCharacterBirthdayString.bind(TimePlugin),
            getCharactersWithBirthday: TimePlugin.getCharactersWithBirthday.bind(TimePlugin),
            getUpcomingBirthdays: TimePlugin.getUpcomingBirthdays.bind(TimePlugin),
            checkBirthdayEvents: TimePlugin.checkBirthdayEvents.bind(TimePlugin),
            getBirthdayContext: TimePlugin.getBirthdayContext.bind(TimePlugin)
        };
    },

    onPluginEvent(eventName, data) {}
});
