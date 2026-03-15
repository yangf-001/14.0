class CharacterStatsPlugin {
    constructor() {
        window.CharacterStatsPlugin = this;
        
        this._statNameMap = {
            '性欲': 'arousal',
            '亲密': 'intimacy',
            '经验': 'experience',
            '意愿': 'willingness',
            '堕落': 'corruption'
        };
    }

    async updateCharacterStats(storyContent, characters, worldId) {
        const promptManager = window.PromptManagerPlugin;
        if (!promptManager) {
            console.warn('[角色属性] 提示词管理插件未加载');
            return;
        }

        const charNames = characters.map(c => c.name).join('、');
        
        const variables = {
            '角色': charNames,
            '角色列表': charNames,
            '内容': storyContent,
            '故事内容': storyContent,
            '属性': this._buildCurrentStats(characters)
        };

        const prompt = promptManager.getTemplateWithPreset('updateStats', 'default', variables);
        
        if (!prompt || !prompt.trim()) {
            console.warn('[角色属性] 提示词为空');
            return;
        }

        try {
            const result = await ai.call(prompt, { temperature: 0.3, maxTokens: 200 });
            console.log('[角色属性] AI分析结果:', result);
            
            this._applyStatChanges(result, characters, worldId);
        } catch (e) {
            console.error('[角色属性] 更新失败:', e);
        }
    }

    _buildCurrentStats(characters) {
        const statNameMap = {
            'arousal': '性欲',
            'intimacy': '亲密',
            'experience': '经验',
            'willingness': '意愿',
            'corruption': '堕落'
        };
        
        return characters.map(c => {
            const stats = c.stats || {};
            const statStr = Object.entries(stats)
                .map(([k, v]) => {
                    const chineseName = statNameMap[k] || k;
                    return `${chineseName}:${v}`;
                })
                .join(', ');
            return `${c.name}: ${statStr || '(无属性)'}`;
        }).join('\n');
    }

    _normalizeStatName(name) {
        const trimmed = name.trim().toLowerCase();
        return this._statNameMap[trimmed] || this._statNameMap[name] || name;
    }

    _applyStatChanges(result, characters, worldId) {
        const lines = result.split('\n');
        let updatedCount = 0;
        
        const validStats = ['arousal', 'intimacy', 'experience', 'willingness', 'corruption'];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            let targetChar = null;
            let statName = '';
            let statValue = 0;
            
            const withCharMatch = trimmedLine.match(/^(.+?):\s*(.+?)\s*([+-]\d+)$/);
            if (withCharMatch) {
                const charName = withCharMatch[1].trim();
                statName = withCharMatch[2].trim();
                statValue = parseInt(withCharMatch[3]);
                
                targetChar = characters.find(c => c.name === charName);
            } else {
                const noCharMatch = trimmedLine.match(/^(.+?)\s*([+-]\d+)$/);
                if (noCharMatch) {
                    statName = noCharMatch[1].trim();
                    statValue = parseInt(noCharMatch[2]);
                    targetChar = characters[0];
                }
            }
            
            if (!targetChar || !statName) continue;
            
            statName = this._normalizeStatName(statName);
            
            if (!validStats.includes(statName)) {
                continue;
            }
            
            if (!targetChar.stats) {
                targetChar.stats = {};
            }
            
            const currentValue = targetChar.stats[statName] || 0;
            const newValue = Math.max(0, Math.min(100, currentValue + statValue));
            targetChar.stats[statName] = newValue;
            
            Data.updateCharacter(worldId, targetChar.id, { stats: targetChar.stats });
            console.log(`[角色属性] ${targetChar.name}.${statName} ${statValue > 0 ? '+' : ''}${statValue} = ${newValue}`);
            updatedCount++;
        }
        
        console.log(`[角色属性] 共更新 ${updatedCount} 个属性`);
    }
}

window.CharacterStatsPlugin = new CharacterStatsPlugin();
