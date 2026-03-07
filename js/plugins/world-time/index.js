const WorldTimePlugin = {
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
            lastUpdate: Date.now()
        };
    },

    _saveWorldTime(worldId, timeData) {
        const key = `world_time_${worldId}`;
        timeData.lastUpdate = Date.now();
        localStorage.setItem(key, JSON.stringify(timeData));
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
        timeData.characterAges[charId].relationToProtagonist = relationOffset;
        this._saveWorldTime(worldId, timeData);
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
        return timeData;
    },

    getDisplayTime(worldId) {
        const timeData = this._getWorldTime(worldId);
        if (!timeData.storyStartYear) {
            return {
                year: timeData.currentYear,
                month: timeData.currentMonth,
                day: timeData.currentDay,
                protagonistAge: null,
                storyStartAge: null,
                yearsPassed: 0,
                formatted: `公元${timeData.currentYear}年${timeData.currentMonth}月${timeData.currentDay}日`
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
            formatted: `公元${timeData.currentYear}年${timeData.currentMonth}月${timeData.currentDay}日`
        };
    },

    getCharacterAge(char, worldId) {
        const timeData = this._getWorldTime(worldId);
        if (!timeData.storyStartYear || timeData.protagonistAge === null) {
            return char.age;
        }

        const relation = timeData.characterAges[char.id]?.relationToProtagonist || 0;
        const yearsPassed = timeData.currentYear - timeData.storyStartYear;
        
        const baseAge = timeData.characterAges[char.id]?.baseAge || char.age;
        const dynamicAge = timeData.protagonistAge + relation + yearsPassed;
        
        return Math.max(0, Math.min(999, dynamicAge));
    }
};

window.WorldTimePlugin = WorldTimePlugin;

PluginSystem.register('world-time', {
    description: '世界时间系统 - 为每个世界提供独立的虚拟时间管理',
    features: ['故事开始时间设置', '角色年龄动态计算', '时间自动推进', '独立世界时间'],

    init() {
        console.log('World-time plugin loaded');
    },

    onPluginEvent(eventName, data) {
        if (eventName === 'storyStarted') {
            console.log('Story started with time config:', data);
        }
    }
});
