const Pages = {
    async renderChat(main) {
        if (PluginSystem && !PluginSystem.loaded) {
            await PluginSystem.init();
        }
        if (typeof View !== 'undefined' && View.render) {
            main.innerHTML = View.render('chat-plugin.main');
            setTimeout(() => {
                const chatMessages = document.getElementById('chatMessages');
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }, 50);
        } else {
            main.innerHTML = '<div class="empty">聊天插件未加载</div>';
        }
    },

    renderStoryConfig(main) {
        if (typeof View !== 'undefined' && View.render) {
            main.innerHTML = View.render('story-config.main');
        } else {
            main.innerHTML = '<div class="empty">AI设置插件未加载</div>';
        }
    },

    renderHome(main, right) {
        const world = Data.getCurrentWorld();
        
        main.innerHTML = `
            <h2>欢迎</h2>
            <p class="desc">${world ? `当前世界：${world.name}` : '请选择一个世界开始'}</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div class="card" onclick="showPage('worlds')">
                    <div class="title">🌍 世界</div>
                    <div class="meta">创建和管理故事世界</div>
                </div>
                <div class="card" onclick="showPage('characters')">
                    <div class="title">👤 角色</div>
                    <div class="meta">创建和管理角色</div>
                </div>
                <div class="card" onclick="showPage('story')">
                    <div class="title">📖 故事</div>
                    <div class="meta">开始新的故事旅程</div>
                </div>
                <div class="card" onclick="showPage('simple-story')">
                    <div class="title">⚡ 小故事</div>
                    <div class="meta">快速随机词条故事</div>
                </div>
                <div class="card" onclick="showPage('settings')">
                    <div class="title">⚙️ 设置</div>
                    <div class="meta">配置AI和内容偏好</div>
                </div>
            </div>
        `;
        
        if (world) {
            right.innerHTML = `
                <h4 style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 16px;">快捷操作</h4>
                <button class="btn" onclick="showPage('story')" style="width: 100%; margin-bottom: 8px;">开始新故事</button>
                <button class="btn btn-secondary" onclick="showPage('characters')" style="width: 100%;">管理角色</button>
            `;
        }
    },

    renderWorlds(main) {
        const worlds = Data.getWorlds();
        
        main.innerHTML = `
            <h2>世界管理</h2>
            <p class="desc">创建和管理你的故事世界</p>
            
            <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="btn" onclick="showCreateWorld()">+ 创建世界</button>
                <button class="btn" onclick="PresetCharacterLibrary.showWorldSelector()">📚 从预设导入</button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;">
                ${worlds.map(w => `
                    <div class="card" onclick="selectWorld('${w.id}')">
                        <div class="title">${w.name}</div>
                        <div class="meta">${w.type} · ${new Date(w.created).toLocaleDateString()}</div>
                        <div style="margin-top: 12px; display: flex; gap: 8px;">
                            <button class="btn btn-secondary" onclick="event.stopPropagation(); editWorld('${w.id}')" style="padding: 6px 12px; font-size: 0.8rem;">编辑</button>
                            <button class="btn btn-secondary" onclick="event.stopPropagation(); deleteWorld('${w.id}')" style="padding: 6px 12px; font-size: 0.8rem;">删除</button>
                        </div>
                    </div>
                `).join('')}
                ${worlds.length === 0 ? '<div class="empty">暂无世界，点击上方创建</div>' : ''}
            </div>
        `;
    },

    renderCharacters(main) {
        const world = Data.getCurrentWorld();
        
        if (!world) {
            main.innerHTML = `<h2>角色管理</h2><p class="desc">请先选择一个世界</p><div class="empty">请先在"世界"页面选择一个世界</div>`;
            return;
        }
        
        const chars = Data.getCharacters(world.id);
        
        main.innerHTML = `
            <h2>角色管理</h2>
            <p class="desc">当前世界：${world.name}</p>
            
            <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
                ${chars.map(c => `
                    <div class="char-tag" onclick="showCharInfo('${c.id}')">
                        ${c.name}
                    </div>
                `).join('')}
                ${chars.length === 0 ? '<div class="empty">暂无角色，请在角色插件中创建</div>' : ''}
            </div>
            <div id="charInfoContainer"></div>
        `;
        
        const right = document.getElementById('rightPanel');
        if (right) {
            right.innerHTML = `
                <h4 style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 16px;">当前世界</h4>
                <div class="card" style="cursor: default;">
                    <div class="title">${world.name}</div>
                    <div class="meta">${world.type} · ${chars.length}个角色</div>
                </div>
                ${chars.slice(0, 3).map(c => `
                    <div class="char-mini">
                        <div class="avatar">${c.name[0]}</div>
                        <div class="info">
                            <div class="name">${c.name}</div>
                            <div class="role">${c.role}</div>
                        </div>
                    </div>
                `).join('')}
                ${chars.length > 3 ? `<p style="font-size: 0.8rem; color: var(--text-dim);">+${chars.length - 3}个角色</p>` : ''}
            `;
        }
    },

    async renderSimpleStory(main) {
        const world = Data.getCurrentWorld();
        
        if (!world) {
            main.innerHTML = `<h2>⚡ 小故事</h2><p class="desc">请先选择一个世界</p><div class="empty">请先在"世界"页面选择一个世界</div>`;
            return;
        }
        
        const chars = Data.getCharacters(world.id);
        
        if (chars.length === 0) {
            main.innerHTML = `<h2>⚡ 小故事</h2><p class="desc">当前世界：${world.name}</p><div class="empty">请先添加角色</div>`;
            return;
        }
        
        main.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2>⚡ 小故事</h2>
                    <p class="desc">${world.name}</p>
                </div>
            </div>
            
            <div style="text-align: center; padding: 40px;">
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 0.9rem; color: var(--text-dim); margin-bottom: 12px; text-align: left;">选择参与角色（至少1个）:</div>
                    <div id="simpleStoryCharSelector" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                        ${chars.map(c => `
                            <label style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: var(--card); border-radius: 6px; cursor: pointer; border: 1px solid var(--border);">
                                <input type="checkbox" name="simpleStoryChars" value="${c.id}" checked style="width: 16px; height: 16px;">
                                <span>${c.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <p style="margin-bottom: 20px; color: var(--text-dim);">每次从词条库随机抽取玩法相关词条，详细描写动作场景</p>
                <button class="btn" id="startSimpleStoryBtn" style="font-size: 1.1rem; padding: 12px 32px;">🎲 开始小故事</button>
            </div>
        `;
        
        setTimeout(() => {
            const simpleStoryPlugin = PluginSystem.get('simple-story');
            if (simpleStoryPlugin) {
                simpleStoryPlugin._initSimpleStoryPage();
            }
        }, 100);
    },

    renderStory(main) {
        const world = Data.getCurrentWorld();
        
        if (!world) {
            main.innerHTML = `<h2>故事</h2><p class="desc">请先选择一个世界</p><div class="empty">请先在"世界"页面选择一个世界</div>`;
            return;
        }
        
        const chars = Data.getCharacters(world.id);
        
        if (chars.length === 0) {
            main.innerHTML = `<h2>故事</h2><p class="desc">当前世界：${world.name}</p><div class="empty">请先添加角色</div>`;
            return;
        }
        
        const story = Story.load(world.id);
        const storyNodes = world.storyNodes || [];
        const userSelectedNode = window._userSelectedStoryNode;
        
        const hasNodes = storyNodes.length > 0;
        const hasOngoingStory = story && story.status === 'ongoing';
        
        if (hasNodes && !userSelectedNode && !hasOngoingStory) {
            const unlockedNodes = storyNodes.filter(n => n && (n.unlocked === undefined || n.unlocked === true));
            const storyNodesListHtml = unlockedNodes.length > 0 
                ? unlockedNodes.map((node, index) => {
                    const displayName = node.name.replace(/剧情节点|剧情/gi, '').trim() || node.name;
                    const nodeName = node.name;
                    return `
                        <div class="story-node-card" style="padding: 16px 20px; background: var(--card); border-radius: 12px; margin-bottom: 12px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; text-align: left;"
                            onclick="window.goToStoryNode('${nodeName}')"
                            onmouseover="this.style.borderColor='var(--accent)';this.style.transform='translateY(-2px)';"
                            onmouseout="this.style.borderColor='transparent';this.style.transform='translateY(0)';"
                        >
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 4px;">第 ${index + 1} 章</div>
                                    <div style="font-size: 1.1rem; font-weight: 500;">${displayName}</div>
                                </div>
                                <div style="font-size: 1.5rem;">📖</div>
                            </div>
                        </div>
                    `;
                }).join('')
                : '<p style="color: var(--text-dim);">暂无已解锁的节点</p>';
            
            const currentProgressNode = storyNodes.find(n => n.name === world.currentStoryNode);
            const progressInfo = currentProgressNode ? `当前进度：${currentProgressNode.name}` : '刚开始故事';
            
            main.innerHTML = `
                <div style="max-width: 500px; margin: 0 auto;">
                    <h2 style="text-align: center; margin-bottom: 8px;">📖 选择章节</h2>
                    <p class="desc" style="text-align: center; margin-bottom: 24px;">${progressInfo}</p>
                    
                    ${storyNodesListHtml}
                    
                    <div style="margin-top: 24px; text-align: center;">
                        <button class="btn btn-secondary" onclick="showWorldEditModal()" style="font-size: 0.85rem;">⚙️ 管理节点</button>
                    </div>
                </div>
            `;
            return;
        }
        
        const storyNodesHtml = '';
        
        window._currentStoryNode = userSelectedNode || world.currentStoryNode || (storyNodes[0]?.name || null);
        
        const isMobile = window.innerWidth < 900;
        
        let mobileStatsHtml = '';
        if (isMobile && story && story.status === 'ongoing') {
            const lastScene = story.scenes[story.scenes.length - 1];
            const statChanges = lastScene?.statChanges || {};
            if (Object.keys(statChanges).length > 0) {
                const localStatLabels = {
                    health: '生命', charm: '魅力', intelligence: '智力', strength: '力量',
                    agility: '敏捷', stamina: '耐力',
                    arousal: '欲望', sexExperience: '经验', sexSkill: '技巧', sexSensitivity: '敏感',
                    affection: '好感', corruption: '堕落', shame: '羞耻'
                };
                
                mobileStatsHtml = `
                    <div class="stat-changes-mobile" style="margin-bottom: 16px; padding: 12px; background: var(--card); border-radius: 8px;">
                        <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 8px;">📈 本次变化</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${Object.entries(statChanges).map(([charName, changes]) => {
                                const charObj = chars.find(c => c.name === charName);
                                const dynamicAge = charObj && window.WorldTimePlugin ? window.WorldTimePlugin.getCharacterAge(charObj, world.id) : (charObj?.age || '');
                                const ageDisplay = dynamicAge ? `(${dynamicAge}岁)` : '';
                                return `
                                    <div style="flex: 1 1 auto; min-width: 120px; padding: 8px; background: var(--bg); border-radius: 6px;">
                                        <div style="font-weight: 600; font-size: 0.8rem; color: var(--accent); margin-bottom: 4px;">${charName} ${ageDisplay}</div>
                                        <div style="display: flex; flex-wrap: wrap; gap: 3px;">
                                            ${Object.entries(changes).map(([key, value]) => {
                                                const label = localStatLabels[key] || key;
                                                const displayValue = value > 0 ? '+' + value : value;
                                                const color = value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#6b7280';
                                                return '<span style="font-size: 0.65rem; padding: 2px 5px; background: var(--card-bg); border-radius: 3px; color: ' + color + ';">' + label + displayValue + '</span>';
                                            }).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        const showStartForm = !hasOngoingStory;
        
        main.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2>${hasOngoingStory ? '继续故事' : '开始故事'}</h2>
                    <p class="desc">${world.name}${hasOngoingStory ? ` · 第${story.round}轮` : ''}</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    ${userSelectedNode && !hasOngoingStory ? `<button class="btn btn-secondary" onclick="backToStoryNodes()" style="font-size: 0.8rem;">⬅️ 返回章节</button>` : ''}
                    ${hasOngoingStory ? `<button class="btn btn-secondary" onclick="showEndStoryModal()" style="font-size: 0.8rem;">🏁 结束故事</button>` : ''}
                </div>
            </div>
            
            ${storyNodesHtml}
            
            ${hasOngoingStory ? `
                <div class="story-reader" style="margin-bottom: 20px; max-height: 50vh; overflow-y: auto;">
                    ${(() => {
                        const scenesToShow = story.scenes;
                        return scenesToShow.map((s, i) => `
                        <div class="scene" style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border); ${s.choice ? 'border-left: 3px solid var(--accent); padding-left: 12px; margin-left: 12px;' : ''}">
                            ${i > 0 ? `<div style="font-size: 0.7rem; color: var(--text-dim); margin-bottom: 12px;">📜 第${i + 1}幕</div>` : ''}
                            ${s.choice ? `<div style="font-size: 0.75rem; color: var(--accent); margin-bottom: 8px;">👉 你选择了：${s.choice}</div>` : ''}
                            <p style="line-height: 1.8;">${s.content}</p>
                            ${s.choices && s.choices.length > 0 && i === scenesToShow.length - 1 ? `
                                <div class="choices" style="margin-top: 16px;">
                                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 8px;">请选择剧情走向：</div>
                                    ${s.choices.map((c, j) => `
                                        <button class="choice-btn" onclick="makeChoice('${c.replace(/'/g, "\\'")}')">${j + 1}. ${c}</button>
                                    `).join('')}
                                    <button class="choice-btn" onclick="showCustomChoiceInput()" style="background: var(--accent); color: var(--bg);">✏️ 自定义</button>
                                    <div id="customChoiceInput" style="display: none; margin-top: 12px;">
                                        <input type="text" id="customChoiceText" placeholder="输入你的选择..." style="flex: 1;" onkeypress="if(event.key==='Enter'){makeCustomChoice()}">
                                        <button class="btn" onclick="makeCustomChoice()">确定</button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        `).join('');
                    })()}
                </div>
                
                ${mobileStatsHtml}
                
                <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                    <button class="btn btn-secondary" onclick="makeChoice(null)">🤔 自由发展</button>
                    <button class="btn" onclick="showIntimateTriggerModal()" style="background: linear-gradient(135deg, #ff69b4, #ff1493); color: white;">💕 亲密互动</button>
                    <button class="btn btn-secondary" onclick="showCharacterAttributes()" title="查看角色属性">👤 角色</button>
                    <button class="btn btn-secondary" onclick="showStoryCharSelector()" title="选择参与角色">🎭 角色</button>
                    <button class="btn btn-secondary" onclick="getRecommendedChars()" title="根据剧情推荐角色">💡 推荐</button>
                    <label style="display: flex; align-items: center; gap: 4px; padding: 6px 10px; background: var(--accent); color: var(--bg); border-radius: 6px; cursor: pointer; font-size: 0.75rem;">
                        <input type="checkbox" id="simpleStoryModeContinue" style="width: 14px; height: 14px;" onchange="toggleSimpleStoryMode(this.checked)">
                        小故事
                    </label>
                    <button class="btn btn-secondary" onclick="restartStory()" style="margin-left: auto;">🔄 重新开始</button>
                </div>
                <div id="storyCharSelector" style="display: none; margin-top: 16px; padding: 12px; background: var(--card-bg); border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.85rem; color: var(--text-dim);">选择参与角色（可选）</span>
                        <button class="btn btn-secondary" onclick="getRecommendedChars()" style="padding: 4px 8px; font-size: 0.75rem;">💡 推荐角色</button>
                    </div>
                    <div id="recommendedChars" style="display: none; margin-bottom: 12px; padding: 8px; background: var(--accent); opacity: 0.9; border-radius: 6px;">
                        <div style="font-size: 0.75rem; color: var(--bg); margin-bottom: 4px;">推荐参与：</div>
                        <div id="recommendedCharsList" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${chars.map(c => `
                            <label style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--border); border-radius: 6px; cursor: pointer;">
                                <input type="checkbox" name="storyCharsContinue" value="${c.id}" ${story.characters?.some(sc => sc.id === c.id) ? 'checked' : ''}>
                                ${c.name}
                            </label>
                        `).join('')}
                    </div>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                        <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 8px;">🎯 角色占比设置</div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 0.75rem;">选中角色占比：</span>
                            <select id="charRatio" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 4px;">
                                <option value="100">100% (仅选中角色)</option>
                                <option value="90">90%</option>
                                <option value="80" selected>80%</option>
                                <option value="70">70%</option>
                                <option value="60">60%</option>
                                <option value="50">50% (均等)</option>
                            </select>
                        </div>
                        <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 6px;">
                            例如选择1、2，占比80%，则1、2、3、4、5都会出场，但1、2的剧情占比约80%
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <button class="btn btn-secondary" onclick="showWorldEditModal()" style="flex: 1;">🎮 世界编辑</button>
                        <button class="btn" onclick="startStory()" style="flex: 1;">▶️ 开始/继续故事</button>
                    </div>
                </div>
            ` : `
                <div class="card">
                    <div class="form-group">
                        <label>选择参与角色</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                            ${chars.map(c => `
                                <label style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: var(--border); border-radius: 6px; cursor: pointer;">
                                    <input type="checkbox" name="storyChars" value="${c.id}" ${c.role === '主角' || c.role === '女主' ? 'checked' : ''}>
                                    ${c.name}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div style="margin-top: 12px; padding: 12px; background: var(--card); border-radius: 6px;">
                        <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 8px;">🎯 角色占比设置</div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 0.75rem;">选中角色占比：</span>
                            <select id="charRatioStart" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 4px;">
                                <option value="100">100% (仅选中角色)</option>
                                <option value="90">90%</option>
                                <option value="80" selected>80%</option>
                                <option value="70">70%</option>
                                <option value="60">60%</option>
                                <option value="50">50% (均等)</option>
                            </select>
                        </div>
                        <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 6px;">
                            例如选择1、2，占比80%，则1、2、3、4、5都会出场，但1、2的剧情占比约80%
                        </div>
                    </div>
                    <div class="form-group">
                        <label>你扮演的角色</label>
                        <select id="playerCharSelect" onchange="onPlayerCharChange()">
                            <option value="">-- 不指定 --</option>
                            ${chars.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                            <option value="custom">+ 自定义</option>
                        </select>
                    </div>
                    <div class="form-group" id="customCharGroup" style="display: none;">
                        <label>或输入自定义角色名</label>
                        <input type="text" id="customCharName" placeholder="输入自定义角色名">
                    </div>
                    <div class="form-group">
                        <label>场景设定（可选）</label>
                        <input type="text" id="sceneInput" placeholder="例如：浪漫的烛光晚餐、雨中的相遇...">
                    </div>
                    <div style="margin-top: 12px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 12px; background: var(--card); border-radius: 6px;">
                            <input type="checkbox" id="simpleStoryModeStart" style="width: 16px; height: 16px;">
                            <span style="font-weight: 500;">⚡ 小故事模式</span>
                            <small style="color: var(--text-dim); font-size: 0.75rem; margin-left: 8px;">减少提示词，输出100字以内，加快速度</small>
                        </label>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 16px;">
                        <button class="btn btn-secondary" onclick="showWorldEditModal()" style="flex: 1;">🎮 世界编辑</button>
                        <button class="btn" onclick="startStory()" style="flex: 1;">▶️ 开始/继续故事</button>
                    </div>
                </div>
                
                <div style="margin-top: 24px; text-align: center;">
                    <a href="#" onclick="showPage('storage'); return false;" style="color: var(--text-dim); text-decoration: none; font-size: 0.85rem;">
                        📦 查看存储库 →
                    </a>
                </div>
            `}
        `;
        
        setTimeout(() => {
            const storyReader = document.querySelector('.story-reader');
            if (storyReader) {
                storyReader.scrollTop = storyReader.scrollHeight;
            }
        }, 100);
        
        const right = document.getElementById('rightPanel');
        if (right) {
            this.renderStoryRightPanel(right, world, story);
        }
    },

    renderStoryRightPanel(right, world, story) {
        right.style.overflowY = 'auto';
        right.style.maxHeight = '100%';
        
        const chars = Data.getCharacters(world.id);
        
        const DEFAULT_STATS = {
            health: 100, charm: 50, intelligence: 50,
            strength: 50, agility: 50, stamina: 50,
            arousal: 0, sexExperience: 0, sexSkill: 0, sexSensitivity: 50,
            affection: 50, corruption: 0, shame: 50
        };
        
        const statLabels = {
            health: '生命', charm: '魅力', intelligence: '智力', strength: '力量',
            agility: '敏捷', stamina: '耐力',
            arousal: '欲望', sexExperience: '经验', sexSkill: '技巧', sexSensitivity: '敏感',
            affection: '好感', corruption: '堕落', shame: '羞耻'
        };
        
        const storyChars = story && story.characters ? story.characters : chars.slice(0, 3);
        
        let timeDisplay = '';
        if (window.WorldTimePlugin && world) {
            const timeInfo = window.WorldTimePlugin.getDisplayTime(world.id);
            if (timeInfo.storyStartAge !== null) {
                timeDisplay = `
                    <div style="margin-bottom: 16px; padding: 12px; background: linear-gradient(135deg, var(--accent), #6366f1); border-radius: 8px; color: white;">
                        <div style="font-size: 0.75rem; opacity: 0.9;">⏰ 故事时间</div>
                        <div style="font-size: 1rem; font-weight: 600; margin-top: 4px;">${timeInfo.formatted}</div>
                        <div style="font-size: 0.8rem; margin-top: 4px; opacity: 0.9;">
                            主角 ${timeInfo.protagonistAge}岁
                            ${timeInfo.yearsPassed > 0 ? `<span style="opacity: 0.7;">(故事开始后${timeInfo.yearsPassed}年)</span>` : ''}
                        </div>
                    </div>
                `;
            }
        }
        
        let html = `
            ${timeDisplay}
        `;
        
        if (!story || story.status !== 'ongoing') {
            html += `<div class="empty" style="font-size: 0.8rem; padding: 12px;">开始故事后可查看属性变化</div>`;
        } else {
            html += `<h4 style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 12px;">📈 本次变化</h4>`;
            
            const lastScene = story.scenes[story.scenes.length - 1];
            const statChanges = lastScene?.statChanges || {};
            
            if (Object.keys(statChanges).length === 0) {
                html += `<div class="empty" style="font-size: 0.8rem; padding: 12px;">暂无数值变化</div>`;
            } else {
                html += Object.entries(statChanges).map(([charName, changes]) => {
                    const charObj = chars.find(c => c.name === charName);
                    const dynamicAge = charObj && window.WorldTimePlugin ? window.WorldTimePlugin.getCharacterAge(charObj, world.id) : (charObj?.age || '');
                    const ageDisplay = dynamicAge ? `(${dynamicAge}岁)` : '';
                    
                    return `
                    <div style="margin-bottom: 12px; padding: 10px; background: var(--card); border: 1px solid var(--border); border-radius: 8px;">
                        <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 6px; color: var(--accent);">${charName} ${ageDisplay}</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${Object.entries(changes).map(([key, value]) => {
                                const label = statLabels[key] || key;
                                const displayValue = value > 0 ? `+${value}` : value;
                                const color = value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#6b7280';
                                return `<span style="font-size: 0.7rem; padding: 2px 6px; background: var(--bg); border-radius: 4px; color: ${color};">${label}${displayValue}</span>`;
                            }).join('')}
                        </div>
                    </div>
                `}).join('');
            }
            

        }
        
        right.innerHTML = html;
    },

    renderSettings(main) {
        const world = Data.getCurrentWorld();
        const settings = Settings.get(world?.id);
        const opts = Settings.getContentOptions();
        const adultOpts = Settings.getAdultOptions();
        
        main.innerHTML = `
            <h2>设置</h2>
            <p class="desc">${world ? `当前世界：${world.name}` : '全局设置'}</p>
            
            <div class="setting-section">
                <h4>🤖 AI 配置</h4>
                <div class="card">
                    <div class="form-group">
                        <label>API 提供商</label>
                        <select id="apiProvider">
                            <option value="DeepSeek" ${settings.api?.provider === 'DeepSeek' ? 'selected' : ''}>DeepSeek</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>API Key</label>
                        <input type="password" id="apiKey" value="${ai.config.apiKey || ''}" placeholder="请输入API Key" autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label>Endpoint</label>
                        <input type="text" id="apiEndpoint" value="${ai.config.endpoint || ''}" placeholder="https://api.deepseek.com">
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn" onclick="saveApiSettings()">保存</button>
                        <button class="btn btn-secondary" id="testApiBtn" onclick="testApiConnection()">测试连接</button>
                    </div>
                    <div id="apiTestResult" class="api-test-result" style="display: none;"></div>
                </div>
            </div>
            
            <div class="setting-section">
                <h4>📝 内容设置</h4>
                <div class="card">
                    <div class="form-group">
                        <label>风格基调</label>
                        <select id="contentTone">
                            ${opts.tone.map(t => `<option value="${t}" ${settings.content?.tone === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>描写程度</label>
                        <select id="detailLevel">
                            ${opts.detailLevel.map(t => `<option value="${t}" ${settings.content?.detailLevel === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>文风</label>
                        <select id="outputStyle">
                            ${opts.style.map(t => `<option value="${t}" ${settings.output?.style === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn" onclick="saveContentSettings()">保存</button>
                </div>
            </div>
            
            <div class="setting-section">
                <h4>🔞 成人内容</h4>
                <div class="card">
                    <div class="slider-row">
                        <span>启用成人内容</span>
                        <label class="switch">
                            <input type="checkbox" id="adultEnabled" ${settings.adult?.enabled ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div id="adultSettings" style="margin-top: 16px; ${settings.adult?.enabled ? '' : 'display: none;'}">
                        <div class="form-group">
                            <label>亲密程度</label>
                            <input type="range" id="intimacyLevel" min="0" max="100" value="${settings.content?.intimacy || 50}" 
                                   oninput="document.getElementById('intimacyValue').textContent = this.value">
                            <span id="intimacyValue">${settings.content?.intimacy || 50}</span>
                        </div>
                    </div>
                    <button class="btn" onclick="saveAdultSettings()">保存</button>
                </div>
            </div>
            
            <div class="setting-section">
                <h4>⚙️ 自动保存</h4>
                <div class="card">
                    <div class="form-group">
                        <label>自动保存间隔</label>
                        <select id="autoSaveInterval" onchange="changeAutoSaveInterval(this.value)">
                            <option value="15000" ${Data.getAutoSaveInterval() === 15000 ? 'selected' : ''}>15秒</option>
                            <option value="30000" ${Data.getAutoSaveInterval() === 30000 ? 'selected' : ''}>30秒</option>
                            <option value="60000" ${Data.getAutoSaveInterval() === 60000 ? 'selected' : ''}>1分钟</option>
                            <option value="300000" ${Data.getAutoSaveInterval() === 300000 ? 'selected' : ''}>5分钟</option>
                            <option value="0" ${Data.getAutoSaveInterval() === 0 ? 'selected' : ''}>关闭</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('adultEnabled').addEventListener('change', function() {
            document.getElementById('adultSettings').style.display = this.checked ? 'block' : 'none';
        });
    },

    renderPlugins(main) {
        main.innerHTML = `
            <h2>插件中心</h2>
            <p class="desc">点击下方按钮进入相应的插件界面</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 30px;">
                <button class="plugin-btn" onclick="window.location.href='js/plugins/character-editor/index.html'">
                    <div class="plugin-icon">🧩</div>
                    <div class="plugin-name">角色插件</div>
                    <div class="plugin-desc">创建和编辑角色</div>
                </button>
                
                <button class="plugin-btn" onclick="window.location.href='js/plugins/inventory/index.html'">
                    <div class="plugin-icon">🎒</div>
                    <div class="plugin-name">物品管理</div>
                    <div class="plugin-desc">管理角色物品</div>
                </button>
                
                <button class="plugin-btn" onclick="window.location.href='js/plugins/shop/index.html'">
                    <div class="plugin-icon">🏪</div>
                    <div class="plugin-name">商店</div>
                    <div class="plugin-desc">购买物品和管理金钱</div>
                </button>
                
                <button class="plugin-btn" onclick="window.location.href='js/plugins/achievement/index.html'">
                    <div class="plugin-icon">🏆</div>
                    <div class="plugin-name">成就系统</div>
                    <div class="plugin-desc">创建和跟踪成就</div>
                </button>
                
                <button class="plugin-btn" onclick="window.location.href='js/plugins/time-plugin/index.html'">
                    <div class="plugin-icon">⏰</div>
                    <div class="plugin-name">时间插件</div>
                    <div class="plugin-desc">故事时间与角色年龄管理</div>
                </button>
                
                <button class="plugin-btn" onclick="window.location.href='js/plugins/adult-tags/index.html'">
                    <div class="plugin-icon">🏷️</div>
                    <div class="plugin-name">成人标签</div>
                    <div class="plugin-desc">管理兴奋值、尺度和标签库</div>
                </button>
                
                <button class="plugin-btn" onclick="window.location.href='js/plugins/adult-library/index.html'">
                    <div class="plugin-icon">🎀</div>
                    <div class="plugin-name">色色库</div>
                    <div class="plugin-desc">管理亲密互动插件</div>
                </button>
            </div>
        `;
    },

    showCharInfo(charId) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        const char = Data.getCharacter(world.id, charId);
        if (!char) return;
        
        const p = char.profile || {};
        const a = char.adultProfile || {};
        const stats = char.stats || {};
        
        let infoHtml = `
            <div class="card">
                <h3>${char.name}</h3>
                <div class="char-info">
                    <p><strong>性别：</strong>${char.gender}</p>
                    <p><strong>角色定位：</strong>${char.role}</p>
                    <p><strong>年龄：</strong>${(() => {
                        const world = Data.getCurrentWorld();
                        const dynamicAge = world && window.WorldTimePlugin ? window.WorldTimePlugin.getCharacterAge(char, world.id) : char.age;
                        return dynamicAge || char.age;
                    })()}岁</p>
                    ${p.race ? `<p><strong>种族：</strong>${p.race}</p>` : ''}
                    ${p.occupation ? `<p><strong>职业：</strong>${p.occupation}</p>` : ''}
                    ${p.height ? `<p><strong>身高：</strong>${p.height}</p>` : ''}
                    ${p.appearance ? `<p><strong>外貌：</strong>${p.appearance}</p>` : ''}
                    ${p.personality ? `<p><strong>性格：</strong>${p.personality}</p>` : ''}
                    ${p.hobby ? `<p><strong>爱好：</strong>${p.hobby}</p>` : ''}
                    ${p.favorite ? `<p><strong>喜欢：</strong>${p.favorite}</p>` : ''}
                    ${p.dislike ? `<p><strong>讨厌：</strong>${p.dislike}</p>` : ''}
                    ${p.backstory ? `<p><strong>背景：</strong>${p.backstory}</p>` : ''}
                    ${p.catchphrase ? `<p><strong>口头禅：</strong>${p.catchphrase}</p>` : ''}
                </div>
            </div>
        `;
        
        if (Object.keys(stats).length > 0) {
            const world = Data.getCurrentWorld();
            let excitementValue = 0;
            if (world && window.AdultTagsPlugin) {
                excitementValue = window.AdultTagsPlugin.getExcitement(world.id, char.id) || 0;
            }
            
            infoHtml += `
                <div class="card" style="margin-top: 16px;">
                    <h4>属性状态</h4>
                    <div class="char-info">
                        <p><strong>生命：</strong>${stats.health || 0} | <strong>魅力：</strong>${stats.charm || 0} | <strong>智力：</strong>${stats.intelligence || 0}</p>
                        <p><strong>力量：</strong>${stats.strength || 0} | <strong>敏捷：</strong>${stats.agility || 0} | <strong>耐力：</strong>${stats.stamina || 0}</p>
                        <p><strong>欲望：</strong>${stats.arousal || 0} 
                            <button onclick="window.adjustExcitement('${char.id}', 15)" style="margin-left:8px;padding:2px 8px;cursor:pointer;">+15</button>
                            <button onclick="window.adjustExcitement('${char.id}', -15)" style="margin-left:4px;padding:2px 8px;cursor:pointer;">-15</button>
                            <button onclick="window.adjustExcitement('${char.id}', 0)" style="margin-left:4px;padding:2px 8px;cursor:pointer;">重置</button>
                        </p>
                        <p><strong>经验：</strong>${stats.sexExperience || 0} | <strong>技巧：</strong>${stats.sexSkill || 0} | <strong>敏感：</strong>${stats.sexSensitivity || 0}</p>
                        <p><strong>好感：</strong>${stats.affection || 0} | <strong>堕落：</strong>${stats.corruption || 0} | <strong>羞耻：</strong>${stats.shame || 0}</p>
                    </div>
                </div>
            `;
        }
        
        if (a && Object.keys(a).length > 0 && a.sexuality) {
            infoHtml += `
                <div class="card" style="margin-top: 16px; border-left: 3px solid #f43f5e;">
                    <h4>色色设定</h4>
                    <div class="char-info">
                        ${a.sexuality ? `<p><strong>性取向：</strong>${a.sexuality}</p>` : ''}
                    </div>
                </div>
            `;
        }
        
        document.getElementById('charInfoContainer').innerHTML = infoHtml;
    }
};

window.adjustExcitement = function(charId, amount) {
    const world = Data.getCurrentWorld();
    if (!world || !window.AdultTagsPlugin) {
        alert('无法调整兴奋值');
        return;
    }
    const current = window.AdultTagsPlugin.getExcitement(world.id, charId);
    const newValue = Math.max(0, Math.min(100, current + amount));
    window.AdultTagsPlugin.setExcitement(world.id, charId, newValue);
    console.log(`[兴奋值] 调整为 ${newValue}`);
    
    if (window.showCharInfo) {
        const chars = Data.getCharacters(world.id);
        const char = chars.find(c => c.id === charId);
        if (char) {
            window.showCharInfo(char);
        }
    }
};

Pages.showCharInfo = Pages.showCharInfo.bind(Pages);
window.showCharInfo = Pages.showCharInfo;
window.Pages = Pages;

window.saveApiSettings = async function() {
    const apiKey = document.getElementById('apiKey')?.value;
    const apiEndpoint = document.getElementById('apiEndpoint')?.value;
    
    if (!apiKey) {
        alert('请输入 API Key');
        return;
    }
    
    ai.saveConfig({ apiKey, endpoint: apiEndpoint });
    
    const testBtn = document.getElementById('testApiBtn');
    const resultDiv = document.getElementById('apiTestResult');
    
    if (testBtn) {
        testBtn.disabled = true;
        testBtn.textContent = '测试中...';
    }
    
    try {
        const result = await ai.testConnection();
        
        if (resultDiv) {
            if (result.success) {
                resultDiv.className = 'api-test-result success';
                resultDiv.textContent = result.message;
            } else {
                resultDiv.className = 'api-test-result error';
                resultDiv.textContent = result.error;
            }
            resultDiv.style.display = 'block';
        }
        
        if (result.success) {
            alert('API设置已保存并测试成功！');
        }
    } catch (err) {
        if (resultDiv) {
            resultDiv.className = 'api-test-result error';
            resultDiv.textContent = '测试失败: ' + err.message;
            resultDiv.style.display = 'block';
        }
    } finally {
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.textContent = '测试连接';
        }
    }
};

window.testApiConnection = async function() {
    const apiKey = document.getElementById('apiKey')?.value;
    const apiEndpoint = document.getElementById('apiEndpoint')?.value;
    const testBtn = document.getElementById('testApiBtn');
    const resultDiv = document.getElementById('apiTestResult');
    
    if (!apiKey) {
        alert('请先输入 API Key');
        return;
    }
    
    ai.saveConfig({ apiKey, endpoint: apiEndpoint });
    
    if (testBtn) {
        testBtn.disabled = true;
        testBtn.textContent = '测试中...';
    }
    
    try {
        const result = await ai.testConnection();
        
        if (resultDiv) {
            if (result.success) {
                resultDiv.className = 'api-test-result success';
                resultDiv.textContent = result.message;
            } else {
                resultDiv.className = 'api-test-result error';
                resultDiv.textContent = result.error;
            }
            resultDiv.style.display = 'block';
        }
    } catch (err) {
        if (resultDiv) {
            resultDiv.className = 'api-test-result error';
            resultDiv.textContent = '测试失败: ' + err.message;
            resultDiv.style.display = 'block';
        }
    } finally {
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.textContent = '测试连接';
        }
    }
};

window.saveContentSettings = function() {
    const world = Data.getCurrentWorld();
    const contentTone = document.getElementById('contentTone')?.value;
    const detailLevel = document.getElementById('detailLevel')?.value;
    const outputStyle = document.getElementById('outputStyle')?.value;
    
    const currentSettings = Settings.get(world?.id);
    const newSettings = { ...currentSettings, content: { ...currentSettings.content, tone: contentTone, detailLevel, outputStyle: outputStyle } };
    Settings.save(world?.id, newSettings);
    alert('内容设置已保存');
};

window.saveAdultSettings = function() {
    const world = Data.getCurrentWorld();
    const adultEnabled = document.getElementById('adultEnabled')?.checked;
    const intimacyLevel = document.getElementById('intimacyLevel')?.value;
    
    const currentSettings = Settings.get(world?.id);
    const newSettings = { ...currentSettings, adult: { ...currentSettings.adult, enabled: adultEnabled }, content: { ...currentSettings.content, intimacy: parseInt(intimacyLevel) } };
    Settings.save(world?.id, newSettings);
    alert('成人设置已保存');
};

window.changeAutoSaveInterval = function(value) {
    Data.setAutoSaveInterval(parseInt(value));
};

window.toggleSimpleStoryMode = function(checked) {
    window.simpleStoryMode = checked;
    console.log('[小故事模式] 已' + (checked ? '启用' : '禁用'));
};

window.getSimpleStoryMode = function() {
    const startCheckbox = document.getElementById('simpleStoryModeStart');
    const continueCheckbox = document.getElementById('simpleStoryModeContinue');
    return (startCheckbox && startCheckbox.checked) || (continueCheckbox && continueCheckbox.checked);
};

window.selectStoryNode = function(nodeName) {
    const world = Data.getCurrentWorld();
    if (!world || !world.storyNodes) return;
    
    const node = world.storyNodes.find(n => n.name === nodeName);
    if (!node || !node.unlocked) {
        alert('该剧情节点尚未解锁');
        return;
    }
    
    window._userSelectedStoryNode = nodeName;
    
    const main = document.getElementById('mainContent');
    if (main) {
        Pages.renderStory(main);
    }
};

window.goToStoryNode = function(nodeName) {
    window._userSelectedStoryNode = nodeName;
    var main = document.getElementById('mainContent');
    if (main) {
        Pages.renderStory(main);
    }
};

window.backToStoryNodes = function() {
    window._userSelectedStoryNode = null;
    
    var main = document.getElementById('mainContent');
    if (main) {
        Pages.renderStory(main);
    }
};

window.unlockNextStoryNode = function() {
    const world = Data.getCurrentWorld();
    if (!world || !world.storyNodes) return;
    
    const nodes = world.storyNodes;
    const currentIndex = nodes.findIndex(n => n.name === world.currentStoryNode);
    
    if (currentIndex >= 0 && currentIndex < nodes.length - 1) {
        const nextNode = nodes[currentIndex + 1];
        if (!nextNode.unlocked) {
            nextNode.unlocked = true;
            Data.updateWorld(world.id, {
                storyNodes: nodes
            });
            console.log(`[剧情节点] 已解锁：${nextNode.name}`);
            
            const main = document.getElementById('mainContent');
            if (main) {
                Pages.renderStory(main);
            }
        }
    }
};
