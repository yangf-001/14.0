PluginSystem.register('character-stats', {
    description: '角色属性插件 - 根据故事内容更新角色属性',
    features: ['角色属性', '属性分析', '数值更新'],

    init() {
        window.CharacterStatsPlugin = this;
        console.log('Character stats plugin loaded');
    },

    getAISetting(key, worldId) {
        const plugin = null;
        if (plugin) {
            return plugin.getAISetting(key, worldId);
        }
        return null;
    },

    async updateCharacterStats(storyContent, characters, worldId) {
        const aiSetting = this.getAISetting('updateStats', worldId);

        if (!aiSetting || !aiSetting.enabled) {
            return;
        }

        if (!characters || characters.length === 0) return;

        const charNames = characters.map(c => c.name).join('、');
        
        let template = aiSetting.template || '';
        template = template.replace(/\[内容\]/g, storyContent);
        template = template.replace(/\[故事内容\]/g, storyContent);
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
            
            const findMatchingCharUpdates = (charName) => {
                if (updates[charName]) {
                    return updates[charName];
                }
                const lowerCharName = charName.toLowerCase();
                for (const key of Object.keys(updates)) {
                    if (key.toLowerCase() === lowerCharName) {
                        return updates[key];
                    }
                }
                for (const key of Object.keys(updates)) {
                    if (lowerCharName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCharName)) {
                        return updates[key];
                    }
                }
                return null;
            };
            
            for (const char of characters) {
                const charUpdates = findMatchingCharUpdates(char.name);
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
            
            console.log('[CharacterStats] 角色属性已更新');
            
        } catch (e) {
            console.error('[CharacterStats] 更新属性失败:', e);
        }
    }
});
