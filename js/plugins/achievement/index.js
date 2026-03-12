PluginSystem.register('achievement', {
    description: '成就系统',
    features: ['成就管理', '成就进度', '成就追踪', '成就库'],

    init() {
        console.log('Achievement plugin loaded');
        this._initDefaultLibrary();
    },

    async _initDefaultLibrary(force = false) {
        if (force) {
            localStorage.removeItem('achievement_library');
        }
        
        const getUserContentPath = () => {
            const script = document.currentScript;
            if (script && script.src) {
                const scriptUrl = new URL(script.src);
                const pluginDir = scriptUrl.pathname.replace(/[^/]*$/, '');
                return pluginDir + 'user-content/';
            }
            
            const scripts = document.getElementsByTagName('script');
            for (let s of scripts) {
                if (s.src && s.src.includes('achievement')) {
                    const scriptUrl = new URL(s.src);
                    const pluginDir = scriptUrl.pathname.replace(/[^/]*$/, '');
                    return pluginDir + 'user-content/';
                }
            }
            
            return 'js/plugins/achievement/user-content/';
        };
        
        const possiblePaths = [
            getUserContentPath() + 'achievements.txt'
        ];

        for (const path of possiblePaths) {
            try {
                const response = await fetch(path);
                if (response && response.ok) {
                    const text = await response.text();
                    const achievements = this._parseAchievementsText(text);
                    if (achievements.length > 0) {
                        const library = this.getAchievementLibrary();
                        const existingNames = library.map(a => a.name);
                        achievements.forEach(ach => {
                            if (!existingNames.includes(ach.name)) {
                                this.addToLibrary(ach);
                            }
                        });
                        console.log('Achievements loaded from:', path);
                        return Promise.resolve();
                    }
                }
            } catch (e) {
                console.warn('Failed to load achievements from', path, e);
            }
        }

        this._addHardcodedDefaults();
        return Promise.resolve();
    },

    _parseAchievementsText(text) {
        const achievements = [];
        const lines = text.split('\n');

        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) continue;

            if (line.startsWith('[') && line.endsWith(']')) {
                continue;
            } else if (line.includes('|')) {
                const parts = line.split('|');
                if (parts.length >= 2) {
                    achievements.push({
                        name: parts[0].trim(),
                        type: parts[1].trim() || 'misc',
                        description: parts[2]?.trim() || '',
                        icon: parts[3]?.trim() || this._getIconForType(parts[1].trim())
                    });
                }
            }
        }
        return achievements;
    },

    _getIconForType(type) {
        const iconMap = {
            'story': '📝',
            'character': '👤',
            'interaction': '💕',
            'item': '📦',
            'system': '⚙️',
            'achievement': '🏆',
            'adult': '🔞',
            'misc': '🏆'
        };
        return iconMap[type] || '🏆';
    },

    _addHardcodedDefaults() {
        const defaultAchievements = [
            { name: '初次动笔', type: 'story', description: '生成第一个故事', icon: '📝' },
            { name: '初次见面', type: 'character', description: '创建第一个角色', icon: '👤' },
            { name: '初次互动', type: 'interaction', description: '触发第一次角色互动', icon: '💕' },
            { name: '第一件宝贝', type: 'item', description: '获得第一件物品', icon: '📦' },
            { name: '初次探索', type: 'system', description: '首次打开任意插件页面', icon: '⚙️' },
            { name: '首次成就', type: 'achievement', description: '解锁第一个成就', icon: '🏆' }
        ];

        defaultAchievements.forEach(ach => this.addToLibrary(ach));
    },

    getAchievementLibrary() {
        try {
            return JSON.parse(localStorage.getItem('achievement_library') || '[]');
        } catch { return []; }
    },

    saveAchievementLibrary(library) {
        localStorage.setItem('achievement_library', JSON.stringify(library));
    },

    addToLibrary(achievement) {
        const library = this.getAchievementLibrary();
        const newAchievement = {
            id: 'ach_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: achievement.name,
            type: achievement.type || 'misc',
            description: achievement.description || '',
            icon: achievement.icon || '🏆'
        };
        library.push(newAchievement);
        this.saveAchievementLibrary(library);
        return newAchievement;
    },

    updateLibraryItem(achievementId, updates) {
        const library = this.getAchievementLibrary();
        const idx = library.findIndex(a => a.id === achievementId);
        if (idx !== -1) {
            library[idx] = { ...library[idx], ...updates };
            this.saveAchievementLibrary(library);
            return library[idx];
        }
        return null;
    },

    removeFromLibrary(achievementId) {
        const library = this.getAchievementLibrary();
        const newLibrary = library.filter(a => a.id !== achievementId);
        this.saveAchievementLibrary(newLibrary);
    },

    addAchievement(worldId, data) {
        const key = `achievements_${worldId}`;
        let achievements = JSON.parse(localStorage.getItem(key) || '[]');

        const achievement = {
            id: 'ach_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: data.name,
            description: data.description || '',
            type: data.type || 'misc',
            icon: data.icon || '🏆',
            progress: 0,
            maxProgress: data.maxProgress || 1,
            status: 'active',
            created: new Date().toISOString()
        };

        achievements.push(achievement);
        localStorage.setItem(key, JSON.stringify(achievements));

        return achievement;
    },

    getAchievements(worldId) {
        const key = `achievements_${worldId}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    },

    updateAchievementProgress(worldId, achievementId, progress) {
        const key = `achievements_${worldId}`;
        let achievements = JSON.parse(localStorage.getItem(key) || '[]');

        const achievement = achievements.find(a => a.id === achievementId);
        if (achievement) {
            achievement.progress = Math.min(achievement.maxProgress, progress);
            if (achievement.progress >= achievement.maxProgress) {
                achievement.status = 'completed';
            }
            localStorage.setItem(key, JSON.stringify(achievements));
        }
    },

    completeAchievement(worldId, achievementId) {
        this.updateAchievementProgress(worldId, achievementId, Infinity);
    },

    deleteAchievement(worldId, achievementId) {
        const key = `achievements_${worldId}`;
        let achievements = JSON.parse(localStorage.getItem(key) || '[]');
        achievements = achievements.filter(a => a.id !== achievementId);
        localStorage.setItem(key, JSON.stringify(achievements));
    },

    updateStats(eventType, data) {
        const worldId = Data.getCurrentWorld()?.id;
        if (!worldId) return;

        const achievements = this.getAchievements(worldId);
        achievements.forEach(ach => {
            if (ach.status !== 'completed') {
                this.updateAchievementProgress(worldId, ach.id, ach.progress + 1);
            }
        });

        PluginSystem.triggerPluginEvent('achievementUpdated', { eventType, data });
    }
});
