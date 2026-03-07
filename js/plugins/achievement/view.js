View.register('achievement.main', function(worldId) {
    const plugin = PluginSystem.get('achievement');
    const achievements = plugin?.getAchievements(worldId) || [];

    if (achievements.length === 0) {
        return `
            <div class="achievement-header">
                <button class="btn btn-secondary" onclick="ViewCallbacks.achievement.showAdd()">+ 添加成就</button>
                <button class="btn btn-secondary" onclick="ViewCallbacks.achievement.showLibrary()">📚 成就库</button>
            </div>
            <div class="empty">暂无成就</div>
        `;
    }

    const active = achievements.filter(a => a.status === 'active');
    const completed = achievements.filter(a => a.status === 'completed');

    let html = `
        <div class="achievement-header">
            <button class="btn btn-secondary" onclick="ViewCallbacks.achievement.showAdd()">+ 添加成就</button>
            <button class="btn btn-secondary" onclick="ViewCallbacks.achievement.showLibrary()">📚 成就库</button>
        </div>
    `;

    if (active.length) {
        html += '<div class="achievement-section"><h4>进行中</h4>';
        html += active.map(a => {
            const pct = Math.round((a.progress / a.maxProgress) * 100);
            return `
                <div class="achievement-card">
                    <div class="achievement-icon">${a.icon || '🏆'}</div>
                    <div class="achievement-content">
                        <div class="achievement-header-row">
                            <span class="achievement-title">${a.name}</span>
                            <span class="achievement-percent">${pct}%</span>
                        </div>
                        <div class="achievement-desc">${a.description || ''}</div>
                        <div class="achievement-progress-bar">
                            <div class="achievement-progress-fill" style="width: ${pct}%"></div>
                        </div>
                        <div class="achievement-count">${a.progress}/${a.maxProgress}</div>
                    </div>
                </div>
            `;
        }).join('');
        html += '</div>';
    }

    if (completed.length) {
        html += '<div class="achievement-section"><h4>已完成</h4>';
        html += completed.map(a => `
            <div class="achievement-card completed">
                <div class="achievement-icon">${a.icon || '🏆'}</div>
                <div class="achievement-content">
                    <span class="achievement-title">✅ ${a.name}</span>
                    <div class="achievement-desc">${a.description || ''}</div>
                </div>
            </div>
        `).join('');
        html += '</div>';
    }

    return html;
});

View.register('achievement.add', function() {
    return `
        <div class="form-group">
            <label>成就名称</label>
            <input type="text" id="achievementName" placeholder="例如：初次冒险">
        </div>
        <div class="form-group">
            <label>成就描述</label>
            <textarea id="achievementDesc" rows="2" placeholder="成就详情..."></textarea>
        </div>
        <div class="form-group">
            <label>目标进度</label>
            <input type="number" id="achievementMax" value="1" min="1">
        </div>
        <button class="btn" onclick="ViewCallbacks.achievement.add()">添加</button>
    `;
});

View.register('achievement.library', function() {
    const plugin = PluginSystem.get('achievement');
    const library = plugin?.getAchievementLibrary() || [];

    if (library.length === 0) {
        return `
            <div class="empty">成就库为空</div>
            <button class="btn" onclick="ViewCallbacks.achievement.loadAllPresets()">📥 加载全部预设成就</button>
        `;
    }

    const typeGroups = {};
    library.forEach(a => {
        const type = a.type || 'misc';
        if (!typeGroups[type]) typeGroups[type] = [];
        typeGroups[type].push(a);
    });

    const typeNames = {
        'story': '故事成就',
        'character': '角色成就',
        'interaction': '互动成就',
        'item': '物品成就',
        'system': '系统成就',
        'achievement': '成就成就',
        'misc': '特殊成就',
        'adult': '成人互动'
    };

    let html = '<div class="achievement-library">';
    html += `<div style="margin-bottom: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn" onclick="ViewCallbacks.achievement.loadAllPresets()">📥 重新加载全部预设</button>
        <button class="btn btn-secondary" onclick="ViewCallbacks.achievement.addAllToWorld()">➕ 添加全部到当前世界</button>
    </div>`;
    for (const [type, items] of Object.entries(typeGroups)) {
        html += `<div class="library-section"><h4>${typeNames[type] || type}</h4>`;
        html += items.map(a => `
            <div class="library-item">
                <span class="library-icon">${a.icon || '🏆'}</span>
                <div class="library-info">
                    <span class="library-name">${a.name}</span>
                    <span class="library-desc">${a.description || ''}</span>
                </div>
                <button class="btn btn-sm" onclick="ViewCallbacks.achievement.addFromLibrary('${a.id}')">添加</button>
            </div>
        `).join('');
        html += '</div>';
    }
    html += '</div>';

    return html;
});

ViewCallbacks.achievement = {
    showAdd() {
        document.getElementById('modalTitle').textContent = '添加成就';
        document.getElementById('modalBody').innerHTML = View.render('achievement.add');
        document.getElementById('modal').classList.add('active');
    },

    showLibrary() {
        const plugin = PluginSystem.get('achievement');
        plugin?._initDefaultLibrary(true).then(() => {
            document.getElementById('modalTitle').textContent = '成就库';
            document.getElementById('modalBody').innerHTML = View.render('achievement.library');
            document.getElementById('modal').classList.add('active');
        });
    },

    add() {
        const world = Data.getCurrentWorld();
        const name = document.getElementById('achievementName').value;
        if (!name) return;

        const plugin = PluginSystem.get('achievement');
        plugin?.addAchievement(world.id, {
            name,
            description: document.getElementById('achievementDesc').value,
            maxProgress: parseInt(document.getElementById('achievementMax').value) || 1,
            type: 'misc',
            icon: '🏆'
        });

        document.getElementById('modalBody').innerHTML = View.render('achievement.main', world.id);
    },

    addFromLibrary(achievementId) {
        const world = Data.getCurrentWorld();
        const plugin = PluginSystem.get('achievement');
        const library = plugin?.getAchievementLibrary() || [];
        const achievement = library.find(a => a.id === achievementId);

        if (achievement && world) {
            plugin?.addAchievement(world.id, {
                name: achievement.name,
                description: achievement.description,
                type: achievement.type,
                icon: achievement.icon,
                maxProgress: 1
            });
            alert('已添加: ' + achievement.name);
        }
    },

    async loadAllPresets() {
        const plugin = PluginSystem.get('achievement');
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = '加载中...';
        
        try {
            await plugin._initDefaultLibrary(true);
            document.getElementById('modalBody').innerHTML = View.render('achievement.library');
        } catch (e) {
            alert('加载失败: ' + e.message);
            btn.disabled = false;
            btn.textContent = '📥 加载全部预设成就';
        }
    },

    addAllToWorld() {
        const world = Data.getCurrentWorld();
        if (!world) {
            alert('请先选择一个世界');
            return;
        }

        const plugin = PluginSystem.get('achievement');
        const library = plugin?.getAchievementLibrary() || [];
        
        if (library.length === 0) {
            alert('成就库为空，请先加载预设成就');
            return;
        }

        const existing = plugin?.getAchievements(world.id) || [];
        const existingNames = existing.map(e => e.name);
        
        let addedCount = 0;
        library.forEach(ach => {
            if (!existingNames.includes(ach.name)) {
                plugin?.addAchievement(world.id, {
                    name: ach.name,
                    description: ach.description,
                    type: ach.type,
                    icon: ach.icon,
                    maxProgress: 1
                });
                addedCount++;
            }
        });

        alert(`成功添加 ${addedCount} 个成就到当前世界！`);
        document.getElementById('modal').classList.remove('active');
    }
};

window.ViewCallbacks = window.ViewCallbacks || {};
Object.assign(window.ViewCallbacks, ViewCallbacks);
