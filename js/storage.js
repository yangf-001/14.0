const Storage = {
    init() {
        window.renderStorage = this.renderStorage.bind(this);
    },

    toggleElement(el) {
        if (!el) return;
        if (typeof el === 'string') {
            el = document.getElementById(el);
        }
        if (el) {
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }
    },

    formatDateTime(timestamp) {
        if (!timestamp) return '未知';
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekDay = weekDays[date.getDay()];
        return `${year}年${month}月${day}日 ${hours}:${minutes} 星期${weekDay}`;
    },

    toggleArchiveDetails(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }
    },

    toggleStoryContent(spanEl) {
        const card = spanEl.closest('.story-card');
        if (card) {
            const content = card.querySelector('.story-content');
            if (content) {
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            }
        }
    },

    toggleCardContent(clickEl) {
        if (typeof clickEl === 'string') {
            clickEl = document.querySelector(clickEl);
        }
        if (!clickEl) return;
        const card = clickEl.closest('.card');
        if (card) {
            const content = card.querySelector('.card-content');
            if (content) {
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            }
        }
    },

    viewArchiveDetails(archiveId) {
        if (!window.Story) {
            const main = document.getElementById('mainContent');
            main.innerHTML = `<div class="empty">Story模块正在加载中，请稍后再试</div>`;
            return;
        }
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const archives = Story.getArchives(world.id);
        const archive = archives.find(a => a.id === archiveId);
        
        if (!archive) {
            alert('存档不存在');
            return;
        }
        
        const level2Archives = Story.getLevel2Archives(world.id);
        const level3Archives = Story.getLevel3Archives(world.id);
        
        const main = document.getElementById('mainContent');
        
        main.innerHTML = `
            <div style="margin-bottom: 20px;">
                <button class="btn btn-secondary" onclick="Storage.renderStorage(document.getElementById('mainContent'))" style="font-size: 0.8rem;">← 返回</button>
            </div>
            
            <div class="card" style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 16px;">📖 ${archive.title}</h3>
                <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 16px;">
                    <div>角色：${Array.isArray(archive.characters) ? archive.characters.map(c => c.name).join('、') : archive.characters || '未知'}</div>
                    <div>开始：${this.formatDateTime(archive.startTime)}</div>
                    <div>结束：${this.formatDateTime(archive.endTime) || this.formatDateTime(archive.startTime)}</div>
                </div>
                
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="btn btn-secondary" onclick="exportArchive('${archive.id}')">📤 导出</button>
                    <button class="btn btn-secondary" onclick="if(confirm('确定删除?')){ deleteArchive('${archive.id}'); Storage.renderStorage(document.getElementById('mainContent')); }">🗑️ 删除</button>
                </div>
            </div>
            
            <div class="setting-section">
                <h4>📊 储存统计</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
                    <div class="card" style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--accent);">${archive.stories?.length || 0}</div>
                        <div style="font-size: 0.8rem; color: var(--text-dim);">一级储存</div>
                    </div>
                    <div class="card" style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #f59e0b;">${level2Archives.length}</div>
                        <div style="font-size: 0.8rem; color: var(--text-dim);">二级储存</div>
                    </div>
                    <div class="card" style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #8b5cf6;">${level3Archives.length}</div>
                        <div style="font-size: 0.8rem; color: var(--text-dim);">三级储存</div>
                    </div>
                </div>
            </div>
            
            <div class="setting-section">
                <h4>📖 一级储存 (共${archive.stories?.length || 0}章)</h4>
                ${(() => {
                    if (archive.stories && archive.stories.length > 0) {
                        return archive.stories.map((story, index) => `
                <div class="card story-card" style="margin-bottom: 16px; border-left: 3px solid var(--accent);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="flex: 1;">
                            <div style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">第${index + 1}章 ${story.title || ''}</div>
                            <div style="font-size: 0.75rem; color: #10b981; margin-top: 4px;">📌 ${story.corePlot || '无核心情节'}</div>
                            <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">${story.sceneCount || 0}幕 · <span style="cursor: pointer; color: var(--accent);" onclick="Storage.toggleStoryContent(this)">点击展开/折叠全文</span></div>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <button class="btn btn-secondary" style="font-size: 0.7rem; padding: 4px 8px;" onclick="Storage.editStory('${archive.id}', ${index})">✏️</button>
                            <button class="btn btn-secondary" style="font-size: 0.7rem; padding: 4px 8px;" onclick="if(confirm('确定删除这个故事?')){ Storage.deleteStory('${archive.id}', ${index}); }">🗑️</button>
                        </div>
                    </div>
                    <div class="story-content" style="font-size: 0.8rem; line-height: 1.6; white-space: pre-wrap; display: none;">${story.content || '无内容'}</div>
                </div>
                        `).join('');
                    } else if (archive.fullSummary) {
                        return `
                <div class="card" style="margin-bottom: 12px;">
                    <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: var(--accent); cursor: pointer;" onclick="Storage.toggleCardContent(this)">${archive.title}</div>
                    <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 8px;">点击展开/折叠</div>
                    <div class="card-content" style="font-size: 0.8rem; line-height: 1.6; white-space: pre-wrap; display: none;">${archive.fullSummary || '无内容'}</div>
                </div>
                        `;
                    } else {
                        return '<div class="empty">无内容</div>';
                    }
                })()}
            </div>
            
            ${level2Archives.length > 0 ? `
            <div class="setting-section">
                <h4>📦 二级储存 (共${level2Archives.length}个)</h4>
                ${level2Archives.map((l2, i) => `
                <div class="card" style="margin-bottom: 12px; border-left: 3px solid #f59e0b;">
                    <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; cursor: pointer;" onclick="Storage.toggleCardContent(this)">
                        ${l2.archive ? l2.archive.title : '二级储存 #' + (i + 1)}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 8px;">
                        ${l2.archive ? '角色: ' + (Array.isArray(l2.archive.characters) ? l2.archive.characters.map(c => c.name).join('、') : '未知') + ' | ' + l2.archive.sceneCount + '幕' : ''} · 点击展开/折叠
                    </div>
                    <div class="card-content" style="font-size: 0.8rem; line-height: 1.6; white-space: pre-wrap; display: none;">${l2.summary || '无内容'}</div>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${level3Archives.length > 0 ? `
            <div class="setting-section">
                <h4>📚 三级储存 (共${level3Archives.length}个)</h4>
                ${level3Archives.map((l3, i) => `
                <div class="card" style="margin-bottom: 12px; border-left: 3px solid #8b5cf6;">
                    <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; cursor: pointer;" onclick="Storage.toggleCardContent(this)">三级储存 #${i + 1}</div>
                    <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 8px;">点击展开/折叠</div>
                    <div class="card-content" style="font-size: 0.8rem; line-height: 1.6; white-space: pre-wrap; display: none;">${l3.summary || '无内容'}</div>
                </div>
                `).join('')}
            </div>
            ` : ''}
        `;
    },

    renderStorage(main) {
        const world = Data.getCurrentWorld();
        
        if (!world) {
            main.innerHTML = `<h2>📦 存储库</h2><div class="empty">请先选择一个世界</div>`;
            return;
        }

        const storageTab = window.storageCurrentTab || 'story';
        
        main.innerHTML = `
            <h2>📦 存储库</h2>
            <p class="desc">当前世界：${world.name}</p>
            
            <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
                <button class="nav-btn ${storageTab === 'story' ? 'active' : ''}" data-storage-tab="story" onclick="Storage.switchTab('story')">📖 剧情</button>
                <button class="nav-btn ${storageTab === 'characters' ? 'active' : ''}" data-storage-tab="characters" onclick="Storage.switchTab('characters')">👤 角色</button>
                <button class="nav-btn ${storageTab === 'groups' ? 'active' : ''}" data-storage-tab="groups" onclick="Storage.switchTab('groups')">👥 组合</button>
            </div>
            
            <div id="storageContent"></div>
        `;
        
        this.renderContent(storageTab);
    },

    switchTab(tab) {
        window.storageCurrentTab = tab;
        document.querySelectorAll('[data-storage-tab]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.storageTab === tab);
        });
        this.renderContent(tab);
    },

    renderContent(tab) {
        const world = Data.getCurrentWorld();
        const content = document.getElementById('storageContent');
        
        if (tab === 'story') {
            this.renderStory(content, world);
        } else if (tab === 'characters') {
            this.renderCharacters(content, world);
        } else if (tab === 'groups') {
            this.renderGroups(content, world);
        }
    },

    renderStory(content, world) {
        if (!window.Story) {
            content.innerHTML = `<div class="empty">Story模块正在加载中，请稍后再试</div>`;
            return;
        }
        const story = Story.load(world.id);
        const archives = Story.getArchives(world.id);
        
        const hasActiveStory = story && story.status === 'ongoing';
        
        content.innerHTML = `
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
                                    ${Array.isArray(story.characters) ? story.characters.map(c => c.name).join('、') : story.characters || '未知角色'} · 第${story.round}轮 · ${story.scenes?.length || 0}幕
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
                <h4>📚 故事存档 (${archives.length})</h4>
                ${archives.length === 0 ? '<div class="empty">暂无已存档的故事</div>' : ''}
                ${archives.map((a, index) => {
                    const level2Archives = Story.getLevel2Archives(world.id);
                    const level3Archives = Story.getLevel3Archives(world.id);
                    
                    return `
                        <div class="card" style="margin-bottom: 12px; border: 1px solid var(--border);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 500; cursor: pointer; color: var(--accent);" onclick="Storage.viewArchiveDetails('${a.id}')">${a.title}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">
                                        ${Array.isArray(a.characters) ? a.characters.map(c => c.name).join('、') : a.characters || '未知角色'} · ${a.sceneCount}幕 · ${a.endTime ? new Date(a.endTime).toLocaleDateString() : (a.startTime ? new Date(a.startTime).toLocaleDateString() : '未知')}
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--accent); margin-top: 4px;">
                                        📖 一级:${archives.length} | 📦 二级:${level2Archives.length} | 📚 三级:${level3Archives.length}
                                    </div>
                                </div>
                                <div style="display: flex; gap: 6px;">
                                    <button class="btn btn-secondary" onclick="exportArchive('${a.id}')" style="font-size: 0.75rem; padding: 6px 10px;">📤</button>
                                    <button class="btn btn-secondary" onclick="deleteArchive('${a.id}')" style="font-size: 0.75rem; padding: 6px 10px;">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderCharacters(content, world) {
        const chars = Data.getCharacters(world.id);
        
        content.innerHTML = `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <button class="btn" onclick="Storage.showCreateCharacter()" style="font-size: 0.85rem;">➕ 添加角色</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('importCharInput').click()" style="font-size: 0.85rem;">📥 导入角色</button>
                    <input type="file" id="importCharInput" accept=".json" style="display: none;" onchange="Storage.importCharacter(event)">
                </div>
            </div>
            
            <div class="setting-section">
                <h4>👤 角色列表 (${chars.length})</h4>
                ${chars.length === 0 ? '<div class="empty">暂无角色，请添加或导入角色</div>' : ''}
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                    ${chars.map(c => `
                        <div class="card" onclick="showCharInfo('${c.id}')" style="cursor: pointer;">
                            <div style="font-weight: 500;">${c.name}</div>
                            <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">
                                ${c.role || '配角'} · ${c.gender || '未知'} · ${c.age || 18}岁
                            </div>
                            <div style="display: flex; gap: 6px; margin-top: 8px;">
                                <button class="btn btn-secondary" onclick="event.stopPropagation(); Storage.editCharacter('${c.id}')" style="font-size: 0.7rem; padding: 4px 8px;">编辑</button>
                                <button class="btn btn-secondary" onclick="event.stopPropagation(); Storage.deleteCharacter('${c.id}')" style="font-size: 0.7rem; padding: 4px 8px;">删除</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderGroups(content, world) {
        const groups = Data.getGroups(world.id);
        const chars = Data.getCharacters(world.id);
        
        content.innerHTML = `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                    <button class="btn" onclick="Storage.showCreateGroup()" style="font-size: 0.85rem;">➕ 创建组合</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('importGroupInput').click()" style="font-size: 0.85rem;">📥 导入组合</button>
                    <input type="file" id="importGroupInput" webkitdirectory directory multiple accept=".json" style="display: none;" onchange="Storage.importGroup(event)">
                </div>
            </div>
            
            <div class="setting-section">
                <h4>👥 角色组合 (${groups.length})</h4>
                ${groups.length === 0 ? '<div class="empty">暂无组合，请创建组合并添加角色</div>' : ''}
                ${groups.map(g => {
                    const groupChars = chars.filter(c => g.characterIds.includes(c.id));
                    return `
                        <div class="card" style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 500;">${g.name}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">
                                        ${g.description || '无描述'} · ${groupChars.length}个角色
                                    </div>
                                    ${groupChars.length > 0 ? `
                                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                                            ${groupChars.map(c => `
                                                <span class="char-tag" style="font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                                                    ${c.name}
                                                    <span onclick="Storage.removeCharFromGroup('${g.id}', '${c.id}')" style="cursor: pointer; opacity: 0.6;" title="从组合中移除">×</span>
                                                </span>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                                <div style="display: flex; gap: 6px;">
                                    <button class="btn btn-secondary" onclick="Storage.editGroup('${g.id}')" style="font-size: 0.75rem; padding: 6px 12px;">编辑</button>
                                    <button class="btn btn-secondary" onclick="Storage.addCharsToGroup('${g.id}')" style="font-size: 0.75rem; padding: 6px 12px;">➕ 角色</button>
                                    <button class="btn btn-secondary" onclick="Storage.deleteGroup('${g.id}')" style="font-size: 0.75rem; padding: 6px 10px;">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    showCreateGroup() {
        document.getElementById('modalTitle').textContent = '创建组合';
        document.getElementById('modalBody').innerHTML = `
            <div style="padding: 16px;">
                <div class="form-group">
                    <label>组合名称</label>
                    <input type="text" id="groupName" placeholder="例如：八卦组合">
                </div>
                <div class="form-group">
                    <label>描述</label>
                    <textarea id="groupDescription" placeholder="组合描述（可选）" rows="3" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text);"></textarea>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="btn" onclick="Storage.createGroup()">创建</button>
                    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                </div>
            </div>
        `;
        document.getElementById('modal').classList.add('active');
    },

    createGroup() {
        const world = Data.getCurrentWorld();
        const name = document.getElementById('groupName').value.trim();
        const description = document.getElementById('groupDescription').value.trim();
        
        if (!name) {
            alert('请输入组合名称');
            return;
        }
        
        Data.createGroup(world.id, { name, description, characterIds: [] });
        closeModal();
        this.renderStorage(document.getElementById('mainContent'));
    },

    editGroup(groupId) {
        const world = Data.getCurrentWorld();
        const group = Data.getGroup(world.id, groupId);
        
        document.getElementById('modalTitle').textContent = '编辑组合';
        document.getElementById('modalBody').innerHTML = `
            <div style="padding: 16px;">
                <div class="form-group">
                    <label>组合名称</label>
                    <input type="text" id="groupName" value="${group.name}" placeholder="组合名称">
                </div>
                <div class="form-group">
                    <label>描述</label>
                    <textarea id="groupDescription" rows="3" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">${group.description || ''}</textarea>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="btn" onclick="Storage.updateGroup('${groupId}')">保存</button>
                    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                </div>
            </div>
        `;
        document.getElementById('modal').classList.add('active');
    },

    updateGroup(groupId) {
        const world = Data.getCurrentWorld();
        const name = document.getElementById('groupName').value.trim();
        const description = document.getElementById('groupDescription').value.trim();
        
        if (!name) {
            alert('请输入组合名称');
            return;
        }
        
        Data.updateGroup(world.id, groupId, { name, description });
        closeModal();
        this.renderStorage(document.getElementById('mainContent'));
    },

    deleteGroup(groupId) {
        if (!confirm('确定要删除这个组合吗？')) return;
        
        const world = Data.getCurrentWorld();
        Data.deleteGroup(world.id, groupId);
        this.renderStorage(document.getElementById('mainContent'));
    },

    addCharsToGroup(groupId) {
        const world = Data.getCurrentWorld();
        const group = Data.getGroup(world.id, groupId);
        const chars = Data.getCharacters(world.id);
        const unassignedChars = chars.filter(c => !group.characterIds.includes(c.id));
        
        if (unassignedChars.length === 0) {
            alert('所有角色都已添加到此组合');
            return;
        }
        
        document.getElementById('modalTitle').textContent = '添加角色到组合';
        document.getElementById('modalBody').innerHTML = `
            <div style="padding: 16px;">
                <p style="margin-bottom: 12px;">选择要添加的角色：</p>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${unassignedChars.map(c => `
                        <label style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--card-bg); border-radius: 6px; margin-bottom: 8px; cursor: pointer;">
                            <input type="checkbox" class="char-select-checkbox" value="${c.id}" style="width: 18px; height: 18px;">
                            <span>${c.name}</span>
                            <span style="color: var(--text-dim); font-size: 0.8rem;">${c.role || ''}</span>
                        </label>
                    `).join('')}
                </div>
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="btn" onclick="Storage.addSelectedCharsToGroup('${groupId}')">添加</button>
                    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                </div>
            </div>
        `;
        document.getElementById('modal').classList.add('active');
    },

    addSelectedCharsToGroup(groupId) {
        const world = Data.getCurrentWorld();
        const checkboxes = document.querySelectorAll('.char-select-checkbox:checked');
        
        checkboxes.forEach(cb => {
            Data.addCharacterToGroup(world.id, groupId, cb.value);
        });
        
        closeModal();
        this.renderStorage(document.getElementById('mainContent'));
    },

    removeCharFromGroup(groupId, charId) {
        const world = Data.getCurrentWorld();
        Data.removeCharacterFromGroup(world.id, groupId, charId);
        this.renderStorage(document.getElementById('mainContent'));
    },

    showCreateCharacter() {
        document.getElementById('modalTitle').textContent = '添加角色';
        document.getElementById('modalBody').innerHTML = `
            <div style="padding: 16px; max-height: 400px; overflow-y: auto;">
                <div class="form-group">
                    <label>名字</label>
                    <input type="text" id="charName" placeholder="角色名字">
                </div>
                <div class="form-group">
                    <label>性别</label>
                    <select id="charGender">
                        <option value="女">女</option>
                        <option value="男">男</option>
                        <option value="其他">其他</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>年龄</label>
                    <input type="number" id="charAge" value="18">
                </div>
                <div class="form-group">
                    <label>角色定位</label>
                    <input type="text" id="charRole" placeholder="主角/配角/反派等">
                </div>
                <div class="form-group">
                    <label>种族</label>
                    <input type="text" id="charRace" placeholder="种族（可选）">
                </div>
                <div class="form-group">
                    <label>职业</label>
                    <input type="text" id="charOccupation" placeholder="职业（可选）">
                </div>
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="btn" onclick="Storage.createCharacter()">创建</button>
                    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                </div>
            </div>
        `;
        document.getElementById('modal').classList.add('active');
    },

    createCharacter() {
        const world = Data.getCurrentWorld();
        const config = {
            name: document.getElementById('charName').value.trim(),
            gender: document.getElementById('charGender').value,
            age: parseInt(document.getElementById('charAge').value) || 18,
            role: document.getElementById('charRole').value.trim(),
            profile: {
                race: document.getElementById('charRace').value.trim(),
                occupation: document.getElementById('charOccupation').value.trim()
            }
        };
        
        if (!config.name) {
            alert('请输入角色名字');
            return;
        }
        
        Data.createCharacter(world.id, config);
        closeModal();
        this.renderStorage(document.getElementById('mainContent'));
    },

    importCharacter(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const charData = JSON.parse(e.target.result);
                const world = Data.getCurrentWorld();
                
                if (Array.isArray(charData)) {
                    charData.forEach(c => Data.createCharacter(world.id, c));
                } else {
                    Data.createCharacter(world.id, charData);
                }
                
                alert('角色导入成功！');
                this.renderStorage(document.getElementById('mainContent'));
            } catch (err) {
                alert('导入失败：' + err.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    editCharacter(charId) {
        const world = Data.getCurrentWorld();
        const char = Data.getCharacter(world.id, charId);
        
        document.getElementById('modalTitle').textContent = '编辑角色';
        document.getElementById('modalBody').innerHTML = `
            <div style="padding: 16px; max-height: 400px; overflow-y: auto;">
                <div class="form-group">
                    <label>名字</label>
                    <input type="text" id="charName" value="${char.name}">
                </div>
                <div class="form-group">
                    <label>性别</label>
                    <select id="charGender">
                        <option value="女" ${char.gender === '女' ? 'selected' : ''}>女</option>
                        <option value="男" ${char.gender === '男' ? 'selected' : ''}>男</option>
                        <option value="其他" ${char.gender === '其他' ? 'selected' : ''}>其他</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>年龄</label>
                    <input type="number" id="charAge" value="${char.age || 18}">
                </div>
                <div class="form-group">
                    <label>角色定位</label>
                    <input type="text" id="charRole" value="${char.role || ''}">
                </div>
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="btn" onclick="Storage.updateCharacter('${charId}')">保存</button>
                    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                </div>
            </div>
        `;
        document.getElementById('modal').classList.add('active');
    },

    updateCharacter(charId) {
        const world = Data.getCurrentWorld();
        const updates = {
            name: document.getElementById('charName').value.trim(),
            gender: document.getElementById('charGender').value,
            age: parseInt(document.getElementById('charAge').value) || 18,
            role: document.getElementById('charRole').value.trim()
        };
        
        if (!updates.name) {
            alert('请输入角色名字');
            return;
        }
        
        Data.updateCharacter(world.id, charId, updates);
        closeModal();
        this.renderStorage(document.getElementById('mainContent'));
    },

    deleteCharacter(charId) {
        if (!confirm('确定要删除这个角色吗？')) return;
        
        const world = Data.getCurrentWorld();
        Data.deleteCharacter(world.id, charId);
        this.renderStorage(document.getElementById('mainContent'));
    },

    importGroup(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        const world = Data.getCurrentWorld();
        let importedCount = 0;
        let errorCount = 0;
        const importedCharIds = [];
        
        // 处理每个文件
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const charData = JSON.parse(e.target.result);
                        
                        // 创建角色
                        const char = Data.createCharacter(world.id, charData);
                        importedCharIds.push(char.id);
                        importedCount++;
                    } catch (err) {
                        console.error('导入角色失败:', err);
                        errorCount++;
                    }
                };
                reader.readAsText(file);
            }
        }
        
        // 当所有文件处理完成后
        setTimeout(() => {
            if (importedCount > 0) {
                // 创建组合
                const group = Data.createGroup(world.id, {
                    name: '导入的组合',
                    description: '从文件夹导入的角色组合',
                    characterIds: importedCharIds
                });
                
                alert(`导入成功！共导入 ${importedCount} 个角色，创建了组合 "导入的组合"`);
            } else if (errorCount > 0) {
                alert(`导入失败，有 ${errorCount} 个文件解析错误`);
            } else {
                alert('未找到有效的JSON文件');
            }
            this.renderStorage(document.getElementById('mainContent'));
        }, 1000);
        
        event.target.value = '';
    },

    editStory(archiveId, storyIndex) {
        const world = Data.getCurrentWorld();
        if (!world || !window.Story) return;
        
        const archives = Story.getArchives(world.id);
        const archive = archives.find(a => a.id === archiveId);
        if (!archive || !archive.stories) return;
        
        const story = archive.stories[storyIndex];
        if (!story) return;
        
        document.getElementById('modalTitle').textContent = '编辑故事';
        document.getElementById('modalBody').innerHTML = `
            <div style="padding: 16px; max-height: 500px; overflow-y: auto;">
                <div class="form-group">
                    <label>标题</label>
                    <input type="text" id="editStoryTitle" value="${(story.title || '').replace(/"/g, '&quot;')}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                </div>
                <div class="form-group">
                    <label>核心情节</label>
                    <textarea id="editStoryCorePlot" rows="2" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">${(story.corePlot || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                </div>
                <div class="form-group">
                    <label>全文内容</label>
                    <textarea id="editStoryContent" rows="10" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">${(story.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="btn" onclick="Storage.saveStory('${archiveId}', ${storyIndex})">保存</button>
                    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                </div>
            </div>
        `;
        document.getElementById('modal').classList.add('active');
    },

    saveStory(archiveId, storyIndex) {
        const world = Data.getCurrentWorld();
        if (!world || !window.Story) return;
        
        const archives = Story.getArchives(world.id);
        const archive = archives.find(a => a.id === archiveId);
        if (!archive || !archive.stories) return;
        
        const story = archive.stories[storyIndex];
        if (!story) return;
        
        story.title = document.getElementById('editStoryTitle').value.trim();
        story.corePlot = document.getElementById('editStoryCorePlot').value.trim();
        story.content = document.getElementById('editStoryContent').value.trim();
        
        localStorage.setItem(`story_archives_${world.id}`, JSON.stringify(archives));
        
        closeModal();
        this.viewArchiveDetails(archiveId);
    },

    deleteStory(archiveId, storyIndex) {
        const world = Data.getCurrentWorld();
        if (!world || !window.Story) return;
        
        const archives = Story.getArchives(world.id);
        const archive = archives.find(a => a.id === archiveId);
        if (!archive || !archive.stories) return;
        
        archive.stories.splice(storyIndex, 1);
        
        localStorage.setItem(`story_archives_${world.id}`, JSON.stringify(archives));
        
        this.viewArchiveDetails(archiveId);
    }
};

Storage.init();
window.showCharInfo = function(charId) {
    if (typeof Pages !== 'undefined' && Pages.showCharInfo) {
        Pages.showCharInfo(charId);
    }
};
window.Storage = Storage;
