const AdultTagsViewRenderer = {
    render(key, ...args) {
        const renders = {
            'adultTags.main': this.renderMain.bind(this),
            'adultTags.library': this.renderLibrary.bind(this),
            'adultTags.arousal': this.renderArousal.bind(this),
            'adultTags.scale': this.renderScale.bind(this),
            'adultTags.tagAdd': this.renderTagAdd.bind(this),
            'adultTags.import': this.renderImport.bind(this)
        };
        
        if (renders[key]) {
            return renders[key](...args);
        }
        return '<div>未找到视图</div>';
    },

    renderMain(worldId) {
        const plugin = window.AdultTagsPlugin;
        if (!plugin) return '<div class="empty">插件未加载</div>';
        
        const isMobile = window.innerWidth <= 900;
        const characters = Data.getCharacters(worldId) || [];
        const settings = plugin.getSettings();
        const cooldown = plugin.getCooldownList(worldId);
        const tags = plugin.getTagLibrary();

        const charArousalHtml = characters.map(char => {
            const arousal = plugin.getArousal(worldId, char.id);
            const stage = plugin.getStage(arousal, worldId);
            const stageName = plugin.getStageName(stage);
            const isPlayer = char.isPlayer ? '⭐' : '';
            return `
                <div class="char-arousal-item">
                    <span class="char-name">${isPlayer}${char.name}</span>
                    <div class="arousal-bar-container" style="flex:1;margin:0 10px;">
                        <div class="arousal-bar" style="width: ${arousal}%"></div>
                    </div>
                    <span class="arousal-value">${arousal}/100 (${stageName})</span>
                    <button class="btn btn-sm" onclick="AdultTagsView.increaseArousal('${char.id}', 10)">+10</button>
                    <button class="btn btn-sm" onclick="AdultTagsView.increaseArousal('${char.id}', -10)">-10</button>
                    <button class="btn btn-sm" onclick="AdultTagsView.resetArousal('${char.id}')">重置</button>
                </div>
            `;
        }).join('');

        const scaleButtons = settings.scales.map(s => {
            const currentScale = plugin.getScale(worldId);
            return `<button class="scale-btn ${s === currentScale ? 'active' : ''}" onclick="AdultTagsView.setScale('${s}')">${s}</button>`;
        }).join('');

        return `
            <div class="adult-tags-panel">
                <div class="arousal-section">
                    <h3>🎭 性欲（各角色）</h3>
                    <div class="char-arousal-list">
                        ${charArousalHtml}
                    </div>
                </div>

                <div class="scale-section">
                    <h3>📊 尺度级别</h3>
                    <div class="scale-buttons">
                        ${scaleButtons}
                    </div>
                </div>

                <div class="cooldown-section">
                    <h3>🔄 冷却列表</h3>
                    <div class="cooldown-tags">
                        ${cooldown.length > 0 ? cooldown.map(t => `<span class="tag">${t}</span>`).join('') : '<span class="empty">暂无</span>'}
                    </div>
                    <button class="btn btn-secondary" onclick="AdultTagsView.clearCooldown()">清空冷却</button>
                </div>

                <div class="stats-section">
                    <h3>📚 标签库</h3>
                    <div class="stats-info">
                        <p>当前标签数量：<strong>${tags.length}</strong></p>
                        <p>阶段1（暗示）：<strong>${tags.filter(t => t.阶段 === 1).length}</strong></p>
                        <p>阶段2（试探）：<strong>${tags.filter(t => t.阶段 === 2).length}</strong></p>
                        <p>阶段3（完全放开）：<strong>${tags.filter(t => t.阶段 === 3).length}</strong></p>
                    </div>
                    <div class="stats-actions">
                        <button class="btn btn-primary" onclick="AdultTagsView.showAddTag()">添加标签</button>
                        <button class="btn btn-secondary" onclick="AdultTagsView.showImportTags()">导入标签</button>
                        <button class="btn btn-secondary" onclick="AdultTagsView.testRandomTags()">随机抽取</button>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>⚙️ 系统设置</h3>
                    <div class="settings-info">
                        <label>
                            <input type="checkbox" id="userConfirm" ${settings.userConfirm !== false ? 'checked' : ''} onchange="AdultTagsView.saveSettings()">
                            触发时弹出确认对话框（让用户选择是否添加成人内容）
                        </label>
                        <label>
                            性欲增量（每次继续故事后）：
                            <input type="number" id="arousalIncrease" value="${settings.arousalIncrease || 15}" min="5" max="50" onchange="AdultTagsView.saveSettings()">
                        </label>
                        <label>
                            冷却数量：
                            <input type="number" id="cooldownCount" value="${settings.cooldownCount}" min="1" max="10" onchange="AdultTagsView.saveSettings()">
                        </label>
                    </div>
                    <button class="btn btn-secondary" onclick="AdultTagsView.saveSettings()">保存设置</button>
                </div>
            </div>
        `;
    },

    renderArousal(worldId) {
        const plugin = window.AdultTagsPlugin;
        if (!plugin) return '';
        
        const arousal = plugin.getArousal(worldId);
        const stage = plugin.getStage(arousal);
        const stageName = plugin.getStageName(stage);
        
        return `
            <div class="arousal-mini">
                <div class="arousal-bar-mini" style="width: ${arousal}%"></div>
                <span class="arousal-text">${arousal}/100 (${stageName})</span>
            </div>
        `;
    },

    renderScale(worldId) {
        const plugin = window.AdultTagsPlugin;
        if (!plugin) return '';
        
        const scale = plugin.getScale(worldId);
        const settings = plugin.getSettings();
        
        return `
            <div class="scale-selector">
                ${settings.scales.map(s => `
                    <button class="scale-btn-mini ${s === scale ? 'active' : ''}" 
                            onclick="AdultTagsView.setScale('${s}')">${s}</button>
                `).join('')}
            </div>
        `;
    },

    renderTagAdd() {
        return `
            <div class="tag-add-form">
                <h3>添加新标签</h3>
                <div class="form-group">
                    <label>玩法描述：</label>
                    <input type="text" id="tagContent" placeholder="例如：地铁急刹，黄瓜顶进阴道">
                </div>
                <div class="form-group">
                    <label>触发条件（逗号分隔）：</label>
                    <input type="text" id="tagTriggers" placeholder="例如：地铁, 通勤, 拥挤">
                </div>
                <div class="form-group">
                    <label>阶段：</label>
                    <select id="tagStage">
                        <option value="1">1 - 暗示</option>
                        <option value="2">2 - 试探</option>
                        <option value="3">3 - 完全放开</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>尺度：</label>
                    <select id="tagScale">
                        <option value="轻">轻</option>
                        <option value="中">中</option>
                        <option value="重">重</option>
                        <option value="极限">极限</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>权重（0-1）：</label>
                    <input type="number" id="tagWeight" value="0.5" min="0" max="1" step="0.1">
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="AdultTagsView.addTag()">添加</button>
                    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                </div>
            </div>
        `;
    },

    renderLibrary(worldId) {
        const plugin = window.AdultTagsPlugin;
        if (!plugin) return '<div class="empty">插件未加载</div>';
        
        const tags = plugin.getTagLibrary();
        
        if (tags.length === 0) {
            return `
                <div class="empty">
                    <p>标签库为空</p>
                    <button class="btn btn-primary" onclick="AdultTagsView.showAddTag()">添加第一个标签</button>
                    <button class="btn btn-secondary" onclick="AdultTagsView.showImportTags()" style="margin-top: 8px;">导入标签文件</button>
                </div>
            `;
        }
        
        const tagsByStage = {
            1: tags ? tags.filter(t => t.阶段 === 1) : [],
            2: tags ? tags.filter(t => t.阶段 === 2) : [],
            3: tags ? tags.filter(t => t.阶段 === 3) : []
        };
        
        return `
            <div class="tag-library">
                <h3>阶段1 - 暗示（${tagsByStage[1] ? tagsByStage[1].length : 0}个）</h3>
                <div class="tag-list">
                    ${tagsByStage[1] ? tagsByStage[1].map(t => `<span class="tag" title="权重:${t.权重}">${t.内容}</span>`).join('') : ''}
                </div>
                
                <h3>阶段2 - 试探（${tagsByStage[2] ? tagsByStage[2].length : 0}个）</h3>
                <div class="tag-list">
                    ${tagsByStage[2] ? tagsByStage[2].map(t => `<span class="tag" title="权重:${t.权重}">${t.内容}</span>`).join('') : ''}
                </div>
                
                <h3>阶段3 - 完全放开（${tagsByStage[3] ? tagsByStage[3].length : 0}个）</h3>
                <div class="tag-list">
                    ${tagsByStage[3] ? tagsByStage[3].map(t => `<span class="tag" title="权重:${t.权重}">${t.内容}</span>`).join('') : ''}
                </div>
            </div>
        `;
    },

    renderImport() {
        return `
            <div class="tag-import-form">
                <h3>导入标签文件</h3>
                <p>选择一个标签文件（.txt格式，包含JSON数据）</p>
                <div class="form-group">
                    <input type="file" id="tagFile" accept=".txt">
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="AdultTagsView.importTags()">导入</button>
                    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                </div>
            </div>
        `;
    }
};

const AdultTagsView = {
    refresh() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const content = AdultTagsViewRenderer.render('adultTags.main', world.id);
        const container = document.getElementById('adultTagsContent');
        if (container) {
            container.innerHTML = content;
        }
    },

    setScale(scale) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const plugin = window.AdultTagsPlugin;
        if (plugin) {
            plugin.setScale(world.id, scale);
            this.refresh();
        }
    },

    increaseArousal(charId, amount) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const plugin = window.AdultTagsPlugin;
        if (plugin) {
            plugin.increaseArousal(world.id, charId, amount);
            this.refresh();
        }
    },

    resetArousal(charId = null) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const plugin = window.AdultTagsPlugin;
        if (plugin) {
            const chars = Data.getCharacters(world.id) || [];
            if (charId) {
                const char = chars.find(c => String(c.id) === String(charId));
                if (char && char.stats) {
                    char.stats.arousal = 0;
                    Data.updateCharacter(world.id, char.id, char);
                }
            } else {
                for (const char of chars) {
                    if (char.stats) {
                        char.stats.arousal = 0;
                        Data.updateCharacter(world.id, char.id, char);
                    }
                }
            }
            this.refresh();
        }
    },

    clearCooldown() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const plugin = window.AdultTagsPlugin;
        if (plugin) {
            plugin.clearCooldown(world.id);
            this.refresh();
        }
    },

    showAddTag() {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modal = document.getElementById('modal');
        
        if (modalTitle && modalBody && modal) {
            modalTitle.textContent = '添加标签';
            modalBody.innerHTML = AdultTagsViewRenderer.render('adultTags.tagAdd');
            modal.classList.add('active');
        }
    },

    addTag() {
        const content = document.getElementById('tagContent')?.value.trim();
        const triggers = document.getElementById('tagTriggers')?.value.trim();
        const stage = parseInt(document.getElementById('tagStage')?.value) || 1;
        const scale = document.getElementById('tagScale')?.value || '中';
        const weight = parseFloat(document.getElementById('tagWeight')?.value) || 0.5;
        
        if (!content) {
            alert('请输入玩法描述');
            return;
        }
        
        const plugin = window.AdultTagsPlugin;
        if (plugin) {
            plugin.addTag({
                内容: content,
                触发条件: triggers ? triggers.split(',').map(t => t.trim()) : [],
                阶段: stage,
                尺度: scale,
                权重: weight
            });
            
            closeModal();
            this.refresh();
        }
    },

    testRandomTags() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const plugin = window.AdultTagsPlugin;
        if (plugin) {
            const tags = plugin.selectRandomTags(world.id, 3);
            alert('随机抽取的标签：\n\n' + tags.join('\n'));
            this.refresh();
        }
    },

    saveSettings() {
        const arousalIncrease = parseInt(document.getElementById('arousalIncrease')?.value) || 15;
        const cooldownCount = parseInt(document.getElementById('cooldownCount')?.value) || 3;
        const userConfirm = document.getElementById('userConfirm')?.checked ?? true;
        
        const plugin = window.AdultTagsPlugin;
        if (plugin) {
            const settings = plugin.getSettings();
            settings.arousalIncrease = arousalIncrease;
            settings.cooldownCount = cooldownCount;
            settings.userConfirm = userConfirm;
            plugin.saveSettings(settings);
            this.refresh();
        }
    },

    showImportTags() {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modal = document.getElementById('modal');
        
        if (modalTitle && modalBody && modal) {
            modalTitle.textContent = '导入标签文件';
            modalBody.innerHTML = AdultTagsViewRenderer.render('adultTags.import');
            modal.classList.add('active');
        }
    },

    importTags() {
        const fileInput = document.getElementById('tagFile');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            alert('请选择一个标签文件');
            return;
        }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const data = JSON.parse(text);
                
                let tags = [];
                if (data.tags && Array.isArray(data.tags)) {
                    tags = data.tags;
                } else if (Array.isArray(data)) {
                    tags = data;
                }
                
                if (tags.length === 0) {
                    alert('文件中没有标签数据');
                    return;
                }
                
                const plugin = window.AdultTagsPlugin;
                if (plugin) {
                    const importedCount = plugin.importTags(tags);
                    
                    alert(`成功导入 ${importedCount} 个标签（已过滤重复标签）`);
                    closeModal();
                    this.refresh();
                }
            } catch (error) {
                alert('文件解析失败，请确保文件格式正确');
                console.error('导入标签失败:', error);
            }
        };
        
        reader.onerror = () => {
            alert('文件读取失败');
        };
        
        reader.readAsText(file, 'UTF-8');
    }
};

window.AdultTagsViewRenderer = AdultTagsViewRenderer;

View.register('adultTags.main', function(worldId) {
    return AdultTagsViewRenderer.render('adultTags.main', worldId);
});

View.register('adultTags.library', function(worldId) {
    return AdultTagsViewRenderer.render('adultTags.library', worldId);
});

View.register('adultTags.scale', function(worldId) {
    return AdultTagsViewRenderer.render('adultTags.scale', worldId);
});

View.register('adultTags.tagAdd', function(worldId) {
    return AdultTagsViewRenderer.render('adultTags.tagAdd', worldId);
});
window.AdultTagsView = AdultTagsView;
