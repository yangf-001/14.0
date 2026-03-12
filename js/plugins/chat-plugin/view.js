View.register('chat-plugin.main', function() {
    const world = Data.getCurrentWorld();
    let plugin = window.ChatPlugin;
    
    if (!plugin || !plugin.getSessions) {
        return `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 1.2rem; color: #999;">聊天插件加载中，请稍候...</div>
            </div>
        `;
    }

    if (!world) {
        return `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 1.2rem; color: #999;">请先选择一个世界</div>
            </div>
        `;
    }

    const sessions = plugin.getSessions(world.id);
    const currentSession = plugin.getCurrentSession(world.id);
    const characters = Data.getCharacters(world.id);
    
    const isMobile = window.innerWidth <= 900;

    if (isMobile) {
        if (currentSession) {
            return ViewCallbacks.chat._renderChatArea(currentSession, characters);
        } else {
            return ViewCallbacks.chat._renderMobileChatList(sessions, currentSession);
        }
    }

    return `
        <div style="display: flex; height: calc(100vh - 160px); gap: 0; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="width: 160px; flex-shrink: 0; display: flex; flex-direction: column; background: #f8f9fa; border-right: 1px solid #e9ecef;">
                <div style="padding: 10px; border-bottom: 1px solid #e9ecef;">
                    <h3 style="margin: 0; color: #333; font-size: 0.9rem;">💬 对话</h3>
                </div>
                <button class="btn" onclick="ViewCallbacks.chat.startNewChat()" style="margin: 10px; width: calc(100% - 20px); background: #6c5ce7; color: white; border: none; padding: 6px; font-size: 0.8rem;">
                    ➕ 新建
                </button>
                <div style="flex: 1; overflow-y: auto; padding: 0 8px 8px;" id="chatSessionList">
                    ${plugin.getSessionList(world.id)}
                </div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
                ${currentSession ? ViewCallbacks.chat._renderChatArea(currentSession, characters) : ViewCallbacks.chat._renderWelcome(characters)}
            </div>
        </div>
    `;
});

View.register('chat-plugin.settings', function() {
    const plugin = window.ChatPlugin;
    const settings = plugin.getSettings();

    return `
        <div style="max-width: 700px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>⚙️ 聊天设置</h2>
                <button class="btn btn-secondary" onclick="showPage('chat')">← 返回聊天</button>
            </div>

            <div class="card" style="margin-bottom: 16px;">
                <h4 style="margin-bottom: 16px;">系统提示词</h4>
                <textarea id="chatSystemPrompt" rows="6" style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-family: inherit;" placeholder="输入系统提示词...">${settings.systemPrompt || ''}</textarea>
                <div style="margin-top: 8px; font-size: 0.8rem; color: var(--text-dim);">
                    定义AI角色的行为和对话风格
                </div>
            </div>

            <div class="card" style="margin-bottom: 16px;">
                <h4 style="margin-bottom: 16px;">对话设置</h4>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px;">Temperature: <span id="tempValue">${settings.temperature || 0.7}</span></label>
                    <input type="range" id="chatTemperature" min="0" max="1" step="0.1" value="${settings.temperature || 0.7}" style="width: 100%;" onchange="document.getElementById('tempValue').textContent = this.value">
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px;">Max Tokens: <span id="tokensValue">${settings.maxTokens || 500}</span></label>
                    <input type="range" id="chatMaxTokens" min="100" max="2000" step="100" value="${settings.maxTokens || 500}" style="width: 100%;" onchange="document.getElementById('tokensValue').textContent = this.value">
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="chatIncludeHistory" ${settings.includeHistory !== false ? 'checked' : ''}>
                        包含对话历史
                    </label>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px;">历史消息数量</label>
                    <select id="chatHistoryCount" style="padding: 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        <option value="3" ${settings.historyCount === 3 ? 'selected' : ''}>3条</option>
                        <option value="5" ${settings.historyCount === 5 || !settings.historyCount ? 'selected' : ''}>5条</option>
                        <option value="10" ${settings.historyCount === 10 ? 'selected' : ''}>10条</option>
                        <option value="20" ${settings.historyCount === 20 ? 'selected' : ''}>20条</option>
                    </select>
                </div>
                <div>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="chatShowActions" ${settings.showActions !== false ? 'checked' : ''}>
                        显示角色动作描写
                    </label>
                </div>
            </div>

            <div style="display: flex; gap: 8px;">
                <button class="btn" onclick="ViewCallbacks.chat.saveSettings()">💾 保存设置</button>
                <button class="btn btn-secondary" onclick="ViewCallbacks.chat.resetSettings()">🔄 恢复默认</button>
            </div>
        </div>
    `;
});

ViewCallbacks.chat = ViewCallbacks.chat || {};

ViewCallbacks.chat._renderMobileChatList = function(sessions, currentSession) {
    const world = Data.getCurrentWorld();
    if (!world) {
        return `<div style="padding: 40px; text-align: center;">请先选择一个世界</div>`;
    }
    const characters = Data.getCharacters(world.id);
    
    return `
        <div style="display: flex; flex-direction: column; height: calc(100vh - 120px); background: #f8f9fa;">
            <div style="padding: 16px; background: #fff; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; color: #333; font-size: 1.1rem;">💬 聊天</h3>
                <button class="btn" onclick="ViewCallbacks.chat.startNewChat()" style="background: #6c5ce7; color: white; border: none; padding: 8px 16px; border-radius: 20px; font-size: 0.85rem;">
                    ➕ 新建
                </button>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 12px;">
                ${sessions.length === 0 ? `
                    <div style="text-align: center; padding: 40px 20px; color: #999;">
                        <div style="font-size: 2rem; margin-bottom: 12px;">💬</div>
                        <div style="font-size: 0.95rem;">还没有对话</div>
                        <div style="font-size: 0.8rem; margin-top: 8px;">点击"新建"开始对话</div>
                    </div>
                ` : sessions.map(session => {
                    const aiChars = session.aiCharacters || [];
                    const aiNames = aiChars.map(id => {
                        const c = characters.find(ch => ch.id === id);
                        return c ? c.name : 'AI';
                    }).join(', ');
                    
                    const playerChar = session.playerCharId ? characters.find(ch => ch.id === session.playerCharId) : null;
                    const lastMsg = session.messages && session.messages.length > 0 ? session.messages[session.messages.length - 1] : null;
                    const time = lastMsg ? new Date(lastMsg.timestamp).toLocaleDateString() : '';
                    
                    return `
                        <div onclick="ViewCallbacks.chat.selectSession('${session.id}')" style="background: #fff; padding: 14px; border-radius: 10px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); cursor: pointer;">
                            <div style="font-weight: 600; color: #333; font-size: 0.95rem; margin-bottom: 4px;">${session.title}</div>
                            <div style="font-size: 0.75rem; color: #666;">
                                ${playerChar ? `🎮${playerChar.name}` : ''} ${aiNames ? ` + ${aiNames}` : ''}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                                <div style="font-size: 0.7rem; color: #999; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${lastMsg ? lastMsg.content.substring(0, 30) + (lastMsg.content.length > 30 ? '...' : '') : '暂无消息'}
                                </div>
                                <div style="font-size: 0.65rem; color: #bbb; margin-left: 8px;">${time}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
};

ViewCallbacks.chat.selectSession = function(sessionId) {
    const world = Data.getCurrentWorld();
    if (!world) return;
    
    const plugin = window.ChatPlugin;
    if (plugin) {
        plugin.setCurrentSession(world.id, sessionId);
    }
    
    const main = document.getElementById('mainContent');
    if (main) {
        main.innerHTML = View.render('chat-plugin.main');
    }
};

ViewCallbacks.chat._renderWelcome = function(characters) {
    const selectedChars = window._selectedChatChars = window._selectedChatChars || [];
    const playerCharId = window._playerCharId = window._playerCharId || null;
    
    if (!characters || characters.length === 0) {
        return `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: #fff; overflow-y: auto;">
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-size: 2rem; margin-bottom: 8px;">👤</div>
                <div style="font-size: 1rem; color: #666;">没有可用角色</div>
            </div>
            <div style="font-size: 0.85rem; color: #999; text-align: center;">
                请先在"角色"页面添加角色后再开始聊天
            </div>
        </div>
        `;
    }
    
    return `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: #fff; overflow-y: auto;">
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-size: 2rem; margin-bottom: 8px;">💬</div>
                <div style="font-size: 1rem; color: #666;">选择参与对话的角色</div>
            </div>
            
            <div style="margin-bottom: 12px;">
                <div style="font-size: 0.8rem; color: #999; margin-bottom: 6px;">🎭 玩家角色（你扮演）</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">
                    ${characters.map(c => `
                        <div class="player-char-btn ${playerCharId === c.id ? 'selected' : ''}" data-char-id="${c.id}" style="padding: 6px 12px; background: ${playerCharId === c.id ? '#ffeaa7' : '#f8f9fa'}; border: 2px solid ${playerCharId === c.id ? '#fdcb6e' : '#e9ecef'}; border-radius: 16px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;" onclick="ViewCallbacks.chat.setPlayerChar('${c.id}')">
                            🎮 ${c.name}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="margin-bottom: 12px; width: 100%; max-width: 350px;">
                <div style="font-size: 0.8rem; color: #999; margin-bottom: 6px;">🤖 AI角色（可多选）</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">
                    ${characters.map(c => `
                        <div class="ai-char-btn ${selectedChars.includes(c.id) ? 'selected' : ''}" data-char-id="${c.id}" style="padding: 6px 12px; background: ${selectedChars.includes(c.id) ? '#f0edff' : '#f8f9fa'}; border: 2px solid ${selectedChars.includes(c.id) ? '#6c5ce7' : '#e9ecef'}; border-radius: 16px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s;" onclick="ViewCallbacks.chat.toggleCharSelection('${c.id}')">
                            🤖 ${c.name}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div id="selectedInfo" style="font-size: 0.8rem; color: #6c5ce7; margin-bottom: 12px; ${selectedChars.length > 0 ? '' : 'display: none;'}">
                已选择 ${selectedChars.length} 个AI角色
                ${playerCharId ? ` · 玩家: ${characters.find(c => c.id === playerCharId)?.name || ''}` : ''}
            </div>
            
            <button id="startChatBtn" class="btn" onclick="ViewCallbacks.chat.startChatWithSelectedChars()" style="background: #6c5ce7; color: white; border: none; padding: 10px 24px; font-size: 0.9rem; ${selectedChars.length > 0 ? '' : 'opacity: 0.5; pointer-events: none;'}">
                开始对话 ${selectedChars.length > 0 ? `(${selectedChars.length}个AI)` : ''}
            </button>
        </div>
    `;
};

ViewCallbacks.chat.setPlayerChar = function(charId) {
    if (!window._playerCharId) {
        window._playerCharId = null;
    }
    
    if (window._playerCharId === charId) {
        window._playerCharId = null;
    } else {
        window._playerCharId = charId;
        
        const aiChars = window._selectedChatChars || [];
        const idx = aiChars.indexOf(charId);
        if (idx > -1) {
            aiChars.splice(idx, 1);
            window._selectedChatChars = aiChars;
        }
    }
    
    const world = Data.getCurrentWorld();
    if (world) {
        const main = document.getElementById('mainContent');
        if (main) {
            main.innerHTML = View.render('chat-plugin.main');
        }
    }
};

ViewCallbacks.chat._getCharacterStats = function(character) {
    const stats = character?.stats || {};
    return {
        intimacy: stats.intimacy || stats.affection || 50,
        arousal: stats.arousal || stats.sexArousal || stats.desire || 0,
        sensitivity: stats.sexSensitivity || stats.sensitivity || 50,
        willingness: stats.willingness || 50,
        experience: stats.experience || 0
    };
};

ViewCallbacks.chat._renderProgressBar = function(label, value, max = 100, color = '#6c5ce7') {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    return `
        <div style="margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: #666; margin-bottom: 2px;">
                <span>${label}</span>
                <span>${value}/${max}</span>
            </div>
            <div style="height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; width: ${percent}%; background: ${color}; border-radius: 2px; transition: width 0.3s;"></div>
            </div>
        </div>
    `;
};

ViewCallbacks.chat._renderCharacterPanel = function(character, isPlayer = false) {
    if (!character) return '';
    
    const stats = this._getCharacterStats(character);
    const profile = character.profile || {};
    
    return `
        <div style="width: 130px; flex-shrink: 0; display: flex; flex-direction: column; background: #f8f9fa; border-left: 1px solid #e9ecef; overflow-y: auto;">
            <div style="padding: 8px; text-align: center; border-bottom: 1px solid #e9ecef;">
                <div style="width: 36px; height: 36px; margin: 0 auto 4px; border-radius: 50%; background: linear-gradient(135deg, ${isPlayer ? '#fdcb6e' : '#a29bfe'}, ${isPlayer ? '#f39c12' : '#6c5ce7'}); display: flex; align-items: center; justify-content: center; font-size: 1rem;">${isPlayer ? '🎮' : '🤖'}</div>
                <div style="font-size: 0.75rem; font-weight: 600; color: #333; margin-bottom: 2px;">${character.name}</div>
                <div style="font-size: 0.6rem; color: ${isPlayer ? '#f39c12' : '#999'};">${isPlayer ? '🎮 你' : '🤖 AI'}</div>
            </div>
            
            <div style="padding: 6px; border-bottom: 1px solid #e9ecef; font-size: 0.65rem; color: #999;">性格: ${profile.personality ? profile.personality.substring(0, 8) + (profile.personality.length > 8 ? '...' : '') : '未知'}</div>
            
            <div style="padding: 6px; flex: 1; overflow-y: auto;">
<<<<<<< HEAD
                ${this._renderProgressBar('💕', stats.intimacy, 100, '#ff6b6b')}
                ${this._renderProgressBar('🔥', stats.arousal, 100, '#ff9f43')}
=======
                ${this._renderProgressBar('❤️', stats.affection, 100, '#ff6b6b')}
                ${this._renderProgressBar('💕', stats.intimacy, 100, '#feca57')}
                ${this._renderProgressBar('🔥', stats.desire, 100, '#ff9f43')}
>>>>>>> 6d274afa3f732818cdcc2d1805c6e6452a248cad
                ${this._renderProgressBar('✨', stats.sensitivity, 100, '#48dbfb')}
                ${this._renderProgressBar('💝', stats.willingness, 100, '#1dd1a1')}
                ${this._renderProgressBar('📚', stats.experience, 100, '#a29bfe')}
            </div>
        </div>
    `;
};

ViewCallbacks.chat._renderChatArea = function(session, characters) {
    let aiCharacters = [];
    if (session.aiCharacters && session.aiCharacters.length > 0) {
        aiCharacters = session.aiCharacters.map(id => characters.find(c => c.id === id)).filter(Boolean);
    }
    
    let playerCharacter = null;
    if (session.playerCharId) {
        playerCharacter = characters.find(c => c.id === session.playerCharId);
    }
    
    const messages = session.messages || [];
    const isMobile = window.innerWidth <= 900;

    return `
        <div style="display: flex; flex-direction: column; height: 100%; background: #fff;">
            <div style="padding: 8px 12px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; background: #fff;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${isMobile ? `<button onclick="ViewCallbacks.chat.backToList()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 4px;">←</button>` : ''}
                    <div>
                        <div style="font-weight: 600; color: #333; font-size: 0.9rem;">${session.title}</div>
                        <div style="font-size: 0.65rem; color: #999;">
                            ${playerCharacter ? `🎮${playerCharacter.name}` : ''} 
                            ${aiCharacters.length > 0 ? ` + ${aiCharacters.map(c => `🤖${c.name}`).join(' ')}` : ''}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button class="btn btn-secondary" onclick="ViewCallbacks.chat.exportCurrentSession()" title="导出" style="padding: 3px 6px; font-size: 0.75rem;">📤</button>
                    <button class="btn btn-secondary" onclick="ViewCallbacks.chat.deleteCurrentSession()" title="删除" style="padding: 3px 6px; font-size: 0.75rem;">🗑️</button>
                </div>
            </div>
            
            <div style="flex: 1; display: flex; overflow: hidden;">
                <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: 8px; background: #fafafa;">
                    ${messages.length === 0 ? `
                        <div style="text-align: center; padding: 20px; color: #999; font-size: 0.9rem;">
                            开始你们的对话吧...
                        </div>
                    ` : messages.map(m => ViewCallbacks.chat._renderMessage(m, aiCharacters, session.playerCharId)).join('')}
                </div>
                
                ${!isMobile ? (aiCharacters.length > 0 ? this._renderCharacterPanel(aiCharacters[0], false) : '') : ''}
                ${!isMobile ? (playerCharacter ? this._renderCharacterPanel(playerCharacter, true) : '') : ''}
            </div>
            
            <div style="padding: 8px 12px; border-top: 1px solid #e9ecef; background: #fff;">
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="chatInput" placeholder="输入消息..." style="flex: 1; padding: 8px 12px; border-radius: 18px; border: 1px solid #e9ecef; background: #f8f9fa; color: #333; outline: none; font-size: 0.85rem;" onkeypress="if(event.key==='Enter')ViewCallbacks.chat.sendMessage()">
                    <button class="btn" onclick="ViewCallbacks.chat.sendMessage()" style="background: #6c5ce7; color: white; border: none; border-radius: 18px; padding: 8px 14px; font-size: 0.85rem;">发送</button>
                </div>
            </div>
        </div>
    `;
};

ViewCallbacks.chat._renderMessage = function(message, aiCharacters, playerCharId) {
    const isUser = message.role === 'user';
    const time = new Date(message.timestamp).toLocaleTimeString();
    
    const messageCharName = message.characterName || (isUser ? '你' : 'AI');

    if (isUser) {
        return `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
                <div style="max-width: 65%;">
                    <div style="background: linear-gradient(135deg, #fdcb6e, #f39c12); color: white; padding: 8px 14px; border-radius: 14px 14px 4px 14px; word-break: break-word; font-size: 0.9rem;">
                        ${message.content}
                    </div>
                    <div style="font-size: 0.6rem; color: #bbb; text-align: right; margin-top: 2px;">${time}</div>
                </div>
            </div>
        `;
    } else {
        return `
            <div style="display: flex; justify-content: flex-start; margin-bottom: 10px;">
                <div style="max-width: 65%;">
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #a29bfe, #6c5ce7); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: white; font-size: 0.8rem;">🤖</div>
                        <div>
                            <div style="font-weight: 500; font-size: 0.75rem; color: #666; margin-bottom: 4px;">${messageCharName}</div>
                            <div style="background: white; padding: 10px 14px; border-radius: 14px 14px 14px 4px; word-break: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.08); border: 1px solid #e9ecef; font-size: 0.9rem;">
                                ${message.content}
                            </div>
                            <div style="font-size: 0.6rem; color: #bbb; margin-top: 2px;">${time}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

ViewCallbacks.chat.startNewChat = function() {
    window._selectedChatChars = [];
    window._playerCharId = null;
    showPage('chat');
};

ViewCallbacks.chat.backToList = function() {
    const world = Data.getCurrentWorld();
    if (!world) return;
    
    const plugin = window.ChatPlugin;
    if (plugin) {
        plugin.setCurrentSession(world.id, null);
    }
    
    const main = document.getElementById('mainContent');
    if (main) {
        main.innerHTML = View.render('chat-plugin.main');
    }
};

ViewCallbacks.chat.toggleCharSelection = function(charId) {
    if (!window._selectedChatChars) {
        window._selectedChatChars = [];
    }
    
    if (charId === window._playerCharId) {
        return;
    }
    
    const idx = window._selectedChatChars.indexOf(charId);
    if (idx > -1) {
        window._selectedChatChars.splice(idx, 1);
    } else {
        window._selectedChatChars.push(charId);
    }
    
    const world = Data.getCurrentWorld();
    if (world) {
        const main = document.getElementById('mainContent');
        if (main) {
            main.innerHTML = View.render('chat-plugin.main');
        }
    }
};

ViewCallbacks.chat.startChatWithSelectedChars = async function() {
    const world = Data.getCurrentWorld();
    if (!world) return;

    const aiCharIds = window._selectedChatChars || [];
    const playerCharId = window._playerCharId;
    
    if (aiCharIds.length === 0) {
        alert('请先选择至少一个AI角色');
        return;
    }

    const plugin = window.ChatPlugin;

    ViewCallbacks.chat._showLoading('正在开始对话...');

    try {
        const result = await plugin.startChatWithCharacters(aiCharIds, playerCharId);

        plugin.setCurrentSession(world.id, result.session.id);
        window._selectedChatChars = [];
        window._playerCharId = null;

        showPage('chat');

    } catch (e) {
        alert('开始对话失败：' + e.message);
    }
};

ViewCallbacks.chat.selectCharacterForChat = async function(characterId) {
    await this.startChatWithSelectedChars();
};

ViewCallbacks.chat.sendMessage = async function() {
    const world = Data.getCurrentWorld();
    if (!world) return;

    const input = document.getElementById('chatInput');
    const message = input?.value?.trim();

    if (!message) return;

    input.value = '';
    input.disabled = true;

    const plugin = window.ChatPlugin;
    const currentSession = plugin.getCurrentSession(world.id);

    if (!currentSession) {
        alert('请先选择一个会话');
        input.disabled = false;
        return;
    }

    const chatMessages = document.getElementById('chatMessages');

    currentSession.messages.push({
        role: 'user',
        content: message,
        timestamp: Date.now(),
        characterName: '你'
    });

    const userMessageHtml = ViewCallbacks.chat._renderMessage(
        currentSession.messages[currentSession.messages.length - 1],
        [],
        currentSession.playerCharId
    );
    chatMessages.insertAdjacentHTML('beforeend', userMessageHtml);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const result = await plugin.sendMessage(currentSession.id, message);

        const characters = Data.getCharacters(world.id);
        let aiCharacters = [];
        if (result.session.aiCharacters && result.session.aiCharacters.length > 0) {
            aiCharacters = result.session.aiCharacters.map(id => characters.find(c => c.id === id)).filter(Boolean);
        }

        const assistantMessageHtml = ViewCallbacks.chat._renderMessage(
            result.session.messages[result.session.messages.length - 1],
            aiCharacters,
            result.session.playerCharId
        );
        chatMessages.insertAdjacentHTML('beforeend', assistantMessageHtml);
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (e) {
        ViewCallbacks.chat._hideLoading();
        alert('发送消息失败：' + e.message);
        currentSession.messages.pop();
    } finally {
        input.disabled = false;
        input.focus();
    }
};

ViewCallbacks.chat.deleteCurrentSession = function() {
    const world = Data.getCurrentWorld();
    if (!world) return;

    if (!confirm('确定要删除这个会话吗？')) return;

    const plugin = window.ChatPlugin;
    const currentSession = plugin.getCurrentSession(world.id);

    if (currentSession) {
        plugin.deleteSession(world.id, currentSession.id);
        showPage('chat');
    }
};

ViewCallbacks.chat.exportCurrentSession = function() {
    const world = Data.getCurrentWorld();
    if (!world) return;

    const plugin = window.ChatPlugin;
    const currentSession = plugin.getCurrentSession(world.id);

    if (currentSession) {
        plugin.exportSession(currentSession.id);
    }
};

ViewCallbacks.chat.saveSettings = function() {
    const plugin = window.ChatPlugin;

    const settings = {
        systemPrompt: document.getElementById('chatSystemPrompt').value,
        temperature: parseFloat(document.getElementById('chatTemperature').value),
        maxTokens: parseInt(document.getElementById('chatMaxTokens').value),
        includeHistory: document.getElementById('chatIncludeHistory').checked,
        historyCount: parseInt(document.getElementById('chatHistoryCount').value),
        showActions: document.getElementById('chatShowActions').checked
    };

    plugin.saveSettings(settings);
    alert('设置已保存！');
    showPage('chat');
};

ViewCallbacks.chat.resetSettings = function() {
    if (!confirm('确定要恢复默认设置吗？')) return;

    const plugin = window.ChatPlugin;
    const defaultSettings = plugin._getDefaultSettings();
    plugin.saveSettings(defaultSettings);

    showPage('chat-settings');
};

ViewCallbacks.chat._showLoading = function(message) {
    LoadingManager.show(message || '加载中...');
};

ViewCallbacks.chat._hideLoading = function() {
    LoadingManager.hide();
};

if (window.ChatPlugin) {
    window.ChatPlugin._callbacks = window.ChatPlugin._callbacks || {};
    window.ChatPlugin._callbacks.showLoading = ViewCallbacks.chat._showLoading;
    window.ChatPlugin._callbacks.hideLoading = ViewCallbacks.chat._hideLoading;
}
