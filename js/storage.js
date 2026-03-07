const Storage = {
    init() {
        window.renderStorage = this.renderStorage.bind(this);
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
        const story = Story.load(world.id);
        const archives = Story.getArchives(world.id);
        const level2 = Story.getLevel2Archives(world.id);
        const level3 = Story.getLevel3Archives(world.id);
        
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
    }
};

Storage.init();
window.Storage = Storage;
