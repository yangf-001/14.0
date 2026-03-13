const PromptManagerView = {
    _currentGroup: 'story',
    _currentCategory: 'storyStart',
    _currentPreset: 'default',
    
    _groups: {
        story: { name: '📖 故事生成', categories: ['storyStart', 'storyChoice', 'storyFree', 'storyContinue', 'simpleStory'] },
        choices: { name: '🎯 选项生成', categories: ['generateChoices'] },
        chat: { name: '💬 聊天对话', categories: ['chatStart', 'chatContinue', 'multiCharChat'] },
        assistant: { name: '🤖 辅助功能', categories: ['diary', 'sceneSummary', 'storyTitle', 'updateStats', 'extractItems', 'storySummary'] },
        settings: { name: '⚙️ 设置', categories: ['stylePreset', 'stageDescription', 'intimateInteraction'] }
    },
    
    _categoryInfo: {
        storyStart: { name: '故事开头', desc: '生成故事开头' },
        storyChoice: { name: '故事继续', desc: '根据选择继续' },
        storyFree: { name: '自由发展', desc: '自由发展剧情' },
        storyContinue: { name: '继续故事', desc: '继续故事发展' },
        simpleStory: { name: '小故事', desc: '小故事模式' },
        generateChoices: { name: '选项生成', desc: '生成剧情选项' },
        chatStart: { name: '聊天开场', desc: '聊天开场白' },
        chatContinue: { name: '聊天继续', desc: '继续聊天' },
        multiCharChat: { name: '多人对话', desc: '多人对话' },
        intimateInteraction: { name: '亲密互动', desc: '亲密互动' },
        diary: { name: '日记生成', desc: '生成角色日记' },
        sceneSummary: { name: '场景摘要', desc: '场景摘要' },
        storyTitle: { name: '故事标题', desc: '生成标题' },
        updateStats: { name: '更新属性', desc: '分析属性变化' },
        extractItems: { name: '提取物品', desc: '提取物品' },
        storySummary: { name: '故事摘要', desc: '故事摘要' },
        stylePreset: { name: '风格预设', desc: '写作风格' },
        stageDescription: { name: '阶段描写', desc: '阶段规则' }
    },
    
    render() {
        const main = document.getElementById('mainContent');
        if (!main) return;
        
        main.innerHTML = `
            <div style="padding: 20px; max-width: 1000px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                    <h2 style="margin: 0;">📋 提示词管理</h2>
                    <div>
                        <button class="btn btn-secondary" onclick="PromptManagerView.check()">🔍 检测</button>
                        <button class="btn" onclick="PromptManagerView.loadDefaults()">📥 一键载入</button>
                        <button class="btn btn-secondary" onclick="PromptManagerView.exportAll()">📤 导出</button>
                    </div>
                </div>
                
                <div id="contentArea"></div>
            </div>
        `;
        
        this._renderGroupView();
    },
    
    _renderGroupView() {
        const area = document.getElementById('contentArea');
        
        area.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
                ${Object.entries(this._groups).map(([key, g]) => `
                    <div onclick="PromptManagerView._showGroup('${key}')" 
                         style="background: var(--card); border-radius: 8px; padding: 16px; cursor: pointer; transition: transform 0.2s;">
                        <div style="font-size: 24px; margin-bottom: 8px;">${g.name.split(' ')[0]}</div>
                        <div style="font-weight: 500;">${g.name.split(' ').slice(1).join(' ')}</div>
                        <div style="font-size: 12px; color: var(--text-dim); margin-top: 4px;">${g.categories.length} 个模板</div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    _showGroup(groupKey) {
        this._currentGroup = groupKey;
        const group = this._groups[groupKey];
        const area = document.getElementById('contentArea');
        
        area.innerHTML = `
            <div style="margin-bottom: 16px;">
                <button class="btn btn-secondary" onclick="PromptManagerView._renderGroupView()">← 返回</button>
                <span style="margin-left: 12px; font-size: 18px; font-weight: 500;">${group.name}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                ${group.categories.map(cat => {
                    const info = this._categoryInfo[cat] || {};
                    const plugin = window.PromptManagerPlugin;
                    const presetData = plugin?.getPresets(cat);
                    const hasCustom = presetData?.presets?.some(p => plugin.loadCustomTemplate(cat, p.id));
                    return `
                        <div onclick="PromptManagerView._showCategory('${cat}')" 
                             style="background: var(--card); border-radius: 8px; padding: 14px; cursor: pointer;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-weight: 500;">${info.name}</span>
                                ${hasCustom ? '<span style="color: var(--primary);">✏️</span>' : ''}
                            </div>
                            <div style="font-size: 12px; color: var(--text-dim); margin-top: 4px;">${info.desc}</div>
                            <div style="font-size: 11px; color: var(--text-dim); margin-top: 8px;">${presetData?.presets?.length || 1} 个预设</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    _showCategory(cat) {
        this._currentCategory = cat;
        this._currentPreset = 'default';
        const info = this._categoryInfo[cat] || {};
        const plugin = window.PromptManagerPlugin;
        const presetData = plugin?.getPresets(cat);
        const area = document.getElementById('contentArea');
        
        if (!presetData) {
            area.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-dim);">加载失败</div>';
            return;
        }
        
        area.innerHTML = `
            <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
                <button class="btn btn-secondary" onclick="PromptManagerView._showGroup('${this._currentGroup}')">← 返回</button>
                <span style="font-size: 18px; font-weight: 500;">${info.name}</span>
                <span style="font-size: 13px; color: var(--text-dim);">${info.desc}</span>
            </div>
            
            <div style="background: var(--card); border-radius: 8px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <select id="presetSelect" style="padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        ${presetData.presets.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                    <div>
                        <button class="btn btn-secondary" onclick="PromptManagerView._reset()">↩️ 重置</button>
                        <button class="btn" onclick="PromptManagerView._save()">💾 保存</button>
                    </div>
                </div>
                
                <textarea id="templateContent" style="width: 100%; height: 320px; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-family: monospace; font-size: 13px; line-height: 1.5; resize: vertical;"></textarea>
                
                <div id="stageSection" style="margin-top: 16px;"></div>
            </div>
        `;
        
        document.getElementById('presetSelect').onchange = (e) => {
            this._currentPreset = e.target.value;
            this._loadTemplate();
        };
        
        this._loadTemplate();
        this._renderStageSection();
    },
    
    _loadTemplate() {
        const plugin = window.PromptManagerPlugin;
        let template = plugin?.getTemplate(this._currentCategory, this._currentPreset) || '';
        if (typeof template === 'object' && template.template) template = template.template;
        
        const textarea = document.getElementById('templateContent');
        if (textarea) textarea.value = template;
    },
    
    _renderStageSection() {
        const section = document.getElementById('stageSection');
        if (!section || this._currentCategory !== 'stageDescription') return;
        
        const plugin = window.PromptManagerPlugin;
        section.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                <div>
                    <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px;">🟢 日常模式 (综合属性 < 60)</div>
                    <textarea id="stage1" style="width: 100%; height: 80px; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 12px;">${plugin?.getStageDescription(1) || ''}</textarea>
                </div>
                <div>
                    <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px;">🔴 色色模式 (综合属性 ≥ 60)</div>
                    <textarea id="stage2" style="width: 100%; height: 80px; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 12px;">${plugin?.getStageDescription(2) || ''}</textarea>
                </div>
            </div>
        `;
    },
    
    _save() {
        const content = document.getElementById('templateContent')?.value;
        if (!content) return;
        
        const plugin = window.PromptManagerPlugin;
        if (plugin?.saveCustomTemplate(this._currentCategory, this._currentPreset, content)) {
            this._toast('✅ 已保存');
        }
        
        if (this._currentCategory === 'stageDescription') {
            const s1 = document.getElementById('stage1')?.value;
            const s2 = document.getElementById('stage2')?.value;
            if (s1 && s2) {
                localStorage.setItem(`prompt_stageDescription_${this._currentPreset}_stages`, JSON.stringify({ 1: s1, 2: s2 }));
            }
        }
    },
    
    _reset() {
        if (!confirm('确定重置为默认模板？')) return;
        const plugin = window.PromptManagerPlugin;
        plugin?.deleteCustomTemplate(this._currentCategory, this._currentPreset);
        this._loadTemplate();
        this._toast('✅ 已重置');
    },
    
    exportAll() {
        const plugin = window.PromptManagerPlugin;
        const data = { version: '1.0', exportedAt: new Date().toISOString(), templates: {} };
        
        for (const [cat, d] of Object.entries(plugin?.getPresets() || {})) {
            data.templates[cat] = { name: d.name, presets: {} };
            for (const p of d.presets) {
                const t = plugin.getTemplate(cat, p.id);
                if (t) data.templates[cat].presets[p.id] = { name: p.name, template: t };
            }
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `prompts-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        this._toast('✅ 已导出');
    },
    
    import() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (!data.templates) throw new Error('格式错误');
                    const plugin = window.PromptManagerPlugin;
                    let count = 0;
                    for (const [cat, cd] of Object.entries(data.templates)) {
                        if (cd.presets) {
                            for (const [pid, pd] of Object.entries(cd.presets)) {
                                if (pd.template) {
                                    plugin?.saveCustomTemplate(cat, pid, pd.template);
                                    count++;
                                }
                            }
                        }
                    }
                    this._toast(`✅ 导入 ${count} 个模板`);
                    this._renderGroupView();
                } catch (err) {
                    this._toast('❌ 导入失败', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },
    
    _toast(msg, type = 'success') {
        const t = document.createElement('div');
        t.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;background:${type === 'error' ? '#e74c3c' : 'var(--primary)'};color:white;font-size:14px;z-index:10000;`;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2000);
    },
    
    check() {
        const plugin = window.PromptManagerPlugin;
        if (!plugin) {
            this._toast('❌ 提示词管理插件未加载', 'error');
            return;
        }
        
        const result = plugin.checkTemplates();
        const area = document.getElementById('contentArea');
        
        if (!area) return;
        
        const statusIcon = result.success ? '✅' : '⚠️';
        const statusColor = result.success ? 'var(--primary)' : '#e74c3c';
        
        area.innerHTML = `
            <div style="background: var(--card); border-radius: 8px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">${statusIcon} 模板检测报告</h3>
                    <button class="btn btn-secondary" onclick="PromptManagerView._renderGroupView()">← 返回</button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;">
                    <div style="background: var(--bg); border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: ${statusColor};">${result.loaded}</div>
                        <div style="font-size: 12px; color: var(--text-dim);">已加载</div>
                    </div>
                    <div style="background: var(--bg); border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold;">${result.total}</div>
                        <div style="font-size: 12px; color: var(--text-dim);">总数</div>
                    </div>
                    <div style="background: var(--bg); border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #f39c12;">${result.custom}</div>
                        <div style="font-size: 12px; color: var(--text-dim);">自定义</div>
                    </div>
                    <div style="background: var(--bg); border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: ${result.missing.length > 0 ? '#e74c3c' : 'var(--primary)'};">${result.missing.length}</div>
                        <div style="font-size: 12px; color: var(--text-dim);">缺失</div>
                    </div>
                </div>
                
                ${result.missing.length > 0 ? `
                    <div style="background: #fff3cd; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
                        <strong>⚠️ 缺失的模板：</strong>
                        <div style="margin-top: 8px; font-family: monospace; font-size: 12px;">
                            ${result.missing.map(m => `<span style="background: var(--bg); padding: 2px 6px; border-radius: 4px; margin: 2px; display: inline-block;">${m}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">详细列表</div>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${Object.entries(result.details).map(([cat, data]) => `
                        <div style="border-bottom: 1px solid var(--border); padding: 8px 0;">
                            <div style="font-weight: 500;">${data.name}</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
                                ${Object.entries(data.presets).map(([pid, p]) => `
                                    <span style="background: var(--bg); padding: 4px 8px; border-radius: 4px; font-size: 12px; ${p.status === 'missing' ? 'color: #e74c3c;' : ''} ${p.custom ? 'border-left: 3px solid #f39c12;' : ''}">
                                        ${p.status === 'ok' ? '✅' : '❌'} ${p.name}${p.custom ? ' ✏️' : ''} (${p.length}字)
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    loadDefaults() {
        const plugin = window.PromptManagerPlugin;
        if (!plugin) {
            this._toast('❌ 提示词管理插件未加载', 'error');
            return;
        }
        
        if (!confirm('确定要一键载入所有默认模板吗？\n\n已存在的自定义模板不会被覆盖。')) {
            return;
        }
        
        const result = plugin.loadDefaultTemplates();
        
        this._toast(`✅ 已载入 ${result.loaded} 个模板，跳过 ${result.skipped} 个已存在`);
        this._renderGroupView();
    }
};
