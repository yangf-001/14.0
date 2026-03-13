PluginSystem.register('chat-diary', {
    description: '聊天日记插件 - 独立日记储存库',
    features: ['独立日记库', '自动生成日记', '历史记录', '日记查看'],

    init() {
        window.ChatDiaryPlugin = this;
        console.log('Chat diary plugin loaded');
    },

    _getDiaryStorageKey(worldId) {
        return `chat_diary_${worldId}`;
    },

    _getDiaries(worldId) {
        try {
            return JSON.parse(localStorage.getItem(this._getDiaryStorageKey(worldId)) || '[]');
        } catch {
            return [];
        }
    },

    _saveDiaries(worldId, diaries) {
        localStorage.setItem(this._getDiaryStorageKey(worldId), JSON.stringify(diaries));
    },

    async generateDiary(character, chatContent) {
        if (!chatContent || chatContent.trim().length === 0) {
            return null;
        }

        const promptManager = window.PromptManagerPlugin;
        
        if (!promptManager) {
            throw new Error('提示词管理插件未加载');
        }
        
        const prompt = promptManager.getTemplateWithPreset('diary', 'default', {
            '角色名': character.name,
            '聊天内容': chatContent
        });

        try {
            const response = await ai.call(prompt, {
                temperature: 0.7,
                maxTokens: 500
            });

            return response.trim();
        } catch (error) {
            console.error('生成日记失败:', error);
            return null;
        }
    },

    async saveCharacterDiary(characterId, worldId, characterName, newDiaryContent) {
        const diaries = this._getDiaries(worldId);
        
        let charDiary = diaries.find(d => d.characterId === characterId);
        
        if (!charDiary) {
            charDiary = {
                characterId: characterId,
                characterName: characterName,
                entries: []
            };
            diaries.push(charDiary);
        }

        const newDiary = {
            id: `diary_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            content: newDiaryContent,
            date: new Date().toISOString()
        };

        charDiary.entries.push(newDiary);

        if (charDiary.entries.length > 100) {
            charDiary.entries = charDiary.entries.slice(-100);
        }

        this._saveDiaries(worldId, diaries);
        console.log(`[日记] ${characterName} 的日记已保存`);

        return true;
    },

    async updateCharacterDiaryFromChat(character, chatMessages, worldId) {
        if (!chatMessages || chatMessages.length === 0) {
            return;
        }

        const recentMessages = chatMessages.slice(-10);
        const chatContent = recentMessages.map(m => {
            const role = m.role === 'user' ? '用户' : (m.characterName || '角色');
            return `${role}: ${m.content}`;
        }).join('\n');

        const diaryContent = await this.generateDiary(character, chatContent);
        
        if (diaryContent) {
            await this.saveCharacterDiary(character.id, worldId, character.name, diaryContent);
        }
    },

    getCharacterDiaries(characterId, worldId) {
        const diaries = this._getDiaries(worldId);
        const charDiary = diaries.find(d => d.characterId === characterId);
        if (!charDiary) {
            return [];
        }
        return charDiary.entries || [];
    },

    getLatestDiary(characterId, worldId) {
        const diaries = this.getCharacterDiaries(characterId, worldId);
        if (diaries.length === 0) {
            return null;
        }
        return diaries[diaries.length - 1];
    },

    getDiaryContext(characterId, worldId, maxDiaries = 3) {
        const diaries = this.getCharacterDiaries(characterId, worldId);
        if (diaries.length === 0) {
            return '';
        }

        const recentDiaries = diaries.slice(-maxDiaries);
        return '\n\n【角色的日记记录】\n' + recentDiaries.map(d => {
            const date = new Date(d.date).toLocaleString();
            return `${date}\n${d.content}`;
        }).join('\n\n---\n\n');
    },

    getAllDiaries(worldId) {
        return this._getDiaries(worldId);
    },

    deleteCharacterDiary(characterId, worldId) {
        const diaries = this._getDiaries(worldId);
        const index = diaries.findIndex(d => d.characterId === characterId);
        if (index !== -1) {
            diaries.splice(index, 1);
            this._saveDiaries(worldId, diaries);
            return true;
        }
        return false;
    },

    clearAllDiaries(worldId) {
        this._saveDiaries(worldId, []);
    }
});

View.register('chat-diary.main', function() {
    const world = Data.getCurrentWorld();
    if (!world) {
        return `<div style="padding: 20px; text-align: center; color: #999;">请先选择一个世界</div>`;
    }

    const diaryPlugin = window.ChatDiaryPlugin;
    if (!diaryPlugin) {
        return `<div style="padding: 20px; text-align: center; color: #999;">日记插件加载中...</div>`;
    }

    const diaries = diaryPlugin.getAllDiaries(world.id);
    const characters = Data.getCharacters(world.id);

    return `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>📔 聊天日记</h2>
                <button class="btn btn-secondary" onclick="showPage('chat')">← 返回聊天</button>
            </div>
            
            ${diaries.length === 0 ? `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📔</div>
                    <div>暂无日记记录</div>
                    <div style="font-size: 0.8rem; margin-top: 10px;">开始聊天后会自动生成日记</div>
                </div>
            ` : diaries.map(charDiary => {
                const character = characters.find(c => c.id === charDiary.characterId);
                const charName = charDiary.characterName || (character?.name || '未知角色');
                const entries = charDiary.entries || [];
                
                return `
                    <div style="background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">👤</span>
                                <span style="font-weight: 600; color: #333;">${charName}</span>
                            </div>
                            <span style="font-size: 0.75rem; color: #999;">${entries.length}篇日记</span>
                        </div>
                        
                        ${entries.length === 0 ? `
                            <div style="text-align: center; padding: 20px; color: #999; font-size: 0.85rem;">
                                暂无日记
                            </div>
                        ` : entries.slice().reverse().map(entry => {
                            const date = new Date(entry.date);
                            const dateStr = date.toLocaleDateString();
                            const timeStr = date.toLocaleTimeString();
                            
                            return `
                                <div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                                    <div style="font-size: 0.7rem; color: #999; margin-bottom: 8px;">
                                        📅 ${dateStr} ${timeStr}
                                    </div>
                                    <div style="font-size: 0.9rem; color: #333; line-height: 1.6; white-space: pre-wrap;">
                                        ${entry.content}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }).join('')}
        </div>
    `;
});

ViewCallbacks.chatDiary = ViewCallbacks.chatDiary || {};

ViewCallbacks.chatDiary.showDiaryPage = function() {
    const main = document.getElementById('mainContent');
    if (main) {
        main.innerHTML = View.render('chat-diary.main');
    }
};

ViewCallbacks.chatDiary.deleteDiary = function(characterId, diaryId) {
    const world = Data.getCurrentWorld();
    if (!world) return;
    
    if (!confirm('确定要删除这篇日记吗？')) return;
    
    const diaryPlugin = window.ChatDiaryPlugin;
    if (!diaryPlugin) return;
    
    const diaries = diaryPlugin.getAllDiaries(world.id);
    const charDiary = diaries.find(d => d.characterId === characterId);
    if (!charDiary) return;
    
    const entries = charDiary.entries.filter(e => e.id !== diaryId);
    charDiary.entries = entries;
    
    diaryPlugin._saveDiaries(world.id, diaries);
    
    const main = document.getElementById('mainContent');
    if (main) {
        main.innerHTML = View.render('chat-diary.main');
    }
};
