(function() {
    let currentPage = 'home';
    
    const mobileNavItems = [
        { page: 'home', icon: '🏠', label: '首页' },
        { page: 'worlds', icon: '🌍', label: '世界' },
        { page: 'characters', icon: '👤', label: '角色' },
        { page: 'story', icon: '📖', label: '故事' },
        { page: 'story-config', icon: '📝', label: 'AI设置' },
        { page: 'storage', icon: '📦', label: '存储库' },
        { page: 'settings', icon: '⚙️', label: '设置' },
        { page: 'plugins', icon: '🔌', label: '插件' }
    ];
    
    function init() {
        setupNav();
        setupMobileNav();
        showPage('home');
    }

    function setupMobileNav() {
        const mobileNav = document.getElementById('mobileNav');
        if (!mobileNav) return;
        
        const navHtml = mobileNavItems.map(item => `
            <button class="mobile-nav-btn ${currentPage === item.page ? 'active' : ''}" data-page="${item.page}">
                <span class="icon">${item.icon}</span>
                <span class="label">${item.label}</span>
            </button>
        `).join('');
        
        mobileNav.innerHTML = navHtml;
        
        mobileNav.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                showPage(page);
                updateMobileNavActive(page);
            });
        });
    }
    
    function updateMobileNavActive(page) {
        const mobileNav = document.getElementById('mobileNav');
        if (!mobileNav) return;
        
        mobileNav.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
    }

    async function loadHentaiPlugin() {
        return new Promise((resolve) => {
            const scripts = [
                'js/plugins/adult-library/hentai-plugin-hub.js',
                'js/plugins/adult-library/hentai-user-content.js',
                'js/plugins/adult-library/hentai-integration.js'
            ];
            
            let loadedCount = 0;
            
            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loadedCount++;
                    if (loadedCount === scripts.length) {
                        if (typeof HentaiUserContent !== 'undefined') {
                            HentaiUserContent.init().then(() => {
                                console.log('色色插件已加载');
                                resolve();
                            });
                        } else {
                            console.log('色色插件已加载');
                            resolve();
                        }
                    }
                };
                script.onerror = () => {
                    console.error('加载失败:', src);
                    loadedCount++;
                    if (loadedCount === scripts.length) {
                        resolve();
                    }
                };
                document.head.appendChild(script);
            });
        });
    }

    window.loadHentaiPlugin = loadHentaiPlugin;

    function setupNav() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                showPage(btn.dataset.page);
            });
        });
    }

    function showPage(page) {
        currentPage = page;
        
        const desktopNavBtns = document.querySelectorAll('.nav-btn');
        if (desktopNavBtns.length > 0) {
            desktopNavBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.page === page);
            });
        }
        
        updateMobileNavActive(page);
        
        const main = document.getElementById('mainContent');
        const right = document.getElementById('rightPanel');
        
        switch(page) {
            case 'home': renderHome(main, right); break;
            case 'worlds': renderWorlds(main); break;
            case 'characters': renderCharacters(main); break;
            case 'story': renderStory(main); break;
            case 'story-config': renderStoryConfig(main); break;
            case 'storage': renderStorage(main); break;
            case 'settings': renderSettings(main); break;
            case 'plugins': renderPlugins(main); break;
        }
    }
    
    function renderStoryConfig(main) {
        if (typeof View !== 'undefined' && View.render) {
            main.innerHTML = View.render('story-config.main');
        } else {
            main.innerHTML = '<div class="empty">AI设置插件未加载</div>';
        }
    }

    function renderHome(main, right) {
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
                <div class="card" onclick="showPage('settings')">
                    <div class="title">⚙️ 设置</div>
                    <div class="meta">配置AI和内容偏好</div>
                </div>
            </div>
        `;
        
        if (world) {
            const chars = Data.getCharacters(world.id);
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
        } else {
            right.innerHTML = '<div class="empty">请先创建世界</div>';
        }
    }

    function renderWorlds(main) {
        const worlds = Data.getWorlds();
        
        main.innerHTML = `
            <h2>世界管理</h2>
            <p class="desc">创建和管理你的故事世界</p>
            
            <button class="btn" onclick="showCreateWorld()" style="margin-bottom: 20px;">+ 创建世界</button>
            
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
    }

    function renderCharacters(main) {
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
    }
    
    window.showCharInfo = function(charId) {
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
                    <p><strong>年龄：</strong>${char.age}岁</p>
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
            infoHtml += `
                <div class="card" style="margin-top: 16px;">
                    <h4>属性状态</h4>
                    <div class="char-info">
                        <p><strong>生命：</strong>${stats.health || 0} | <strong>体力：</strong>${stats.energy || 0} | <strong>魅力：</strong>${stats.charm || 0}</p>
                        <p><strong>智力：</strong>${stats.intelligence || 0} | <strong>力量：</strong>${stats.strength || 0} | <strong>敏捷：</strong>${stats.agility || 0}</p>
                        <p><strong>欲望：</strong>${stats.sexArousal || 0} | <strong>性欲：</strong>${stats.sexLibido || 0} | <strong>敏感：</strong>${stats.sexSensitivity || 0}</p>
                        <p><strong>好感：</strong>${stats.affection || 0} | <strong>信任：</strong>${stats.trust || 0} | <strong>亲密：</strong>${stats.intimacy || 0}</p>
                    </div>
                </div>
            `;
        }
        
        if (a && Object.keys(a).length > 0) {
            infoHtml += `
                <div class="card" style="margin-top: 16px; border-left: 3px solid #f43f5e;">
                    <h4>色色设定</h4>
                    <div class="char-info">
                        ${a.sexuality ? `<p><strong>性取向：</strong>${a.sexuality}</p>` : ''}
                        ${a.experienceLevel ? `<p><strong>经验等级：</strong>${a.experienceLevel}</p>` : ''}
                        ${a.bodyType ? `<p><strong>身材：</strong>${a.bodyType}</p>` : ''}
                        ${a.breastSize ? `<p><strong>胸部：</strong>${a.breastSize}</p>` : ''}
                        ${a.fetish ? `<p><strong>性癖好：</strong>${Array.isArray(a.fetish) ? a.fetish.join('、') : a.fetish}</p>` : ''}
                        ${a.sensitiveParts ? `<p><strong>敏感部位：</strong>${Array.isArray(a.sensitiveParts) ? a.sensitiveParts.join('、') : a.sensitiveParts}</p>` : ''}
                        ${a.limits ? `<p><strong>底线：</strong>${Array.isArray(a.limits) ? a.limits.join('、') : a.limits}</p>` : ''}
                    </div>
                </div>
            `;
        }
        
        const infoContainer = document.getElementById('charInfoContainer');
        if (infoContainer) {
            infoContainer.innerHTML = infoHtml;
        }
    };

    function renderStory(main) {
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
        
        main.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2>${story && story.status === 'ongoing' ? '继续故事' : '开始故事'}</h2>
                    <p class="desc">${world.name}${story && story.status === 'ongoing' ? ` · 第${story.round}轮` : ''}</p>
                </div>
                ${story && story.status === 'ongoing' ? `
                    <button class="btn btn-secondary" onclick="showEndStoryModal()" style="font-size: 0.8rem;">🏁 结束故事</button>
                ` : ''}
            </div>
            
            ${story && story.status === 'ongoing' ? `
                <div class="story-reader" style="margin-bottom: 20px; max-height: 50vh; overflow-y: auto;">
                    ${story.scenes.map((s, i) => `
                        <div class="scene" style="${s.choice ? 'border-left: 3px solid var(--accent); padding-left: 12px; margin-left: 12px;' : ''}">
                            ${s.choice ? `<div style="font-size: 0.75rem; color: var(--accent); margin-bottom: 8px;">👉 你选择了：${s.choice}</div>` : ''}
                            <p style="line-height: 1.8;">${s.content}</p>
                            ${s.choices && s.choices.length > 0 && i === story.scenes.length - 1 ? `
                                <div class="choices" style="margin-top: 16px;">
                                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 8px;">请选择剧情走向：</div>
                                    ${s.choices.map((c, j) => `
                                        <button class="choice-btn" onclick="makeChoice('${c.replace(/'/g, "\\'")}')">${j + 1}. ${c}</button>
                                    `).join('')}
                                    <button class="choice-btn" onclick="showCustomChoiceInput()" style="background: var(--accent); color: var(--bg);">✏️ 自定义</button>
                                    <div id="customChoiceInput" style="display: none; margin-top: 12px;">
                                        <input type="text" id="customChoiceText" placeholder="输入你的选择..." style="flex: 1;">
                                        <button class="btn" onclick="makeCustomChoice()">确定</button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                
                ${(function() {
                    const lastScene = story.scenes[story.scenes.length - 1];
                    const statChanges = lastScene?.statChanges || {};
                    if (Object.keys(statChanges).length === 0) return '';
                    
                    const allChars = Data.getCharacters(world.id);
                    const worldId = world.id;
                    
                    const localStatLabels = {
                        health: '生命', energy: '体力', charm: '魅力', intelligence: '智力', strength: '力量',
                        agility: '敏捷', stamina: '耐力',
                        sexArousal: '欲望', sexExperience: '经验', sexSkill: '技巧', sexLibido: '性欲', sexSensitivity: '敏感',
                        affection: '好感', trust: '信任', intimacy: '亲密', corruption: '堕落', shame: '羞耻'
                    };
                    
                    return `
                        <div class="stat-changes-mobile" style="margin-bottom: 16px; padding: 12px; background: var(--card); border-radius: 8px;">
                            <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 8px;">📈 本次变化</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${Object.entries(statChanges).map(([charName, changes]) => {
                                    const charObj = allChars.find(c => c.name === charName);
                                    const dynamicAge = charObj && window.WorldTimePlugin ? window.WorldTimePlugin.getCharacterAge(charObj, worldId) : (charObj?.age || '');
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
                })()}
                
                <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                    <button class="btn btn-secondary" onclick="makeChoice(null)">🤔 自由发展</button>
                    <button class="btn" onclick="showIntimateTriggerModal()" style="background: linear-gradient(135deg, #ff69b4, #ff1493); color: white;">💕 亲密互动</button>
                    <button class="btn btn-secondary" onclick="showCharacterAttributes()" title="查看角色属性">👤 角色</button>
                    <button class="btn btn-secondary" onclick="showStoryCharSelector()" title="选择参与角色">🎭 角色</button>
                    <button class="btn btn-secondary" onclick="getRecommendedChars()" title="根据剧情推荐角色">💡 推荐</button>
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
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <button class="btn" onclick="refreshChoicesWithNewChars()" style="flex: 1;">🔄 刷新选项</button>
                        <button class="btn btn-secondary" onclick="continueStoryWithNewChars()" style="flex: 1;">▶️ 继续剧情</button>
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
                    <div class="card" id="timeConfigCard" style="background: var(--border); margin-top: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="font-weight: 500;">⏰ 故事时间设置</span>
                            <button type="button" class="btn btn-secondary" onclick="toggleTimeConfig()" style="padding: 4px 8px; font-size: 0.75rem;">展开/收起</button>
                        </div>
                        <div id="timeConfigContent" style="display: none;">
                            <div class="form-group">
                                <label>主角开始年龄</label>
                                <select id="protagonistStartAge" onchange="autoCalcAgeRelations()">
                                    ${[...Array(19)].map((_, i) => `<option value="${i + 1}" ${i + 1 === 18 ? 'selected' : ''}>${i + 1}岁</option>`).join('')}
                                </select>
                                <small style="color: var(--text-dim); font-size: 0.75rem;">选择故事从主角几岁时开始</small>
                            </div>
                            <div class="form-group">
                                <label>故事开始年份</label>
                                <input type="number" id="storyStartYear" value="2024" min="1900" max="2100">
                                <small style="color: var(--text-dim); font-size: 0.75rem;">虚拟世界的起始年份</small>
                            </div>
                            <div class="form-group">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <label style="margin: 0;">其他角色年龄关系</label>
                                    <button type="button" class="btn btn-secondary" onclick="autoCalcAgeRelations()" style="padding: 4px 8px; font-size: 0.7rem;">🔄 自动计算</button>
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 8px;">根据主角年龄自动计算年龄差（点击"自动计算"按钮）</div>
                                <div id="charAgeRelations" style="max-height: 200px; overflow-y: auto;">
                                    ${(() => {
                                        const protagonist = chars.find(c => c.role === '主角' || c.role === '女主');
                                        const defaultAge = protagonist?.age || 18;
                                        return chars.filter(c => c.role !== '主角' && c.role !== '女主').map(c => {
                                            const autoDiff = c.age - defaultAge;
                                            return `
                                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 6px; background: var(--card-bg); border-radius: 4px;">
                                                    <span style="flex: 1; font-size: 0.85rem;">${c.name} (基础: ${c.age}岁)</span>
                                                    <input type="number" id="ageRelation_${c.id}" value="${autoDiff}" style="width: 60px;" placeholder="差值">
                                                    <span style="font-size: 0.75rem; color: var(--text-dim);">岁</span>
                                                </div>
                                            `;
                                        }).join('');
                                    })()}
                                    ${chars.filter(c => c.role !== '主角' && c.role !== '女主').length === 0 ? '<div style="font-size: 0.8rem; color: var(--text-dim);">暂无其他角色</div>' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="btn" onclick="startStory()">🎬 开始故事</button>
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
            renderStoryRightPanel(right, world, story);
        }
    }
    
    function renderStoryRightPanel(right, world, story) {
        right.style.overflowY = 'auto';
        right.style.maxHeight = '100%';
        
        const chars = Data.getCharacters(world.id);
        
        const DEFAULT_STATS = {
            health: 100, energy: 100, charm: 50, intelligence: 50,
            strength: 50, agility: 50, stamina: 50,
            sexArousal: 0, sexExperience: 0, sexSkill: 0, sexLibido: 50, sexSensitivity: 50,
            affection: 50, trust: 50, intimacy: 0, corruption: 0, shame: 50
        };
        
        const statLabels = {
            health: '生命', energy: '体力', charm: '魅力', intelligence: '智力', strength: '力量',
            agility: '敏捷', stamina: '耐力',
            sexArousal: '欲望', sexExperience: '经验', sexSkill: '技巧', sexLibido: '性欲', sexSensitivity: '敏感',
            affection: '好感', trust: '信任', intimacy: '亲密', corruption: '堕落', shame: '羞耻'
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
            <h4 style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 12px;">📈 本次变化</h4>
        `;
        
        if (!story || story.status !== 'ongoing') {
            html += `<div class="empty" style="font-size: 0.8rem; padding: 12px;">开始故事后可查看属性变化</div>`;
        } else {
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
    }
    
    window.showCharStatsDetail = function(charId) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const char = Data.getCharacter(world.id, charId);
        if (!char) return;
        
        const DEFAULT_STATS = {
            health: 100, energy: 100, charm: 50, intelligence: 50,
            strength: 50, agility: 50, stamina: 50,
            sexArousal: 0, sexExperience: 0, sexSkill: 0, sexLibido: 50, sexSensitivity: 50,
            affection: 50, trust: 50, intimacy: 0, corruption: 0, shame: 50
        };
        
        const stats = { ...DEFAULT_STATS, ...char.stats };
        
        const statLabels = {
            health: '生命', energy: '体力', charm: '魅力', intelligence: '智力', strength: '力量',
            agility: '敏捷', stamina: '耐力',
            sexArousal: '欲望', sexExperience: '经验', sexSkill: '技巧', sexLibido: '性欲', sexSensitivity: '敏感',
            affection: '好感', trust: '信任', intimacy: '亲密', corruption: '堕落', shame: '羞耻'
        };
        
        const statGroups = {
            '基础属性': ['health', 'energy', 'charm', 'intelligence', 'strength', 'agility', 'stamina'],
            '状态属性': ['affection', 'trust', 'intimacy', 'corruption', 'shame'],
            '色色属性': ['sexArousal', 'sexExperience', 'sexSkill', 'sexLibido', 'sexSensitivity']
        };
        
        let html = `<div style="padding: 16px;">`;
        html += `<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">`;
        html += `<div class="avatar" style="width: 48px; height: 48px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">${char.name[0]}</div>`;
        html += `<div><div style="font-weight: 600; font-size: 1.1rem;">${char.name}</div><div style="font-size: 0.8rem; color: var(--text-dim);">角色属性</div></div>`;
        html += `</div>`;
        
        Object.entries(statGroups).forEach(([groupName, statsList]) => {
            const isAdult = groupName === '色色属性';
            html += `<div style="margin-bottom: 16px;"><div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; ${isAdult ? 'color: #ff69b4;' : ''}">${groupName}</div>`;
            html += `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">`;
            statsList.forEach(stat => {
                const value = stats[stat] || 0;
                const label = statLabels[stat] || stat;
                const color = value >= 80 ? '#22c55e' : value >= 50 ? '#6366f1' : value >= 20 ? '#f59e0b' : '#ef4444';
                html += `
                    <div style="padding: 8px; background: var(--bg); border-radius: 6px;">
                        <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 4px;">${label}</div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${Math.min(100, value)}%; height: 100%; background: ${color};"></div>
                            </div>
                            <span style="color: ${color}; font-weight: 600; font-size: 0.85rem; min-width: 24px; text-align: right;">${value}</span>
                        </div>
                    </div>
                `;
            });
            html += `</div></div>`;
        });
        
        html += `<button class="btn btn-secondary" onclick="closeModal()" style="width: 100%;">关闭</button></div>`;
        
        document.getElementById('modalTitle').textContent = `${char.name} - 属性详情`;
        document.getElementById('modalBody').innerHTML = html;
        document.getElementById('modal').classList.add('active');
    };

    function renderStorage(main) {
        const world = Data.getCurrentWorld();
        
        if (!world) {
            main.innerHTML = `<h2>📦 存储库</h2><div class="empty">请先选择一个世界</div>`;
            return;
        }
        
        const story = Story.load(world.id);
        const archives = Story.getArchives(world.id);
        const level2 = Story.getLevel2Archives(world.id);
        const level3 = Story.getLevel3Archives(world.id);
        
        const hasActiveStory = story && story.status === 'ongoing';
        
        main.innerHTML = `
            <h2>📦 存储库</h2>
            <p class="desc">当前世界：${world.name}</p>
            
            <div style="margin-bottom: 24px;">
                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <button class="btn btn-secondary" onclick="document.getElementById('importArchiveInput').click()" style="font-size: 0.85rem;">📥 导入故事</button>
                    <input type="file" id="importArchiveInput" accept=".json" style="display: none;" onchange="importArchiveFile(event)">
                </div>
            </div>
            
            ${hasActiveStory ? `
                <div class="setting-section">
                    <h4>🔥 活跃剧情 (进行中)</h4>
                    <div class="card" style="margin-bottom: 12px; border-left: 3px solid #ff6b6b;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <div style="font-weight: 500;">${story.title || '未命名故事'}</div>
                                <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">
                                    ${Array.isArray(story.characters) ? story.characters.map(c => c.name).join('、') : story.characters || '未知角色'} · 第${story.round}轮 · ${story.scenes.length}幕
                                </div>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button class="btn" onclick="showPage('story')" style="font-size: 0.75rem; padding: 6px 12px;">▶ 继续</button>
                            </div>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="setting-section">
                    <h4>🔥 活跃剧情</h4>
                    <div class="empty">暂无进行中的故事</div>
                </div>
            `}
            
            <div class="setting-section">
                <h4>📚 一级存储 (${archives.length})</h4>
                ${archives.length === 0 ? '<div class="empty">暂无已存档的故事</div>' : ''}
                ${archives.map(a => `
                    <div class="card" style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <div style="font-weight: 500;">${a.title}</div>
                                <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">
                                    ${Array.isArray(a.characters) ? a.characters.map(c => c.name).join('、') : a.characters || '未知角色'} · ${a.sceneCount}幕
                                </div>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button class="btn btn-secondary" onclick="resumeArchive('${a.id}')" style="font-size: 0.75rem; padding: 6px 12px;">▶ 继续</button>
                                <button class="btn btn-secondary" onclick="exportArchive('${a.id}')" style="font-size: 0.75rem; padding: 6px 10px;">📤</button>
                                <button class="btn btn-secondary" onclick="deleteArchive('${a.id}')" style="font-size: 0.75rem; padding: 6px 10px;">🗑️</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${level2.length > 0 ? `
                <div class="setting-section">
                    <h4>📦 二级存储 - 前10幕摘要 (${level2.length})</h4>
                    ${level2.map(a => `
                        <div class="card" style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 500;">${a.title}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">
                                        ${a.sceneCount}幕 · ${new Date(a.startTime).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style="display: flex; gap: 6px;">
                                    <button class="btn btn-secondary" onclick="viewLevel2Story('${a.id}')" style="font-size: 0.75rem; padding: 6px 12px;">查看</button>
                                    <button class="btn btn-secondary" onclick="exportArchive('${a.id}')" style="font-size: 0.75rem; padding: 6px 10px;">📤</button>
                                    <button class="btn btn-secondary" onclick="deleteLevel2Story('${a.id}')" style="font-size: 0.75rem; padding: 6px 10px;">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="setting-section">
                    <h4>📦 二级存储 - 前10幕摘要 (0)</h4>
                    <div class="empty">暂无二级存储内容</div>
                </div>
            `}
            
            ${level3.length > 0 ? `
                <div class="setting-section">
                    <h4>📚 三级存储 - 故事合集 (${level3.length})</h4>
                    ${level3.map(a => `
                        <div class="card" style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 500;">${a.title}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">
                                        ${a.stories ? a.stories.length + '个故事' : ''} · ${new Date(a.archivedAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style="display: flex; gap: 6px;">
                                    <button class="btn btn-secondary" onclick="viewLevel3Story('${a.id}')" style="font-size: 0.75rem; padding: 6px 12px;">查看</button>
                                    <button class="btn btn-secondary" onclick="exportArchive('${a.id}')" style="font-size: 0.75rem; padding: 6px 10px;">📤</button>
                                    <button class="btn btn-secondary" onclick="deleteLevel3Story('${a.id}')" style="font-size: 0.75rem; padding: 6px 10px;">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="setting-section">
                    <h4>📚 三级存储 - 故事合集 (0)</h4>
                    <div class="empty">暂无三级存储内容</div>
                </div>
            `}
        `;
    }

    function renderSettings(main) {
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
                        <input type="password" id="apiKey" value="${ai.config.apiKey || ''}" placeholder="请输入API Key">
                    </div>
                    <div class="form-group">
                        <label>Endpoint</label>
                        <input type="text" id="apiEndpoint" value="${ai.config.endpoint || ''}" placeholder="https://api.deepseek.com">
                    </div>
                    <button class="btn" onclick="saveApiSettings()">保存</button>
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
                    <div class="form-group" style="margin-top: 16px;">
                        <label>亲密程度: <span id="intimacyVal">${settings.adult?.intensity || 30}</span>%</label>
                        <div class="range-wrap">
                            <input type="range" id="adultIntensity" min="0" max="100" value="${settings.adult?.intensity || 30}" oninput="document.getElementById('intimacyVal').textContent = this.value">
                            <span class="value" id="intimacyVal">${settings.adult?.intensity || 30}</span>
                        </div>
                    </div>
                    <button class="btn" onclick="saveAdultSettings()">保存</button>
                </div>
            </div>
        `;
    }

    function renderPlugins(main) {
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
                
                <button class="plugin-btn" onclick="window.location.href='js/plugins/adult-library/index.html'">
                    <div class="plugin-icon">🎀</div>
                    <div class="plugin-name">色色库</div>
                    <div class="plugin-desc">管理亲密互动插件</div>
                </button>
            </div>
        `;
    }

    window.showPage = showPage;
    window.selectWorld = function(id) {
        Data.setCurrentWorld(id);
        showPage('home');
    };
    
    window.showCreateWorld = function() {
        document.getElementById('modalTitle').textContent = '创建世界';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label>世界名称</label>
                <input type="text" id="worldName" placeholder="例如：我的异世界">
            </div>
            <div class="form-group">
                <label>类型</label>
                <select id="worldType">
                    <option value="现代">现代</option>
                    <option value="都市">都市</option>
                    <option value="奇幻">奇幻</option>
                    <option value="科幻">科幻</option>
                    <option value="古代">古代</option>
                    <option value="异世界">异世界</option>
                </select>
            </div>
            <button class="btn" onclick="createWorld()">创建</button>
        `;
        document.getElementById('modal').classList.add('active');
    };
    
    window.createWorld = function() {
        const name = document.getElementById('worldName').value;
        const type = document.getElementById('worldType').value;
        if (!name) return;
        const world = Data.createWorld({ name, type });
        Data.setCurrentWorld(world.id);
        
        if (typeof AchievementPlugin !== 'undefined') {
            AchievementPlugin.updateStats('world_create');
        }
        
        closeModal();
        showPage('worlds');
    };
    
    window.editWorld = function(id) {
        const world = Data.getWorlds().find(w => w.id === id);
        if (!world) return;
        document.getElementById('modalTitle').textContent = '编辑世界';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label>世界名称</label>
                <input type="text" id="worldName" value="${world.name}">
            </div>
            <div class="form-group">
                <label>类型</label>
                <select id="worldType">
                    ${['现代', '都市', '奇幻', '科幻', '古代', '异世界'].map(t => `<option value="${t}" ${world.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
            </div>
            <button class="btn" onclick="updateWorld('${id}')">保存</button>
        `;
        document.getElementById('modal').classList.add('active');
    };
    
    window.updateWorld = function(id) {
        const name = document.getElementById('worldName').value;
        const type = document.getElementById('worldType').value;
        Data.updateWorld(id, { name, type });
        closeModal();
        showPage('worlds');
    };
    
    window.deleteWorld = function(id) {
        if (confirm('确定删除？')) {
            Data.deleteWorld(id);
            showPage('worlds');
        }
    };
    
    window.showCreateCharacter = function() {
        document.getElementById('modalTitle').textContent = '添加角色';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label>角色名</label>
                <input type="text" id="charName" placeholder="例如：小美">
            </div>
            <div class="form-group">
                <label>性别</label>
                <select id="charGender">
                    <option value="女">女</option>
                    <option value="男">男</option>
                </select>
            </div>
            <div class="form-group">
                <label>角色定位</label>
                <select id="charRole">
                    <option value="主角">主角</option>
                    <option value="女主">女主</option>
                    <option value="配角">配角</option>
                </select>
            </div>
            <div class="form-group">
                <label>年龄</label>
                <input type="number" id="charAge" value="18">
            </div>
            <div class="form-group">
                <label>外貌描述（可选）</label>
                <textarea id="charAppearance" rows="2" placeholder="例如：身材高挑，长发披肩..."></textarea>
            </div>
            <div class="form-group">
                <label>性格（可选）</label>
                <input type="text" id="charPersonality" placeholder="例如：温柔活泼">
            </div>
            <button class="btn" onclick="createCharacter()">添加</button>
        `;
        document.getElementById('modal').classList.add('active');
    };
    
    window.createCharacter = function() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        const name = document.getElementById('charName').value;
        if (!name) return;
        Data.createCharacter(world.id, {
            name,
            gender: document.getElementById('charGender').value,
            role: document.getElementById('charRole').value,
            age: parseInt(document.getElementById('charAge').value) || 18,
            appearance: document.getElementById('charAppearance').value,
            personality: document.getElementById('charPersonality').value
        });
        
        if (typeof AchievementPlugin !== 'undefined') {
            AchievementPlugin.updateStats('character_create');
        }
        
        closeModal();
        showPage('characters');
    };
    
    window.editCharacter = function(id) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        const char = Data.getCharacter(world.id, id);
        if (!char) return;
        document.getElementById('modalTitle').textContent = '编辑角色';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group">
                <label>角色名</label>
                <input type="text" id="charName" value="${char.name}">
            </div>
            <div class="form-group">
                <label>性别</label>
                <select id="charGender">
                    <option value="女" ${char.gender === '女' ? 'selected' : ''}>女</option>
                    <option value="男" ${char.gender === '男' ? 'selected' : ''}>男</option>
                </select>
            </div>
            <div class="form-group">
                <label>角色定位</label>
                <select id="charRole">
                    <option value="主角" ${char.role === '主角' ? 'selected' : ''}>主角</option>
                    <option value="女主" ${char.role === '女主' ? 'selected' : ''}>女主</option>
                    <option value="配角" ${char.role === '配角' ? 'selected' : ''}>配角</option>
                </select>
            </div>
            <div class="form-group">
                <label>年龄</label>
                <input type="number" id="charAge" value="${char.age || 18}">
            </div>
            <button class="btn" onclick="updateCharacter('${id}')">保存</button>
        `;
        document.getElementById('modal').classList.add('active');
    };
    
    window.updateCharacter = function(id) {
        const world = Data.getCurrentWorld();
        Data.updateCharacter(world.id, id, {
            name: document.getElementById('charName').value,
            gender: document.getElementById('charGender').value,
            role: document.getElementById('charRole').value,
            age: parseInt(document.getElementById('charAge').value) || 18
        });
        closeModal();
        showPage('characters');
    };
    
    window.deleteCharacter = function(id) {
        if (confirm('确定删除？')) {
            const world = Data.getCurrentWorld();
            Data.deleteCharacter(world.id, id);
            showPage('characters');
        }
    };
    
    window.startStory = async function() {
        const world = Data.getCurrentWorld();
        const chars = Array.from(document.querySelectorAll('input[name="storyChars"]:checked')).map(c => c.value);
        const scene = document.getElementById('sceneInput').value;
        
        const protagonistStartAge = parseInt(document.getElementById('protagonistStartAge')?.value || '18');
        const storyStartYear = parseInt(document.getElementById('storyStartYear')?.value || '2024');
        
        const ageRelations = {};
        chars.forEach(charId => {
            const input = document.getElementById(`ageRelation_${charId}`);
            if (input) {
                ageRelations[charId] = parseInt(input.value) || 0;
            }
        });
        
        const playerCharSelect = document.getElementById('playerCharSelect');
        const customCharName = document.getElementById('customCharName');
        let playerChar = playerCharSelect?.value || '';
        let customChar = customCharName?.value || '';
        
        if (!playerChar && customChar) {
            playerChar = 'custom:' + customChar;
        }
        
        try {
            await Story.start({ 
                characters: chars, 
                scene, 
                playerChar,
                timeConfig: {
                    protagonistAge: protagonistStartAge,
                    startYear: storyStartYear,
                    ageRelations: ageRelations
                }
            });
            showPage('story');
            updateStoryRightPanel();
        } catch (err) {
            alert('错误：' + err.message);
        }
    };
    
    window.toggleTimeConfig = function() {
        const content = document.getElementById('timeConfigContent');
        if (content) {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
    };
    
    window.autoCalcAgeRelations = function() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const chars = Data.getCharacters(world.id);
        const protagonistAgeInput = document.getElementById('protagonistStartAge');
        const newProtagonistAge = parseInt(protagonistAgeInput?.value || '18');
        
        const protagonist = chars.find(c => c.role === '主角' || c.role === '女主');
        const originalProtagonistAge = protagonist?.age || 18;
        
        chars.forEach(c => {
            if (c.role !== '主角' && c.role !== '女主') {
                const input = document.getElementById(`ageRelation_${c.id}`);
                if (input) {
                    const originalDiff = c.age - originalProtagonistAge;
                    input.value = originalDiff;
                }
            }
        });
    };
    
    window.onPlayerCharChange = function() {
        const select = document.getElementById('playerCharSelect');
        const customGroup = document.getElementById('customCharGroup');
        if (select?.value === 'custom') {
            customGroup.style.display = 'block';
        } else {
            customGroup.style.display = 'none';
        }
    };
    
    window.showStoryCharSelector = function() {
        const selector = document.getElementById('storyCharSelector');
        selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
    };
    
    window.continueStory = async function() {
        const selectedCharIds = Array.from(document.querySelectorAll('input[name="storyCharsContinue"]:checked')).map(c => c.value);
        const world = Data.getCurrentWorld();
        
        const currentStory = Story.load(world.id);
        const currentCharIds = currentStory?.characters?.map(c => c.id) || [];
        
        const addedChars = selectedCharIds.filter(id => !currentCharIds.includes(id));
        const stillPresentChars = selectedCharIds.filter(id => currentCharIds.includes(id));
        
        const allChars = Data.getCharacters(world.id);
        
        const addedCharInfo = addedChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        const stillPresentCharInfo = stillPresentChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        let charChangeNote = '';
        if (addedCharInfo.length > 0 || stillPresentCharInfo.length > 0) {
            charChangeNote = '\n\n【参与角色调整】';
            if (stillPresentCharInfo.length > 0) {
                charChangeNote += `\n继续参与的角色：${stillPresentCharInfo.join('、')}`;
            }
            if (addedCharInfo.length > 0) {
                charChangeNote += `\n新加入的角色：${addedCharInfo.join('、')}（这些角色与主角可能还不熟悉，需要适当介绍）`;
            }
        }
        
        try {
            await Story.continue(null, { 
                characters: selectedCharIds,
                charChangeNote: charChangeNote
            });
            showPage('story');
            updateStoryRightPanel();
        } catch (err) {
            alert('错误：' + err.message);
        }
    };
    
    window.continueStoryWithNewChars = async function() {
        const selectedCharIds = Array.from(document.querySelectorAll('input[name="storyCharsContinue"]:checked')).map(c => c.value);
        const world = Data.getCurrentWorld();
        
        const currentStory = Story.load(world.id);
        const currentCharIds = currentStory?.characters?.map(c => c.id) || [];
        
        const addedChars = selectedCharIds.filter(id => !currentCharIds.includes(id));
        const stillPresentChars = selectedCharIds.filter(id => currentCharIds.includes(id));
        
        const allChars = Data.getCharacters(world.id);
        
        const addedCharInfo = addedChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        const stillPresentCharInfo = stillPresentChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        let charChangeNote = '';
        if (addedCharInfo.length > 0 || stillPresentCharInfo.length > 0) {
            charChangeNote = '\n\n【参与角色调整】';
            if (stillPresentCharInfo.length > 0) {
                charChangeNote += `\n继续参与的角色：${stillPresentCharInfo.join('、')}`;
            }
            if (addedCharInfo.length > 0) {
                charChangeNote += `\n新加入的角色：${addedCharInfo.join('、')}（这些角色与主角可能还不熟悉，需要适当介绍）`;
            }
        }
        
        try {
            await Story.continue(null, { 
                characters: selectedCharIds,
                charChangeNote: charChangeNote,
                generateNewScene: true
            });
            showPage('story');
            updateStoryRightPanel();
            document.getElementById('storyCharSelector').style.display = 'none';
        } catch (err) {
            alert('错误：' + err.message);
        }
    };
    
    window.refreshChoicesWithNewChars = async function() {
        const selectedCharIds = Array.from(document.querySelectorAll('input[name="storyCharsContinue"]:checked')).map(c => c.value);
        const world = Data.getCurrentWorld();
        
        const currentStory = Story.load(world.id);
        const currentCharIds = currentStory?.characters?.map(c => c.id) || [];
        
        const addedChars = selectedCharIds.filter(id => !currentCharIds.includes(id));
        const stillPresentChars = selectedCharIds.filter(id => currentCharIds.includes(id));
        
        const allChars = Data.getCharacters(world.id);
        
        const addedCharInfo = addedChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        const stillPresentCharInfo = stillPresentChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        let charChangeNote = '';
        if (addedCharInfo.length > 0 || stillPresentCharInfo.length > 0) {
            charChangeNote = '\n\n【参与角色调整】';
            if (stillPresentCharInfo.length > 0) {
                charChangeNote += `\n继续参与的角色：${stillPresentCharInfo.join('、')}`;
            }
            if (addedCharInfo.length > 0) {
                charChangeNote += `\n新加入的角色：${addedCharInfo.join('、')}（这些角色与主角可能还不熟悉，需要适当介绍）`;
            }
        }
        
        try {
            const newChoices = await Story.refreshChoices(currentStory, {
                characters: selectedCharIds,
                charChangeNote: charChangeNote
            });
            
            const lastSceneIndex = currentStory.scenes.length - 1;
            if (currentStory.scenes[lastSceneIndex]) {
                currentStory.scenes[lastSceneIndex].choices = newChoices;
            }
            
            Data.saveStory(world.id, currentStory);
            
            showPage('story');
            updateStoryRightPanel();
            document.getElementById('storyCharSelector').style.display = 'none';
        } catch (err) {
            alert('错误：' + err.message);
        }
    };
    
    window.getRecommendedChars = async function() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const story = Story.load(world.id);
        if (!story || !story.scenes || story.scenes.length === 0) {
            alert('暂无剧情内容，无法推荐角色');
            return;
        }
        
        const allChars = Data.getCharacters(world.id);
        if (allChars.length === 0) {
            alert('暂无角色数据');
            return;
        }
        
        const recentScenes = story.scenes.slice(-3);
        const recentContent = recentScenes.map(s => s.content).join('\n\n');
        const currentCharNames = story.characters?.map(c => c.name).join('、') || '无';
        const allCharNames = allChars.map(c => c.name).join('、');
        
        const prompt = `根据以下最近的故事剧情，推荐接下来最应该参与剧情的角色。

【当前参与角色】：${currentCharNames}
【所有可用角色】：${allCharNames}

【最近剧情】：
${recentContent}

请根据剧情发展和人物关系，推荐3-5个最适合参与下一段剧情的角色。只返回角色名字，用顿号分隔，不需要其他解释。`;

        try {
            const loadingDiv = document.getElementById('recommendedChars');
            const loadingList = document.getElementById('recommendedCharsList');
            loadingDiv.style.display = 'block';
            loadingList.innerHTML = '<span style="color: var(--bg); font-size: 0.8rem;">正在分析剧情...</span>';
            
            const result = await ai.call(prompt, { 
                system: '你是一个故事创作助手，擅长分析剧情和人物关系。',
                temperature: 0.3
            });
            
            const recommended = result.split(/[、，,]/).map(s => s.trim()).filter(s => s.length > 0);
            
            const matchedChars = allChars.filter(c => 
                recommended.some(r => c.name.includes(r) || r.includes(c.name))
            );
            
            loadingList.innerHTML = matchedChars.map(c => `
                <button class="btn btn-secondary" onclick="toggleRecommendChar('${c.id}')" 
                    style="padding: 4px 8px; font-size: 0.75rem; background: var(--bg); color: var(--accent);">
                    ${c.name}
                </button>
            `).join('');
            
            matchedChars.forEach(c => {
                const checkbox = document.querySelector(`input[name="storyCharsContinue"][value="${c.id}"]`);
                if (checkbox) checkbox.checked = true;
            });
            
        } catch (err) {
            console.error('推荐角色失败:', err);
            alert('推荐角色失败，请重试');
        }
    };
    
    window.toggleRecommendChar = function(charId) {
        const checkbox = document.querySelector(`input[name="storyCharsContinue"][value="${charId}"]`);
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
        }
    };

    window.makeChoice = async function(choice) {
        try {
            await Story.continue(choice);
            showPage('story');
            updateStoryRightPanel();
        } catch (err) {
            alert('错误：' + err.message);
        }
    };
    
    window.updateStoryRightPanel = function() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const right = document.getElementById('rightPanel');
        if (!right) return;
        
        const story = Story.load(world.id);
        renderStoryRightPanel(right, world, story);
    };

    window.showCustomChoiceInput = function() {
        const inputDiv = document.getElementById('customChoiceInput');
        inputDiv.style.display = inputDiv.style.display === 'none' ? 'flex' : 'none';
        if (inputDiv.style.display !== 'none') {
            document.getElementById('customChoiceText').focus();
        }
    };

    window.makeCustomChoice = function() {
        const customText = document.getElementById('customChoiceText').value.trim();
        if (!customText) {
            alert('请输入你的选择');
            return;
        }
        document.getElementById('customChoiceInput').style.display = 'none';
        document.getElementById('customChoiceText').value = '';
        makeChoice(customText);
    };

    window.showEndStoryModal = function() {
        document.getElementById('modalTitle').textContent = '🏁 结束故事';
        document.getElementById('modalBody').innerHTML = `
            <p style="margin-bottom: 16px;">确定要结束当前故事吗？</p>
            <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 20px;">
                故事结束后会被保存到历史记录中，你可以随时查看。
            </p>
            <button class="btn" onclick="endStory()">确认结束</button>
            <button class="btn btn-secondary" onclick="closeModal()" style="margin-left: 8px;">取消</button>
        `;
        document.getElementById('modal').classList.add('active');
    };

    window.endStory = async function() {
        try {
            const archive = await Story.end();
            
            if (typeof AchievementPlugin !== 'undefined') {
                AchievementPlugin.updateStats('story_end');
                const wordCount = archive.scenes ? archive.scenes.reduce((sum, s) => sum + (s.content?.length || 0), 0) : 0;
                if (wordCount > 0) {
                    AchievementPlugin.updateStats('total_words', wordCount);
                }
            }
            
            closeModal();
            alert(`故事已结束！\n标题：${archive.title}\n幕数：${archive.sceneCount}`);
            showPage('story');
        } catch (err) {
            alert('错误：' + err.message);
        }
    };

    window.showCharacterAttributes = function() {
        const world = Data.getCurrentWorld();
        if (!world) {
            alert('请先选择一个世界');
            return;
        }

        let chars = Data.getCharacters(world.id);
        if (chars.length === 0) {
            alert('当前世界没有角色');
            return;
        }

        let currentView = 'tags';
        let selectedCharId = null;
        let currentTab = 'basic';

        function getLatestChars() {
            return Data.getCharacters(world.id);
        }

        function renderCharList() {
            chars = getLatestChars();
            return chars.map(c => {
                const p = c.profile || {};
                const tags = [];
                if (c.role) tags.push(c.role);
                if (c.gender) tags.push(c.gender);
                if (c.age) tags.push(c.age + '岁');
                if (p.occupation) tags.push(p.occupation);
                if (p.personality) tags.push(p.personality.substring(0, 4));
                
                return `
                    <div style="padding: 12px; background: var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px;"
                         onclick="window._selectCharAttr('${c.id}')"
                         onmouseover="this.style.background='var(--accent-dim)'" 
                         onmouseout="this.style.background='var(--border)'">
                        <div style="font-weight: bold; margin-bottom: 4px;">${c.name}</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${tags.map(t => `<span style="font-size: 0.75rem; padding: 2px 6px; background: var(--bg); border-radius: 4px; color: var(--text-dim);">${t}</span>`).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderCharDetail(charId) {
            chars = getLatestChars();
            const char = chars.find(ch => ch.id === charId);
            if (!char) return '<div>角色不存在</div>';
            
            const tabs = [
                { id: 'basic', label: '📋 基础' },
                { id: 'personality', label: '🎭 性格' },
                { id: 'background', label: '📖 背景' },
                { id: 'stats', label: '📊 属性' },
                { id: 'adult', label: '🔞 色色' },
                { id: 'inventory', label: '🎒 背包' }
            ];
            
            const tabsHtml = tabs.map(t => `
                <button class="tab-btn ${currentTab === t.id ? 'active' : ''}" 
                        onclick="window._switchCharTab('${t.id}')" 
                        style="padding: 8px 12px; border: none; background: ${currentTab === t.id ? 'var(--accent)' : 'var(--border)'}; color: ${currentTab === t.id ? 'var(--bg)' : 'var(--text)'}; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                    ${t.label}
                </button>
            `).join('');
            
            const contentHtml = View.render('characterRead.' + currentTab, world.id, charId);
            
            return `
                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 4px;">${char.name}</div>
                    <div style="color: var(--text-dim); font-size: 0.85rem;">
                        ${char.gender || '女'} · ${char.age || 18}岁 · ${char.role || '配角'}
                    </div>
                </div>
                <div style="display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap;">
                    ${tabsHtml}
                </div>
                <div id="charTabContent">
                    ${contentHtml}
                </div>
            `;
        }

        function updateModalContent() {
            const body = document.getElementById('modalBody');
            if (currentView === 'tags') {
                body.innerHTML = `
                    <div style="margin-bottom: 12px;">
                        <h3 style="margin-bottom: 12px;">👤 角色列表</h3>
                        <p style="font-size: 0.85rem; color: var(--text-dim);">点击角色查看详细属性</p>
                    </div>
                    ${renderCharList()}
                `;
            } else {
                body.innerHTML = `
                    <div style="margin-bottom: 12px;">
                        <button class="btn btn-secondary" onclick="window._showCharList()" style="margin-bottom: 12px;">← 返回列表</button>
                    </div>
                    ${renderCharDetail(selectedCharId)}
                `;
            }
        }

        window._selectCharAttr = function(charId) {
            selectedCharId = charId;
            currentTab = 'basic';
            currentView = 'detail';
            updateModalContent();
        };

        window._switchCharTab = function(tab) {
            currentTab = tab;
            updateModalContent();
        };

        window._showCharList = function() {
            currentView = 'tags';
            selectedCharId = null;
            updateModalContent();
        };

        document.getElementById('modalTitle').textContent = '👤 角色属性';
        updateModalContent();
        document.getElementById('modal').classList.add('active');
    };

    window.showIntimateTriggerModal = async function() {
        if (typeof HentaiIntegration === 'undefined') {
            await loadHentaiPlugin();
        }

        if (typeof HentaiIntegration === 'undefined') {
            alert('色色插件未加载，请确保插件已启用');
            return;
        }

        await HentaiIntegration.init();

        const world = Data.getCurrentWorld();
        const settings = world ? Settings.get(world.id) : null;
        const intensity = settings?.adult?.intensity ?? 30;

        const categories = [
            { id: 'poses', name: '姿势', icon: '💑', desc: '体位和姿势' },
            { id: 'actions', name: '动作', icon: '👋', desc: '具体行为' },
            { id: 'body', name: '身体', icon: '💋', desc: '触碰部位' },
            { id: 'dialogue', name: '对话', icon: '💬', desc: '言语交流' },
            { id: 'style', name: '风格', icon: '✨', desc: '进行风格' },
            { id: 'locations', name: '地点', icon: '🏠', desc: '场所' },
            { id: 'roles', name: '角色', icon: '🎭', desc: '角色分工' },
            { id: 'toys', name: '道具', icon: '🎀', desc: '辅助道具' }
        ];

        const pluginItems = {};
        for (const cat of categories) {
            const items = HentaiUserContent?.getItems(cat.id) || [];
            pluginItems[cat.id] = items;
        }

        window._customIntimateCategories = categories;
        window._customIntimateItems = pluginItems;

        const categoryHtml = categories.map(cat => {
            const items = pluginItems[cat.id] || [];
            const optionsHtml = items.map((item, idx) => `
                <label style="display: block; padding: 8px 12px; background: var(--bg); border-radius: 6px; cursor: pointer; margin-bottom: 4px; transition: all 0.2s;"
                       onmouseover="this.style.background='var(--accent-dim)'" 
                       onmouseout="this.style.background='var(--bg)'">
                    <input type="radio" name="intimate_${cat.id}" value="${item.name}" data-cat="${cat.id}" ${idx === 0 ? 'checked' : ''}>
                    <span style="margin-left: 8px; font-weight: 500;">${item.name}</span>
                    ${item.desc ? `<span style="font-size: 0.75rem; color: var(--text-dim); margin-left: 8px;">${item.desc}</span>` : ''}
                </label>
            `).join('');

            return `
                <div class="intimate-category-item" data-cat="${cat.id}" style="margin-bottom: 12px; padding: 12px; background: var(--border); border-radius: 8px; opacity: 0.5;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
                        <input type="checkbox" class="intimate-category-toggle" value="${cat.id}" onchange="toggleIntimateCategory('${cat.id}')">
                        <span style="font-size: 1.2rem;">${cat.icon}</span>
                        <span style="font-weight: bold;">${cat.name}</span>
                        <span style="font-size: 0.8rem; color: var(--text-dim);">${cat.desc}</span>
                    </label>
                    <div class="intimate-category-options" id="options_${cat.id}" style="max-height: 400px; overflow-y: auto; padding: 8px; background: var(--bg); border-radius: 8px; display: none;">
                        ${optionsHtml || '<div style="color: var(--text-dim); text-align: center;">无可用选项</div>'}
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('modalTitle').textContent = '💕 亲密互动';
        document.getElementById('modalBody').innerHTML = `
            <p style="margin-bottom: 12px; font-size: 0.9rem;">选择要包含的元素（勾选类别后选择具体内容）：</p>
            <div style="max-height: 60vh; overflow-y: auto; padding-right: 8px;">
                ${categoryHtml}
            </div>
            <button class="btn" onclick="generateSelectedIntimate()" style="width: 100%; margin-top: 16px; background: linear-gradient(135deg, #ff69b4, #ff1493);">✨ 生成亲密互动</button>
            <button class="btn btn-secondary" onclick="closeModal()" style="width: 100%; margin-top: 8px;">取消</button>
        `;
        document.getElementById('modal').classList.add('active');

        setTimeout(() => {
            const toggles = document.querySelectorAll('.intimate-category-toggle');
            if (toggles.length > 0) {
                toggles[0].checked = true;
                toggleIntimateCategory(toggles[0].value);
            }
        }, 100);
    };

    window.toggleIntimateCategory = function(catId) {
        const checkbox = document.querySelector(`.intimate-category-toggle[value="${catId}"]`);
        const categoryItem = document.querySelector(`.intimate-category-item[data-cat="${catId}"]`);
        const optionsDiv = document.getElementById(`options_${catId}`);
        const radios = document.querySelectorAll(`input[data-cat="${catId}"]`);
        
        if (checkbox && categoryItem && optionsDiv) {
            const isChecked = checkbox.checked;
            categoryItem.style.opacity = isChecked ? '1' : '0.5';
            optionsDiv.style.display = isChecked ? 'block' : 'none';
            
            radios.forEach(r => r.disabled = !isChecked);
        }
    };

    window.generateSelectedIntimate = function() {
        const categories = window._customIntimateCategories;
        const selectedElements = {};

        for (const cat of categories) {
            const checkbox = document.querySelector(`.intimate-category-toggle[value="${cat.id}"]`);
            if (checkbox && checkbox.checked) {
                const selected = document.querySelector(`input[name="intimate_${cat.id}"]:checked`);
                if (selected) {
                    const items = window._customIntimateItems[cat.id] || [];
                    const item = items.find(i => i.name === selected.value);
                    if (item) {
                        selectedElements[cat.id] = item;
                    }
                }
            }
        }

        if (Object.keys(selectedElements).length === 0) {
            alert('请至少选择一个元素');
            return;
        }

        const prompt = buildIntimatePrompt(selectedElements);

        closeModal();

        document.getElementById('modalTitle').textContent = '💕 亲密互动';
        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">场景元素</div>
                <pre style="background: var(--border); padding: 12px; border-radius: 8px; font-size: 0.85rem; max-height: 200px; overflow-y: auto;">${JSON.stringify(selectedElements, null, 2)}</pre>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">生成提示</div>
                <div style="background: linear-gradient(135deg, #fff0f5, #ffe4e9); padding: 12px; border-radius: 8px; border-left: 3px solid var(--accent);">
                    ${prompt}
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn" onclick="applyIntimateToStory('${prompt.replace(/'/g, "\\'")}')" style="flex: 1; background: linear-gradient(135deg, #ff69b4, #ff1493);">✨ 应用到故事</button>
                <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
            </div>
        `;
        document.getElementById('modal').classList.add('active');

        window._lastIntimateElements = selectedElements;
    };

    function buildIntimatePrompt(elements) {
        let prompt = '';
        
        if (elements.poses) {
            const poseName = typeof elements.poses === 'object' ? elements.poses.name : elements.poses;
            const poseDesc = typeof elements.poses === 'object' ? elements.poses.desc : '';
            prompt += `使用${poseName}姿势${poseDesc ? '，' + poseDesc : ''}，`;
        }
        
        if (elements.body) {
            const bodyName = typeof elements.body === 'object' ? elements.body.name : elements.body;
            prompt += `重点接触${bodyName}部位，`;
        }
        
        if (elements.actions) {
            const actionName = typeof elements.actions === 'object' ? elements.actions.name : elements.actions;
            prompt += `进行${actionName}，`;
        }
        
        if (elements.dialogue) {
            const dialogueContent = typeof elements.dialogue === 'object' ? elements.dialogue.name : elements.dialogue;
            prompt += `对话内容：${dialogueContent}，`;
        }
        
        if (elements.style) {
            const styleName = typeof elements.style === 'object' ? elements.style.name : elements.style;
            prompt += `以${styleName}风格进行`;
        }
        
        if (elements.locations) {
            const locName = typeof elements.locations === 'object' ? elements.locations.name : elements.locations;
            prompt += `，场景地点：${locName}`;
        }
        
        if (elements.roles) {
            const roleName = typeof elements.roles === 'object' ? elements.roles.name : elements.roles;
            prompt += `，角色分工：${roleName}`;
        }
        
        if (elements.toys) {
            const toyName = typeof elements.toys === 'object' ? elements.toys.name : elements.toys;
            prompt += `，使用道具：${toyName}`;
        }
        
        return prompt || '进行亲密互动';
    };

    window.showCustomIntimateSelect = async function() {
        const context = window._currentIntimateContext || {
            affection: 50,
            arousal: 40,
            location: 'bedroom',
            time: new Date().getHours()
        };

        const categories = [
            { id: 'poses', name: '姿势', icon: '💑', desc: '体位和姿势' },
            { id: 'actions', name: '动作', icon: '👋', desc: '具体行为' },
            { id: 'body', name: '身体', icon: '💋', desc: '触碰部位' },
            { id: 'dialogue', name: '对话', icon: '💬', desc: '言语交流' },
            { id: 'style', name: '风格', icon: '✨', desc: '进行风格' },
            { id: 'locations', name: '地点', icon: '🏠', desc: '场所' },
            { id: 'roles', name: '角色', icon: '🎭', desc: '角色分工' },
            { id: 'toys', name: '道具', icon: '🎀', desc: '辅助道具' }
        ];

        const categoryHtml = categories.map(c => `
            <label style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s;" 
                   onmouseover="this.style.background='var(--accent-dim)'" 
                   onmouseout="this.style.background='var(--border)'">
                <input type="checkbox" class="custom-intimate-category" value="${c.id}" checked>
                <span style="font-size: 1.2rem;">${c.icon}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${c.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-dim);">${c.desc}</div>
                </div>
            </label>
        `).join('');

        const pluginItems = {};
        for (const cat of categories) {
            const items = HentaiUserContent?.getItems(cat.id) || [];
            pluginItems[cat.id] = items;
        }

        document.getElementById('modalTitle').textContent = '⚙️ 自定义亲密互动';
        document.getElementById('modalBody').innerHTML = `
            <p style="margin-bottom: 12px; font-size: 0.9rem;">选择要包含的元素类型：</p>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px;">
                ${categoryHtml}
            </div>
            <button class="btn" onclick="generateCustomIntimate()" style="width: 100%; background: linear-gradient(135deg, #ff69b4, #ff1493);">✨ 生成亲密互动</button>
            <button class="btn btn-secondary" onclick="showIntimateTriggerModal()" style="width: 100%; margin-top: 8px;">返回</button>
        `;
        document.getElementById('modal').classList.add('active');

        window._customIntimateCategories = categories;
        window._customIntimateItems = pluginItems;
    };

    window.generateCustomIntimate = async function() {
        const checkboxes = document.querySelectorAll('.custom-intimate-category:checked');
        const selectedPlugins = Array.from(checkboxes).map(cb => cb.value);

        if (selectedPlugins.length === 0) {
            alert('请至少选择一个元素类型');
            return;
        }

        const context = window._currentIntimateContext || {
            affection: 50,
            arousal: 40,
            location: 'bedroom',
            time: new Date().getHours()
        };

        const fullContext = {
            ...context,
            affection: 60,
            arousal: 50,
            preferredPlugins: selectedPlugins
        };

        const result = await HentaiIntegration.trigger(fullContext);

        closeModal();

        if (result.triggered) {
            document.getElementById('modalTitle').textContent = '💕 自定义亲密互动';
            document.getElementById('modalBody').innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.85rem; color: var(--text-dim);">触发类型</div>
                    <div style="color: var(--accent);">${result.type}</div>
                </div>
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.85rem; color: var(--text-dim);">场景元素</div>
                    <pre style="background: var(--border); padding: 12px; border-radius: 8px; font-size: 0.85rem; max-height: 200px; overflow-y: auto;">${JSON.stringify(result.scene, null, 2)}</pre>
                </div>
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.85rem; color: var(--text-dim);">生成提示</div>
                    <div style="background: linear-gradient(135deg, #fff0f5, #ffe4e9); padding: 12px; border-radius: 8px; border-left: 3px solid var(--accent);">
                        ${result.prompt}
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn" onclick="applyIntimateToStory('${result.prompt.replace(/'/g, "\\'")}')" style="flex: 1; background: linear-gradient(135deg, #ff69b4, #ff1493);">✨ 应用到故事</button>
                    <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
                </div>
            `;
            document.getElementById('modal').classList.add('active');

            window._lastIntimateResult = result;
        } else {
            alert('生成失败，请重试');
        }
    };

    window.confirmIntimateTrigger = async function(suggestionIndex) {
        const suggestions = window._currentIntimateSuggestions;
        const context = window._currentIntimateContext;

        if (!suggestions || !suggestions[suggestionIndex]) return;

        const suggestion = suggestions[suggestionIndex];

        const fullContext = {
            ...context,
            affection: 60,
            arousal: 50,
            preferredPlugins: suggestion.plugins
        };

        const result = await HentaiIntegration.trigger(fullContext);

        closeModal();

        if (result.triggered) {
            document.getElementById('modalTitle').textContent = '💕 ' + suggestion.label;
            document.getElementById('modalBody').innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.85rem; color: var(--text-dim);">触发类型</div>
                    <div style="color: var(--accent);">${result.type}</div>
                </div>
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.85rem; color: var(--text-dim);">场景元素</div>
                    <pre style="background: var(--border); padding: 12px; border-radius: 8px; font-size: 0.85rem; max-height: 200px; overflow-y: auto;">${JSON.stringify(result.scene, null, 2)}</pre>
                </div>
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.85rem; color: var(--text-dim);">生成提示</div>
                    <div style="background: linear-gradient(135deg, #fff0f5, #ffe4e9); padding: 12px; border-radius: 8px; border-left: 3px solid var(--accent);">
                        ${result.prompt}
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn" onclick="applyIntimateToStory('${result.prompt.replace(/'/g, "\\'")}')" style="flex: 1; background: linear-gradient(135deg, #ff69b4, #ff1493);">✨ 应用到故事</button>
                    <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
                </div>
            `;
            document.getElementById('modal').classList.add('active');

            window._lastIntimateResult = result;
        } else {
            alert('触发失败，请稍后重试');
        }
    };

    window.applyIntimateToStory = function(prompt) {
        if (!prompt) {
            alert('没有可应用的内容');
            return;
        }
        
        if (typeof AchievementPlugin !== 'undefined') {
            let intimateType = 'general';
            if (prompt.includes('姿势')) intimateType = 'poses';
            else if (prompt.includes('动作')) intimateType = 'actions';
            else if (prompt.includes('部位')) intimateType = 'body';
            else if (prompt.includes('对话')) intimateType = 'dialogue';
            else if (prompt.includes('风格')) intimateType = 'style';
            
            AchievementPlugin.updateStats('intimate', { type: intimateType, pose: prompt.includes('姿势') ? prompt : null });
        }
        
        closeModal();
        makeChoice(prompt);
    };

    window.viewArchive = function(archiveId) {
        const world = Data.getCurrentWorld();
        const archives = Story.getArchives(world.id);
        const archive = archives.find(a => a.id === archiveId);
        
        if (!archive) return;
        
        const charNames = Array.isArray(archive.characters) 
            ? archive.characters.map(c => c.name).join('、') 
            : archive.characters;
        
        document.getElementById('modalTitle').textContent = archive.title;
        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">角色</div>
                <div>${charNames}</div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">幕数</div>
                <div>${archive.sceneCount}幕</div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">开始时间</div>
                <div>${new Date(archive.startTime).toLocaleString()}</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">结束时间</div>
                <div>${new Date(archive.endTime).toLocaleString()}</div>
            </div>
            <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
        `;
        document.getElementById('modal').classList.add('active');
    };
    
    window.viewArchivedStory = function(archiveId) {
        const world = Data.getCurrentWorld();
        const archived = Story.getArchivedStories(world.id);
        const archive = archived.find(a => a.id === archiveId);
        
        if (!archive) return;
        
        const charNames = Array.isArray(archive.characters) 
            ? archive.characters.map(c => c.name).join('、') 
            : archive.characters;
        
        document.getElementById('modalTitle').textContent = archive.title;
        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">角色</div>
                <div>${charNames}</div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">幕数</div>
                <div>${archive.sceneCount}幕</div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">归档时间</div>
                <div>${new Date(archive.archivedAt).toLocaleString()}</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">故事概要</div>
                <div>${archive.summary || '无'}</div>
            </div>
            <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
        `;
        document.getElementById('modal').classList.add('active');
    };
    
    window.viewLevel2Story = function(archiveId) {
        const world = Data.getCurrentWorld();
        const level2 = Story.getLevel2Archives(world.id);
        const archive = level2.find(a => a.id === archiveId);
        
        if (!archive) return;
        
        document.getElementById('modalTitle').textContent = archive.title;
        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">幕数</div>
                <div>${archive.sceneCount}幕</div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">归档时间</div>
                <div>${new Date(archive.archivedAt).toLocaleString()}</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">故事摘要</div>
                <div style="max-height: 300px; overflow-y: auto;">${archive.summary || '无'}</div>
            </div>
            <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
        `;
        document.getElementById('modal').classList.add('active');
    };
    
    window.viewLevel3Story = function(archiveId) {
        const world = Data.getCurrentWorld();
        const level3 = Story.getLevel3Archives(world.id);
        const archive = level3.find(a => a.id === archiveId);
        
        if (!archive) return;
        
        let storiesHtml = '';
        if (archive.stories) {
            storiesHtml = archive.stories.map(s => `
                <div style="margin-bottom: 12px; padding: 8px; background: var(--border); border-radius: 6px;">
                    <div style="font-weight: 500; margin-bottom: 4px;">${s.title}</div>
                    <div style="font-size: 0.85rem;">${s.summary}</div>
                </div>
            `).join('');
        }
        
        document.getElementById('modalTitle').textContent = archive.title;
        document.getElementById('modalBody').innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">故事数量</div>
                <div>${archive.stories ? archive.stories.length : 0}个故事</div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">归档时间</div>
                <div>${new Date(archive.archivedAt).toLocaleString()}</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">合集摘要</div>
                <div style="max-height: 300px; overflow-y: auto;">${archive.summary || '无'}</div>
            </div>
            <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
        `;
        document.getElementById('modal').classList.add('active');
    };
    
    window.restartStory = function() {
        if (confirm('确定要重新开始吗？当前进度将丢失。')) {
            const world = Data.getCurrentWorld();
            Data.saveStory(world.id, null);
            Story.current = null;
            showPage('story');
        }
    };
    
    window.resumeArchive = function(archiveId) {
        try {
            const story = Story.resumeArchive(archiveId);
            if (story) {
                showPage('story');
            } else {
                alert('无法继续此故事，可能缺少保存的剧情内容');
            }
        } catch (err) {
            alert('错误：' + err.message);
        }
    };
    
    window.exportArchive = function(archiveId) {
        try {
            Story.exportArchive(archiveId);
            
            if (typeof AchievementPlugin !== 'undefined') {
                AchievementPlugin.updateStats('export');
            }
        } catch (err) {
            alert('导出失败：' + err.message);
        }
    };
    
    window.deleteArchive = function(archiveId) {
        if (!confirm('确定要删除这个故事吗？此操作不可恢复。')) return;
        
        try {
            if (Story.deleteArchive(archiveId)) {
                showPage('story');
            } else {
                alert('删除失败');
            }
        } catch (err) {
            alert('错误：' + err.message);
        }
    };
    
    window.deleteArchivedStory = function(archiveId) {
        if (!confirm('确定要删除这个归档故事吗？此操作不可恢复。')) return;
        
        try {
            if (Story.deleteArchivedStory(archiveId)) {
                showPage('story');
            } else {
                alert('删除失败');
            }
        } catch (err) {
            alert('错误：' + err.message);
        }
    };
    
    window.deleteLevel2Story = function(archiveId) {
        if (!confirm('确定要删除这个二级归档吗？此操作不可恢复。')) return;
        
        try {
            if (Story.deleteLevel2Story(archiveId)) {
                showPage('story');
            } else {
                alert('删除失败');
            }
        } catch (err) {
            alert('错误：' + err.message);
        }
    };
    
    window.deleteLevel3Story = function(archiveId) {
        if (!confirm('确定要删除这个三级归档吗？此操作不可恢复。')) return;
        
        try {
            if (Story.deleteLevel3Story(archiveId)) {
                showPage('story');
            } else {
                alert('删除失败');
            }
        } catch (err) {
            alert('错误：' + err.message);
        }
    };
    
    window.importArchiveFile = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const archive = Story.importArchive(e.target.result);
                if (archive) {
                    if (typeof AchievementPlugin !== 'undefined') {
                        AchievementPlugin.updateStats('import');
                    }
                    showPage('story');
                }
            } catch (err) {
                alert(err.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };
    
    window.saveApiSettings = function() {
        ai.saveConfig({
            provider: document.getElementById('apiProvider').value,
            apiKey: document.getElementById('apiKey').value,
            endpoint: document.getElementById('apiEndpoint').value
        });
        alert('API设置已保存');
    };
    
    window.saveContentSettings = function() {
        const world = Data.getCurrentWorld();
        const settings = Settings.get(world?.id);
        settings.content = settings.content || {};
        settings.output = settings.output || {};
        settings.content.tone = document.getElementById('contentTone').value;
        settings.content.detailLevel = document.getElementById('detailLevel').value;
        settings.output.style = document.getElementById('outputStyle').value;
        Settings.save(world?.id, settings);
        alert('内容设置已保存');
    };
    
    window.saveAdultSettings = function() {
        const world = Data.getCurrentWorld();
        const settings = Settings.get(world?.id);
        const wasEnabled = settings.adult?.enabled;
        settings.adult = settings.adult || {};
        settings.adult.enabled = document.getElementById('adultEnabled').checked;
        settings.adult.intensity = parseInt(document.getElementById('adultIntensity').value);
        Settings.save(world?.id, settings);
        
        if (!wasEnabled && settings.adult.enabled && typeof AchievementPlugin !== 'undefined') {
            AchievementPlugin.updateStats('adult_enable');
        }
        
        alert('成人设置已保存');
    };
    
    window.closeModal = function() {
        document.getElementById('modal').classList.remove('active');
    };

    window.showCharStats = function(charId) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        const char = Data.getCharacter(world.id, charId);
        if (!char) return;
        
        const statsHtml = View.render('character.main', world.id, charId);
        
        document.getElementById('modalTitle').textContent = `${char.name || '角色'} - 详细面板`;
        document.getElementById('modalBody').innerHTML = statsHtml;
        document.getElementById('modal').classList.add('active');
    };

    window.showCharInventory = function(charId) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        const char = Data.getCharacter(world.id, charId);
        if (!char) return;
        
        const inventoryHtml = View.render('inventory.main', world.id, charId);
        
        document.getElementById('modalTitle').textContent = `${char.name} - 背包`;
        document.getElementById('modalBody').innerHTML = `
            ${inventoryHtml}
        `;
        document.getElementById('modal').classList.add('active');
    };

    window.showCharAchievements = function() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const achievementsHtml = View.render('achievement.main', world.id);
        
        document.getElementById('modalTitle').textContent = '成就中心';
        document.getElementById('modalBody').innerHTML = `
            ${achievementsHtml}
        `;
        document.getElementById('modal').classList.add('active');
    };

    window.showIntimatePanel = function(charId, targetId) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const char = Data.getCharacter(world.id, charId);
        const target = Data.getCharacter(world.id, targetId);
        
        if (!char || !target) return;
        
        const panelHtml = View.render('intimate.main', world.id, charId, targetId);
        
        document.getElementById('modalTitle').textContent = `${char.name} ↔ ${target.name}`;
        document.getElementById('modalBody').innerHTML = panelHtml;
        document.getElementById('modal').classList.add('active');
    };

    window.togglePlugin = function(name) {
        const plugin = PluginSystem.get(name);
        if (plugin) {
            if (plugin.enabled) {
                PluginSystem.disable(name);
            } else {
                PluginSystem.enable(name);
            }
            showPage('plugins');
        }
    };
    
    window.showPluginContent = function(pluginName) {
        const world = Data.getCurrentWorld();
        let content = '';
        
        switch(pluginName) {
            case 'character':
                if (world) {
                    const chars = Data.getCharacters(world.id);
                    if (chars.length > 0) {
                        content = View.render('character.main', world.id, chars[0].id);
                    } else {
                        content = '<div class="empty">暂无角色，请先添加角色</div>';
                    }
                } else {
                    content = '<div class="empty">请先选择一个世界</div>';
                }
                break;
            case 'inventory':
                if (world) {
                    const chars = Data.getCharacters(world.id);
                    if (chars.length > 0) {
                        content = View.render('inventory.main', world.id, chars[0].id);
                    } else {
                        content = '<div class="empty">暂无角色，请先添加角色</div>';
                    }
                } else {
                    content = '<div class="empty">请先选择一个世界</div>';
                }
                break;
            case 'achievement':
                if (world) {
                    content = View.render('achievement.main', world.id);
                } else {
                    content = '<div class="empty">请先选择一个世界</div>';
                }
                break;
            case 'intimate':
                if (world) {
                    const chars = Data.getCharacters(world.id);
                    if (chars.length >= 2) {
                        content = View.render('intimate.main', world.id, chars[0].id, chars[1].id);
                    } else {
                        content = '<div class="empty">至少需要两个角色才能进行互动</div>';
                    }
                } else {
                    content = '<div class="empty">请先选择一个世界</div>';
                }
                break;
            case 'intimate-actions':
                content = View.render('intimate-actions.panel');
                break;
            case 'intimate-body':
                content = View.render('intimate-body.panel');
                break;
            case 'intimate-dialogue':
                content = View.render('intimate-dialogue.panel');
                break;
            case 'intimate-fetish':
                content = View.render('intimate-fetish.panel');
                break;
            case 'intimate-locations':
                content = View.render('intimate-locations.panel');
                break;
            case 'intimate-poses':
                content = View.render('intimate-poses.panel');
                break;
            case 'intimate-roles':
                content = View.render('intimate-roles.panel');
                break;
            case 'intimate-style':
                content = View.render('intimate-style.panel');
                break;
            case 'intimate-toys':
                content = View.render('intimate-toys.panel');
                break;
            default:
                content = '<div class="empty">该插件暂无内容</div>';
        }
        
        document.getElementById('modalTitle').textContent = pluginName + ' - 内容面板';
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('modal').classList.add('active');
    };
    
    init();
})();
