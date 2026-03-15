const PromptManagerView = {
    _currentGroup: 'story',
    _currentCategory: 'storyStart',
    _currentPreset: 'default',
    
    _groups: {
        story: { name: '📖 故事生成', categories: ['storyStart', 'storyChoice', 'storyFree', 'storyContinue', 'simpleStory'] },
        choices: { name: '🎯 选项生成', categories: ['generateChoices'] },
        chat: { name: '💬 聊天对话', categories: ['chatStart', 'chatContinue', 'multiCharChat'] },
        assistant: { name: '🤖 辅助功能', categories: ['diary', 'sceneSummary', 'storyTitle', 'updateStats', 'extractItems', 'storySummary'] },
        settings: { name: '⚙️ 设置', categories: [] }
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
        diary: { name: '日记生成', desc: '生成角色日记' },
        sceneSummary: { name: '场景摘要', desc: '场景摘要' },
        storyTitle: { name: '故事标题', desc: '生成标题' },
        updateStats: { name: '更新属性', desc: '分析属性变化' },
        extractItems: { name: '提取物品', desc: '提取物品' },
        storySummary: { name: '故事摘要', desc: '故事摘要' }
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
                        <button class="btn" onclick="PromptManagerView.import()">📥 导入</button>
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
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
                    <select id="presetSelect" style="padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        ${presetData.presets.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="PromptManagerView._copyTemplate()">📋 复制</button>
                        <button class="btn btn-secondary" onclick="PromptManagerView._preview()">👁️ 预览</button>
                        <button class="btn btn-secondary" onclick="PromptManagerView._reset()">↩️ 重置</button>
                        <button class="btn" onclick="PromptManagerView._save()">💾 保存</button>
                    </div>
                </div>
                
                <div id="modeSections"></div>
                
                <textarea id="templateContent" style="display: none;"></textarea>
                
                <div id="stageSection" style="margin-top: 16px;"></div>
            </div>
        `;
        
        document.getElementById('presetSelect').onchange = (e) => {
            this._currentPreset = e.target.value;
            this._loadTemplate();
        };
        
        this._loadTemplate();
    },
    
    _loadTemplate() {
        const plugin = window.PromptManagerPlugin;
        const templateData = plugin?._templates[this._currentCategory]?.[this._currentPreset];
        
        const textarea = document.getElementById('templateContent');
        if (textarea) textarea.value = JSON.stringify(templateData);
        
        this._renderModeSections(templateData);
    },
    
    _renderModeSections(templateData) {
        const container = document.getElementById('modeSections');
        if (!container) return;
        
        const template = templateData?.template;
        if (!template) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-dim);">模板加载失败</div>';
            return;
        }
        
        const hasTwoModes = template.日常模式 && template.色色模式;
        
        if (hasTwoModes) {
            container.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">🟢 日常模式</div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px;">描述：</div>
                        <textarea id="templateDescription_daily" style="width: 100%; height: 80px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; resize: vertical;">${template.日常模式?.描述 || ''}</textarea>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px;">限制：</div>
                        <textarea id="templateRestriction_daily" style="width: 100%; height: 60px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; resize: vertical;">${template.日常模式?.限制 || ''}</textarea>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <div style="font-size: 13px; font-weight: 500;">词条：</div>
                            <button class="btn btn-secondary" onclick="PromptManagerView._addKeyword('daily')" style="font-size: 12px; padding: 4px 8px;">➕ 添加词条</button>
                        </div>
                        <div id="keywordsContainer_daily" style="display: flex; flex-direction: column; gap: 8px;">
                            ${this._renderKeywords(template.日常模式?.词条 || [], 'daily')}
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">🔴 色色模式</div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px;">描述：</div>
                        <textarea id="templateDescription_erotic" style="width: 100%; height: 80px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; resize: vertical;">${template.色色模式?.描述 || ''}</textarea>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px;">限制：</div>
                        <textarea id="templateRestriction_erotic" style="width: 100%; height: 60px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; resize: vertical;">${template.色色模式?.限制 || ''}</textarea>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <div style="font-size: 13px; font-weight: 500;">词条：</div>
                            <button class="btn btn-secondary" onclick="PromptManagerView._addKeyword('erotic')" style="font-size: 12px; padding: 4px 8px;">➕ 添加词条</button>
                        </div>
                        <div id="keywordsContainer_erotic" style="display: flex; flex-direction: column; gap: 8px;">
                            ${this._renderKeywords(template.色色模式?.词条 || [], 'erotic')}
                        </div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px;">描述：</div>
                    <textarea id="templateDescription" style="width: 100%; height: 80px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; resize: vertical;">${template.描述 || ''}</textarea>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px;">限制：</div>
                    <textarea id="templateRestriction" style="width: 100%; height: 60px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; resize: vertical;">${template.限制 || ''}</textarea>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="font-size: 13px; font-weight: 500;">词条：</div>
                        <button class="btn btn-secondary" onclick="PromptManagerView._addKeyword('')" style="font-size: 12px; padding: 4px 8px;">➕ 添加词条</button>
                    </div>
                    <div id="keywordsContainer" style="display: flex; flex-direction: column; gap: 8px;">
                        ${this._renderKeywords(template.词条 || [], '')}
                    </div>
                </div>
            `;
        }
    },
    
    _renderKeywords(keywords, suffix) {
        if (!keywords || keywords.length === 0) {
            return this._createKeywordHtml(1, '', suffix);
        }
        return keywords.map((k, i) => this._createKeywordHtml(i + 1, k, suffix)).join('');
    },
    
    _createKeywordHtml(index, value, suffix) {
        return `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 50px; font-size: 13px; font-weight: 500;">词条${index}：</div>
                <input type="text" class="keyword-input${suffix ? '_' + suffix : ''}" value="${value}" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px;">
                <button class="btn btn-secondary" onclick="PromptManagerView._removeKeyword(this, '${suffix}')" style="font-size: 12px; padding: 4px 8px; color: #e74c3c;">🗑️</button>
            </div>
        `;
    },
    
    _renderOutputFormatSection() {
        const section = document.getElementById('outputFormatSection');
        if (!section) return;
        
        if (this._currentCategory === 'generateChoices') {
            // 选项生成模板
            section.innerHTML = `
                <div style="margin-bottom: 8px; color: var(--text-dim); font-size: 12px;">系统固定格式：</div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 80px; font-size: 13px; color: var(--text-dim);">【选项一】：</div>
                        <input type="text" id="choice1" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; pointer-events: none; cursor: not-allowed; background-color: #f5f5f5;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 80px; font-size: 13px; color: var(--text-dim);">【选项二】：</div>
                        <input type="text" id="choice2" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; pointer-events: none; cursor: not-allowed; background-color: #f5f5f5;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 80px; font-size: 13px; color: var(--text-dim);">【选项三】：</div>
                        <input type="text" id="choice3" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; pointer-events: none; cursor: not-allowed; background-color: #f5f5f5;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 80px; font-size: 13px; color: var(--text-dim);">【选项四】：</div>
                        <input type="text" id="choice4" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; pointer-events: none; cursor: not-allowed; background-color: #f5f5f5;">
                    </div>
                </div>
                <textarea id="templateOutputFormat" style="display: none;"></textarea>
            `;
        } else {
            // 其他模板
            section.innerHTML = `
                <div style="margin-bottom: 8px; color: var(--text-dim); font-size: 12px;">系统固定格式：【故事】</div>
                <textarea id="templateOutputFormat" style="width: 100%; height: 60px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; resize: vertical; pointer-events: none; cursor: not-allowed; background-color: #f5f5f5;"></textarea>
            `;
        }
    },
    
    _parseTemplateToForm(template) {
        let description = '';
        let restriction = '';
        let outputFormat = '';
        let keywords = [];
        
        // 处理复杂格式
        if (typeof template === 'object' && template !== null) {
            description = template.描述 || '';
            restriction = template.限制 || '';
            outputFormat = template.输出格式 || '';
            keywords = Array.isArray(template.词条) ? template.词条 : (template.词条 ? [template.词条] : []);
        }
        
        const descEl = document.getElementById('templateDescription');
        const restEl = document.getElementById('templateRestriction');
        const outputEl = document.getElementById('templateOutputFormat');
        const keywordsContainer = document.getElementById('keywordsContainer');
        
        if (descEl) descEl.value = description;
        if (restEl) restEl.value = restriction;
        
        if (keywordsContainer) {
            keywordsContainer.innerHTML = '';
            keywords.forEach((keyword, index) => {
                this._addKeywordInput(index + 1, keyword.trim());
            });
            
            // 如果没有词条，添加一个默认的
            if (keywords.length === 0) {
                this._addKeywordInput(1, '');
            }
        }
    },
    
    _addKeyword(suffix = '') {
        const containerId = suffix ? 'keywordsContainer_' + suffix : 'keywordsContainer';
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const count = container.children.length + 1;
        this._addKeywordInput(count, '', suffix);
    },
    
    _addKeywordInput(index, value = '', suffix = '') {
        const containerId = suffix ? 'keywordsContainer_' + suffix : 'keywordsContainer';
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const inputDiv = document.createElement('div');
        inputDiv.style.display = 'flex';
        inputDiv.style.alignItems = 'center';
        inputDiv.style.gap = '8px';
        
        const className = suffix ? 'keyword-input_' + suffix : 'keyword-input';
        
        inputDiv.innerHTML = `
            <div style="width: 50px; font-size: 13px; font-weight: 500;">词条${index}：</div>
            <input type="text" class="${className}" value="${value}" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px;">
            <button class="btn btn-secondary" onclick="PromptManagerView._removeKeyword(this, '${suffix}')" style="font-size: 12px; padding: 4px 8px; color: #e74c3c;">🗑️</button>
        `;
        
        container.appendChild(inputDiv);
    },
    
    _removeKeyword(button, suffix = '') {
        const inputDiv = button.closest('div');
        if (inputDiv) {
            inputDiv.remove();
            this._renumberKeywords(suffix);
        }
    },
    
    _renumberKeywords(suffix = '') {
        const containerId = suffix ? 'keywordsContainer_' + suffix : 'keywordsContainer';
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const inputs = container.querySelectorAll(':scope > div');
        inputs.forEach((inputDiv, index) => {
            const label = inputDiv.querySelector('div');
            if (label) {
                label.textContent = `词条${index + 1}：`;
            }
        });
    },
    

    
    _save() {
        const plugin = window.PromptManagerPlugin;
        const templateData = plugin?._templates[this._currentCategory]?.[this._currentPreset];
        const template = templateData?.template;
        
        const hasTwoModes = template?.日常模式 && template?.色色模式;
        
        let content;
        
        if (hasTwoModes) {
            const dailyDescription = document.getElementById('templateDescription_daily')?.value || '';
            const dailyRestriction = document.getElementById('templateRestriction_daily')?.value || '';
            const dailyKeywordInputs = document.querySelectorAll('.keyword-input_daily');
            const dailyKeywords = Array.from(dailyKeywordInputs).map(input => input.value.trim()).filter(value => value);
            
            const eroticDescription = document.getElementById('templateDescription_erotic')?.value || '';
            const eroticRestriction = document.getElementById('templateRestriction_erotic')?.value || '';
            const eroticKeywordInputs = document.querySelectorAll('.keyword-input_erotic');
            const eroticKeywords = Array.from(eroticKeywordInputs).map(input => input.value.trim()).filter(value => value);
            
            content = {
                "名称": this._categoryInfo[this._currentCategory]?.name || this._currentCategory,
                "日常模式": {
                    "描述": dailyDescription,
                    "输出格式": "【故事】\n（内容）\n\n【选项】\n1. xxx\n2. xxx",
                    "识别词": dailyKeywords,
                    "限制": dailyRestriction,
                    "词条": dailyKeywords
                },
                "色色模式": {
                    "描述": eroticDescription,
                    "输出格式": "【故事】\n（内容）\n\n【选项】\n1. xxx\n2. xxx",
                    "识别词": eroticKeywords,
                    "限制": eroticRestriction,
                    "词条": eroticKeywords
                }
            };
        } else {
            const description = document.getElementById('templateDescription')?.value || '';
            const restriction = document.getElementById('templateRestriction')?.value || '';
            const keywordInputs = document.querySelectorAll('.keyword-input');
            const keywords = Array.from(keywordInputs).map(input => input.value.trim()).filter(value => value);
            
            let outputFormat = '';
            if (this._currentCategory === 'generateChoices') {
                outputFormat = '"选项一"："日常的选项"，"选项二"："日常的选项"，"选项三"："色色的选项"，"选项四"："淫荡的选项"';
            } else {
                outputFormat = '【故事】\n（内容）\n\n【选项】\n1. xxx\n2. xxx';
            }
            
            content = {
                "名称": this._categoryInfo[this._currentCategory]?.name || this._currentCategory,
                "描述": description,
                "输出格式": outputFormat,
                "限制": restriction,
                "词条": keywords
            };
        }
        
        const textarea = document.getElementById('templateContent');
        if (textarea) textarea.value = JSON.stringify(content, null, 2);
        
        if (plugin?.saveCustomTemplate(this._currentCategory, this._currentPreset, content)) {
            this._toast('✅ 已保存');
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
                const fullData = plugin.getTemplateFull(cat, p.id);
                if (fullData) {
                    data.templates[cat].presets[p.id] = {
                        name: p.name,
                        ...fullData
                    };
                }
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
                                const templateData = pd.template || pd;
                                if (templateData) {
                                    plugin?.saveCustomTemplate(cat, pid, templateData);
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
    
    _copyTemplate() {
        // 收集当前模板数据
        const description = document.getElementById('templateDescription')?.value || '';
        const restriction = document.getElementById('templateRestriction')?.value || '';
        let outputFormat = document.getElementById('templateOutputFormat')?.value || '';
        const keywordInputs = document.querySelectorAll('.keyword-input');
        const keywords = Array.from(keywordInputs).map(input => input.value.trim()).filter(value => value);
        
        // 处理选项生成模板的特殊输出格式
        if (this._currentCategory === 'generateChoices') {
            const choice1 = document.getElementById('choice1')?.value || '';
            const choice2 = document.getElementById('choice2')?.value || '';
            const choice3 = document.getElementById('choice3')?.value || '';
            const choice4 = document.getElementById('choice4')?.value || '';
            outputFormat = `"选项一"："${choice1}"，"选项二"："${choice2}"，"选项三"："${choice3}"，"选项四"："${choice4}"`;
        }
        
        // 创建复制模板模态框
        let modal = document.getElementById('copyModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'copyModal';
            modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;`;
            modal.innerHTML = `
                <div style="background: var(--card); border-radius: 8px; padding: 20px; max-width: 400px; width: 90%;">
                    <h4 style="margin: 0 0 16px 0;">复制模板</h4>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">新模板名称：</label>
                        <input type="text" id="newTemplateName" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px;">
                    </div>
                    <div style="text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="document.getElementById('copyModal').style.display = 'none'">取消</button>
                        <button class="btn" onclick="PromptManagerView._confirmCopyTemplate()">确认复制</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // 显示模态框
        modal.style.display = 'flex';
        
        // 保存当前模板数据到临时变量
        this._tempTemplateData = {
            description: description,
            restriction: restriction,
            outputFormat: outputFormat,
            keywords: keywords
        };
    },
    
    _confirmCopyTemplate() {
        const newTemplateName = document.getElementById('newTemplateName')?.value || '';
        if (!newTemplateName.trim()) {
            this._toast('请输入新模板名称', 'error');
            return;
        }
        
        // 生成新模板ID
        const newTemplateId = 'custom_' + Date.now();
        
        // 构建新模板数据
        const templateData = {
            name: newTemplateName,
            description: this._tempTemplateData.description,
            template: {
                "名称": newTemplateName,
                "描述": this._tempTemplateData.description,
                "输出格式": this._tempTemplateData.outputFormat,
                "限制": this._tempTemplateData.restriction,
                "词条": this._tempTemplateData.keywords
            }
        };
        
        // 保存新模板
        const plugin = window.PromptManagerPlugin;
        if (plugin?.saveCustomTemplate(this._currentCategory, newTemplateId, templateData.template)) {
            this._toast('✅ 模板复制成功');
            
            // 重新加载模板列表
            setTimeout(() => {
                this._showCategory(this._currentCategory);
            }, 500);
        } else {
            this._toast('❌ 模板复制失败', 'error');
        }
        
        // 关闭模态框
        document.getElementById('copyModal').style.display = 'none';
        this._tempTemplateData = null;
    },
    
    _preview() {
        // 收集当前模板数据 - 支持双模式模板
        const dailyDescription = document.getElementById('templateDescription_daily')?.value || '';
        const eroticDescription = document.getElementById('templateDescription_erotic')?.value || '';
        const singleDescription = document.getElementById('templateDescription')?.value || '';
        
        // 判断是否为双模式模板
        const isDualMode = dailyDescription || eroticDescription;
        const description = isDualMode ? 
            `<strong>日常模式：</strong><div style="margin-top:4px;padding:8px;background:var(--card);border-radius:4px;margin-bottom:8px;">${dailyDescription || '无'}</div><strong>色色模式：</strong><div style="margin-top:4px;padding:8px;background:var(--card);border-radius:4px;">${eroticDescription || '无'}</div>` : 
            singleDescription;
        
        const dailyRestriction = document.getElementById('templateRestriction_daily')?.value || '';
        const eroticRestriction = document.getElementById('templateRestriction_erotic')?.value || '';
        const singleRestriction = document.getElementById('templateRestriction')?.value || '';
        
        const restriction = isDualMode ?
            `<strong>日常模式：</strong><div style="margin-top:4px;padding:8px;background:var(--card);border-radius:4px;margin-bottom:8px;">${dailyRestriction || '无'}</div><strong>色色模式：</strong><div style="margin-top:4px;padding:8px;background:var(--card);border-radius:4px;">${eroticRestriction || '无'}</div>` :
            singleRestriction;
        
        let outputFormat = '';
        const dailyKeywordInputs = document.querySelectorAll('.keyword-input_daily');
        const eroticKeywordInputs = document.querySelectorAll('.keyword-input_erotic');
        const singleKeywordInputs = document.querySelectorAll('.keyword-input');
        
        const dailyKeywords = Array.from(dailyKeywordInputs).map(input => input.value.trim()).filter(value => value);
        const eroticKeywords = Array.from(eroticKeywordInputs).map(input => input.value.trim()).filter(value => value);
        const singleKeywords = Array.from(singleKeywordInputs).map(input => input.value.trim()).filter(value => value);
        
        let keywordsDisplay;
        if (isDualMode) {
            keywordsDisplay = `
                <strong>日常模式：</strong>
                <div style="margin-top:4px;padding:8px;background:var(--card);border-radius:4px;margin-bottom:8px;">
                    ${dailyKeywords.length > 0 ? dailyKeywords.map((keyword, index) => `<div>词条${index+1}：${keyword}</div>`).join('') : '无'}
                </div>
                <strong>色色模式：</strong>
                <div style="margin-top:4px;padding:8px;background:var(--card);border-radius:4px;">
                    ${eroticKeywords.length > 0 ? eroticKeywords.map((keyword, index) => `<div>词条${index+1}：${keyword}</div>`).join('') : '无'}
                </div>`;
        } else {
            keywordsDisplay = singleKeywords.length > 0 ? singleKeywords.map((keyword, index) => `<div>词条${index+1}：${keyword}</div>`).join('') : '无';
        }
        
        // 根据模板类别设置默认输出格式
        if (this._currentCategory === 'generateChoices') {
            // 选项生成模板的默认输出格式
            outputFormat = '"选项一"："日常的选项"，"选项二"："日常的选项"，"选项三"："色色的选项"，"选项四"："淫荡的选项"';
        } else {
            // 其他模板的默认输出格式
            outputFormat = '【故事】\n（内容）\n\n【选项】\n1. xxx\n2. xxx';
        }
        
        // 构建预览内容
        let previewContent = `
            <div style="margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0;">模板预览</h4>
                <div style="background: var(--bg); border-radius: 6px; padding: 12px;">
                    <div style="margin-bottom: 8px;">
                        <strong>描述：</strong>
                        <div style="margin-top: 4px; padding: 8px; background: var(--card); border-radius: 4px;">${description || '无'}</div>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>限制：</strong>
                        <div style="margin-top: 4px; padding: 8px; background: var(--card); border-radius: 4px;">${restriction || '无'}</div>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>词条：</strong>
                        <div style="margin-top: 4px; padding: 8px; background: var(--card); border-radius: 4px;">
                            ${keywordsDisplay}
                        </div>
                    </div>
                </div>
            </div>
            <div style="text-align: right;">
                <button class="btn" onclick="document.getElementById('previewModal').style.display = 'none'">关闭</button>
            </div>
        `;
        
        // 创建预览模态框
        let modal = document.getElementById('previewModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'previewModal';
            modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;`;
            modal.innerHTML = `
                <div style="background: var(--card); border-radius: 8px; padding: 20px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div id="previewContent"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // 更新预览内容并显示模态框
        document.getElementById('previewContent').innerHTML = previewContent;
        modal.style.display = 'flex';
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
