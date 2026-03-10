PluginSystem.register('chat-plugin', {
    description: '聊天插件 - 与AI角色进行实时对话',
    features: ['角色对话', '实时聊天', '会话管理', '聊天记录保存'],

    init() {
        window.ChatPlugin = this;
        console.log('Chat plugin loaded');
        this._initChatSystem();
        this._initDefaultSettings();
    },

    _initChatSystem() {
        this.chatSystem = {
            createSession: this.createSession.bind(this),
            getSessions: this.getSessions.bind(this),
            getCurrentSession: this.getCurrentSession.bind(this),
            setCurrentSession: this.setCurrentSession.bind(this),
            sendMessage: this.sendMessage.bind(this),
            getMessages: this.getMessages.bind(this),
            deleteSession: this.deleteSession.bind(this),
            buildChatPrompt: this._buildChatPrompt.bind(this),
            cleanChatResponse: this._cleanChatResponse.bind(this)
        };
    },

    _initDefaultSettings() {
        const defaultSettings = {
            systemPrompt: '你是一个虚拟角色。请根据角色设定与用户进行自然、流畅的对话。保持角色个性，用第一人称回应。可以适当加入一些动作描写来丰富对话。',
            temperature: 0.7,
            maxTokens: 500,
            includeHistory: true,
            historyCount: 5,
            showActions: true
        };

        if (!localStorage.getItem('chat_plugin_settings')) {
            localStorage.setItem('chat_plugin_settings', JSON.stringify(defaultSettings));
        }
    },

    getChatSystem() {
        return this.chatSystem;
    },

    getSettings() {
        const stored = localStorage.getItem('chat_plugin_settings');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {}
        }
        return this._getDefaultSettings();
    },

    saveSettings(settings) {
        localStorage.setItem('chat_plugin_settings', JSON.stringify(settings));
    },

    _getDefaultSettings() {
        return {
            systemPrompt: '你是一个虚拟角色。请根据角色设定与用户进行自然、流畅的对话。保持角色个性，用第一人称回应。可以适当加入一些动作描写来丰富对话。',
            temperature: 0.7,
            maxTokens: 500,
            includeHistory: true,
            historyCount: 5,
            showActions: true
        };
    },

    getWorldTimeAPI() {
        const world = Data.getCurrentWorld();
        if (!world) return null;
        const timePlugin = window.WorldTimePlugin;
        if (!timePlugin) return null;
        return timePlugin.getDisplayTime(world.id);
    },

    createSession(config) {
        const world = Data.getCurrentWorld();
        if (!world) return null;

        const sessions = this.getSessions(world.id);
        
        let characterIds = config.characterIds;
        let characterNames = config.characterNames;
        let title = config.title;
        
        if (!characterIds && config.characterId) {
            characterIds = [config.characterId];
            characterNames = [config.characterName];
        }
        
        if (!title && characterNames && characterNames.length > 0) {
            if (characterNames.length === 1) {
                title = `与${characterNames[0]}的对话`;
            } else if (characterNames.length === 2) {
                title = `与${characterNames[0]}、${characterNames[1]}的对话`;
            } else {
                title = `与${characterNames[0]}等${characterNames.length}人的对话`;
            }
        }

        const session = {
            id: Data._genId(),
            worldId: world.id,
            characterIds: characterIds || [],
            characterNames: characterNames || [],
            aiCharacters: config.characters || [],
            playerCharId: config.playerCharId || null,
            playerCharacter: config.playerCharacter || null,
            title: title || '新对话',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
        };

        sessions.unshift(session);
        this._saveSessions(world.id, sessions);

        return session;
    },

    getSessions(worldId) {
        try {
            return JSON.parse(localStorage.getItem(`chat_sessions_${worldId}`) || '[]');
        } catch {
            return [];
        }
    },

    _saveSessions(worldId, sessions) {
        localStorage.setItem(`chat_sessions_${worldId}`, JSON.stringify(sessions));
    },

    getCurrentSession(worldId) {
        const currentId = localStorage.getItem(`chat_current_session_${worldId}`);
        if (!currentId) return null;

        const sessions = this.getSessions(worldId);
        return sessions.find(s => s.id === currentId) || null;
    },

    setCurrentSession(worldId, sessionId) {
        localStorage.setItem(`chat_current_session_${worldId}`, sessionId);
    },

    getMessages(sessionId) {
        const world = Data.getCurrentWorld();
        if (!world) return [];

        const sessions = this.getSessions(world.id);
        const session = sessions.find(s => s.id === sessionId);
        return session?.messages || [];
    },

    deleteSession(worldId, sessionId) {
        const sessions = this.getSessions(worldId);
        const idx = sessions.findIndex(s => s.id === sessionId);

        if (idx !== -1) {
            sessions.splice(idx, 1);
            this._saveSessions(worldId, sessions);

            const currentId = localStorage.getItem(`chat_current_session_${worldId}`);
            if (currentId === sessionId) {
                localStorage.removeItem(`chat_current_session_${worldId}`);
            }

            return true;
        }

        return false;
    },

    updateSessionMessages(worldId, sessionId, messages) {
        const sessions = this.getSessions(worldId);
        const session = sessions.find(s => s.id === sessionId);

        if (session) {
            session.messages = messages;
            session.updatedAt = Date.now();
            this._saveSessions(worldId, sessions);
        }
    },

    _buildChatPrompt(aiCharacters, playerCharacter, messages, settings) {
        const world = Data.getCurrentWorld();
        const worldId = world?.id;
        
        const charList = Array.isArray(aiCharacters) ? aiCharacters : (aiCharacters ? [aiCharacters] : []);
        let charInfo = '';
        
        if (charList.length > 0) {
            charInfo = charList.map(character => {
                const profile = character.profile || {};
                const parts = [character.name];

                if (character.gender) parts.push(character.gender);
                if (character.age) parts.push(`${character.age}岁`);

                if (profile.personality) parts.push(profile.personality);
                if (profile.appearance) parts.push(`外表：${profile.appearance}`);
                if (profile.backstory) parts.push(`背景：${profile.backstory}`);

                return parts.join('，');
            }).join('\n');
        }

        let playerInfo = '';
        if (playerCharacter) {
            const profile = playerCharacter.profile || {};
            const parts = [playerCharacter.name + '(你)'];

            if (playerCharacter.gender) parts.push(playerCharacter.gender);
            if (playerCharacter.age) parts.push(`${playerCharacter.age}岁`);
            if (profile.personality) parts.push(profile.personality);

            playerInfo = parts.join('，');
        }

        const timePlugin = window.WorldTimePlugin;
        let timeContext = '';
        if (timePlugin && worldId) {
            const timeInfo = timePlugin.getDisplayTime(worldId);
            if (timeInfo) {
                timeContext = `\n【当前时间】${timeInfo.formatted}`;
            }
        }

        let historyContext = '';
        if (settings.includeHistory && messages.length > 0) {
            const recentMessages = messages.slice(-settings.historyCount * 2);
            historyContext = '\n【对话历史】\n' + recentMessages.map(m => {
                if (m.role === 'user') {
                    return `${playerCharacter ? playerCharacter.name : '你'}：${m.content}`;
                } else {
                    const charName = m.characterName || (charList.length > 0 ? charList[0].name : '角色');
                    return `${charName}：${m.content}`;
                }
            }).join('\n');
        }

        let prompt = settings.systemPrompt || '';
        
        if (playerInfo) {
            prompt += `\n\n【玩家角色】${playerInfo}`;
        }
        
        if (charList.length > 0) {
            if (charList.length === 1) {
                prompt += `\n\n【AI角色信息】${charInfo}`;
            } else {
                prompt += `\n\n【参与对话的AI角色们】\n${charInfo}`;
            }
        }

        if (timeContext) {
            prompt += timeContext;
        }

        const storyHistory = this._getStoryHistory(worldId);
        if (storyHistory.length > 0) {
            prompt += '\n\n【之前的故事剧情】\n' + storyHistory.join('\n\n---\n\n');
        }

        if (historyContext) {
            prompt += historyContext;
        }

        if (charList.length > 1) {
            prompt += '\n\n这是多人对话。你可以选择一个角色来回复，或者让多个角色进行互动。用第一人称回复，适当加入动作描写（用括号包裹）。';
        } else {
            prompt += '\n\n请根据以上设定进行对话。用第一人称回复，适当加入动作描写（用括号包裹）。';
        }

        return prompt;
    },

    _getStoryHistory(worldId) {
        const allStoryHistory = [];
        
        if (!window.Story) return allStoryHistory;
        
        try {
            const level3Archives = window.Story.getLevel3Archives ? window.Story.getLevel3Archives(worldId) : [];
            for (const l3 of level3Archives) {
                if (l3.summary && l3.summary !== '[待生成综合摘要]') {
                    allStoryHistory.push(`[三级储存]\n${l3.summary}`);
                }
            }
            
            const level2Archives = window.Story.getLevel2Archives ? window.Story.getLevel2Archives(worldId) : [];
            for (const l2 of level2Archives) {
                if (l2.summary && l2.summary !== '[待生成总结]') {
                    allStoryHistory.push(`[二级储存]\n${l2.summary}`);
                }
            }
            
            const archives = window.Story.getArchives ? window.Story.getArchives(worldId) : [];
            for (const archive of archives) {
                const title = archive.title ? `[${archive.title}]` : '';
                if (archive.fullSummary) {
                    allStoryHistory.push(`${title}[一级储存]\n${archive.fullSummary}`);
                }
            }
        } catch (e) {
            console.error('获取故事历史失败:', e);
        }
        
        return allStoryHistory;
    },

    _cleanChatResponse(content) {
        if (!content) return content;

        let cleaned = content;

        const namePatterns = [
            /^(角色|AI)[:：]\s*/,
            /^assistant[:：]\s*/i,
            /^\[.*?\]\s*/
        ];

        for (const pattern of namePatterns) {
            cleaned = cleaned.replace(pattern, '');
        }

        cleaned = cleaned.trim();

        return cleaned;
    },

    async sendMessage(sessionId, userMessage) {
        if (this._callbacks?.showLoading) {
            this._callbacks.showLoading('正在回复...');
        } else {
            LoadingManager.show('正在回复...');
        }

        const world = Data.getCurrentWorld();
        if (!world) throw new Error('请先选择一个世界');

        const sessions = this.getSessions(world.id);
        const session = sessions.find(s => s.id === sessionId);
        if (!session) throw new Error('会话不存在');

        const messages = session.messages || [];
        messages.push({
            role: 'user',
            content: userMessage,
            timestamp: Date.now()
        });

        let aiCharacters = [];
        if (session.characters && session.characters.length > 0) {
            aiCharacters = session.characters;
        } else if (session.characterIds && session.characterIds.length > 0) {
            aiCharacters = session.characterIds.map(id => Data.getCharacter(world.id, id)).filter(Boolean);
        } else if (session.character) {
            aiCharacters = [session.character];
        }
        
        let playerCharacter = null;
        if (session.playerCharId) {
            playerCharacter = Data.getCharacter(world.id, session.playerCharId);
        }
        
        const settings = this.getSettings();

        const prompt = this._buildChatPrompt(aiCharacters, playerCharacter, messages, settings);

        try {
            const response = await ai.call(prompt, {
                temperature: settings.temperature || 0.7,
                maxTokens: settings.maxTokens || 500
            });

            const cleanResponse = this._cleanChatResponse(response);

            messages.push({
                role: 'assistant',
                content: cleanResponse,
                timestamp: Date.now(),
                characterName: aiCharacters.length > 0 ? aiCharacters[0].name : '角色'
            });

            this.updateSessionMessages(world.id, sessionId, messages);

            if (this._callbacks?.hideLoading) {
                this._callbacks.hideLoading();
            } else {
                LoadingManager.hide();
            }

            return {
                message: cleanResponse,
                session: session
            };
        } catch (e) {
            messages.pop();
            this.updateSessionMessages(world.id, sessionId, messages);
            
            if (this._callbacks?.hideLoading) {
                this._callbacks.hideLoading();
            } else {
                LoadingManager.hide();
            }
            
            throw e;
        }
    },

    async startChatWithCharacters(characterIds, playerCharId = null) {
        if (this._callbacks?.showLoading) {
            this._callbacks.showLoading('正在开始对话...');
        } else {
            LoadingManager.show('正在开始对话...');
        }

        const world = Data.getCurrentWorld();
        if (!world) throw new Error('请先选择一个世界');

        if (!characterIds || characterIds.length === 0) {
            throw new Error('请选择至少一个AI角色');
        }

        const aiCharacters = characterIds.map(id => Data.getCharacter(world.id, id)).filter(Boolean);
        if (aiCharacters.length === 0) throw new Error('AI角色不存在');

        let playerCharacter = null;
        if (playerCharId) {
            playerCharacter = Data.getCharacter(world.id, playerCharId);
        }

        const session = this.createSession({
            characterIds: characterIds,
            characterNames: aiCharacters.map(c => c.name),
            characters: aiCharacters,
            playerCharId: playerCharId,
            playerCharacter: playerCharacter
        });

        this.setCurrentSession(world.id, session.id);

        const settings = this.getSettings();
        const prompt = this._buildChatPrompt(aiCharacters, playerCharacter, [], settings);

        try {
            const greeting = await ai.call(prompt, {
                temperature: settings.temperature || 0.7,
                maxTokens: settings.maxTokens || 500
            });

            const cleanGreeting = this._cleanChatResponse(greeting);

            session.messages.push({
                role: 'assistant',
                content: cleanGreeting,
                timestamp: Date.now(),
                characterName: aiCharacters.length > 0 ? aiCharacters[0].name : '角色'
            });

            this.updateSessionMessages(world.id, session.id, session.messages);

            if (this._callbacks?.hideLoading) {
                this._callbacks.hideLoading();
            } else {
                LoadingManager.hide();
            }

            return {
                session: session,
                greeting: cleanGreeting
            };
        } catch (e) {
            console.error('生成开场白失败:', e);
            
            if (this._callbacks?.hideLoading) {
                this._callbacks.hideLoading();
            } else {
                LoadingManager.hide();
            }
            
            return {
                session: session,
                greeting: '大家好！有什么想聊的吗？'
            };
        }
    },

    async startChatWithCharacter(characterId) {
        return this.startChatWithCharacters([characterId]);
    },

    getSessionList(worldId) {
        const sessions = this.getSessions(worldId);

        if (sessions.length === 0) {
            return '<div style="text-align: center; padding: 20px; color: #999; font-size: 0.85rem;">暂无聊天记录</div>';
        }

        return sessions.map(s => `
            <div class="chat-session-item" data-id="${s.id}" style="padding: 12px; background: white; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#6c5ce7'; this.style.background='#f0edff'" onmouseout="this.style.borderColor='#e9ecef'; this.style.background='white'">
                <div style="font-weight: 500; color: #333;">${s.title}</div>
                <div style="font-size: 0.75rem; color: #999; margin-top: 4px;">
                    ${s.messages.length}条消息 · ${new Date(s.updatedAt).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    },

    exportSession(sessionId) {
        const world = Data.getCurrentWorld();
        if (!world) return null;

        const sessions = this.getSessions(world.id);
        const session = sessions.find(s => s.id === sessionId);

        if (!session) return null;

        const exportData = {
            type: 'chat_session',
            version: 1,
            exportTime: Date.now(),
            session: session
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `聊天_${session.title}_${new Date(session.createdAt).toLocaleDateString()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        return exportData;
    },

    importSession(worldId, jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.session) {
                throw new Error('无效的聊天记录文件');
            }

            const session = data.session;
            session.worldId = worldId;
            session.id = Data._genId();
            session.createdAt = Date.now();
            session.updatedAt = Date.now();

            const sessions = this.getSessions(worldId);
            sessions.unshift(session);
            this._saveSessions(worldId, sessions);

            return session;
        } catch (e) {
            throw new Error('导入失败：' + e.message);
        }
    }
});
