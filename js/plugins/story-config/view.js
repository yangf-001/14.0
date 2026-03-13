View.register('story-config.main', function() {
    const plugin = PluginSystem.get('story-config');
    const world = Data.getCurrentWorld();
    let aiSettings = world
        ? (plugin?.getWorldAISettings(world.id) || plugin?.getAISettings())
        : (plugin?.getAISettings());
    
    if (!aiSettings) {
        aiSettings = ViewCallbacks.storyConfig._getDefaultAISettings();
    }

    return `
        <div style="max-width: 900px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                <h2>🤖 AI设置</h2>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn btn-secondary" onclick="ViewCallbacks.storyConfig.exportPrompts()">📤 导出</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('importPromptsInput').click()">📥 导入</button>
                    <button class="btn btn-secondary" onclick="ViewCallbacks.storyConfig.testApiConfig()">🔌 测试API</button>
                    <input type="file" id="importPromptsInput" accept=".json,.txt" style="display: none;" onchange="ViewCallbacks.storyConfig.importFromFile(event)">
                </div>
            </div>

            ${world ? `
                <div class="card" style="margin-bottom: 16px; padding: 12px; background: var(--accent); color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <span>当前世界：${world.name}</span>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="useWorldConfig" ${localStorage.getItem(`story_ai_settings_${world.id}`) ? 'checked' : ''} onchange="ViewCallbacks.storyConfig.toggleWorldConfig('${world.id}', this.checked)">
                            使用世界级配置
                        </label>
                    </div>
                </div>
            ` : '<div class="card" style="margin-bottom: 16px;">请先选择一个世界以使用世界级配置</div>'}

            <div id="apiTestResult" class="api-test-result" style="display: none; margin-bottom: 16px;"></div>

            <div style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 8px;">
                <button class="btn btn-secondary" onclick="showPage('story-config-presets')">📋 预设模板</button>
                <button class="btn" onclick="ViewCallbacks.storyConfig.savePrompts()">💾 保存</button>
                <button class="btn btn-secondary" onclick="ViewCallbacks.storyConfig.resetToDefault()">🔄 恢复默认</button>
            </div>

            <div style="display: grid; gap: 16px;">
                ${ViewCallbacks.storyConfig._renderAISettingSection(aiSettings)}
            </div>
        </div>
    `;
});

View.register('story-config.presets', function() {
    const promptManager = window.PromptManagerPlugin;
    
    const presets = [
        { id: 'default', name: '默认风格', desc: '标准的故事生成风格' },
        { id: 'detailed', name: '详细描写', desc: '详细的环境描写和情感刻画' },
        { id: 'concise', name: '简洁风格', desc: '简洁有力的叙事' },
        { id: 'romantic', name: '言情风格', desc: '浪漫的情感故事' },
        { id: 'plot', name: '剧情向', desc: '复杂的情节设计' },
        { id: 'erotic', name: '色色风格', desc: '成人向内容描写' }
    ];

    return `
        <div style="max-width: 900px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>📋 预设模板</h2>
                <button class="btn btn-secondary" onclick="showPage('story-config')">← 返回</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                ${presets.map((preset) => `
                    <div class="card" style="cursor: pointer; transition: transform 0.2s;" onclick="ViewCallbacks.storyConfig.applyStylePreset('${preset.id}')">
                        <div style="font-weight: bold; margin-bottom: 8px;">${preset.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-dim);">${preset.desc}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
});

ViewCallbacks.storyConfig = ViewCallbacks.storyConfig || {};

ViewCallbacks.storyConfig._getDefaultAISettings = function() {
    const promptManager = window.PromptManagerPlugin;
    
    const getTemplate = (category) => {
        return promptManager ? promptManager.getTemplate(category, 'default') : '';
    };
    
    return {
        dataSources: {
                title: '数据源设置',
                enabled: true,
                charFields: ['name', 'gender', 'age', 'appearance', 'personality', 'backstory', 'fetish', 'turnOns'],
                storyContentLength: 0,
                historyScenes: 0,
                charDescriptionLength: 'medium',
                includeAdultProfile: true
            },
        storyStart: {
            title: '故事开头生成',
            enabled: true,
            template: getTemplate('storyStart'),
            customPrompt: ''
        },
        storyChoice: {
            title: '选择后继续故事',
            enabled: true,
            template: getTemplate('storyChoice'),
            customPrompt: ''
        },
        storyFree: {
            title: '自由发展继续',
            enabled: true,
            template: getTemplate('storyFree'),
            customPrompt: ''
        },

        storyContinue: {
            title: '继续故事',
            enabled: true,
            template: getTemplate('storyContinue'),
            customPrompt: ''
        },
        generateChoices: {
            title: '生成剧情选项',
            enabled: true,
            template: getTemplate('generateChoices'),
            temperature: 0.8,
            customPrompt: ''
        },
        updateStats: {
            title: '更新角色属性',
            enabled: true,
            template: getTemplate('updateStats'),
            temperature: 0.3,
            customPrompt: ''
        },
        extractItems: {
            title: '提取物品信息',
            enabled: true,
            template: getTemplate('extractItems'),
            temperature: 0.3,
            customPrompt: ''
        },
        level2Summary: {
            title: '二级故事摘要（每次总结10幕）',
            enabled: true,
            template: getTemplate('storySummary', 'level2'),
            maxTokens: 2000,
            customPrompt: ''
        },
        level3Summary: {
            title: '三级综合摘要（每次总结10个二级）',
            enabled: true,
            template: getTemplate('storySummary', 'level3'),
            maxTokens: 3000,
            customPrompt: ''
        },
        level1Summary: {
            title: '一级故事摘要（每个故事的完整总结）',
            enabled: true,
            template: getTemplate('storySummary', 'level1'),
            maxTokens: 1000,
            customPrompt: ''
        },
        chatStart: {
            title: '聊天开场',
            enabled: true,
            template: getTemplate('chatStart'),
            customPrompt: ''
        },
        chatContinue: {
            title: '聊天继续',
            enabled: true,
            template: getTemplate('chatContinue'),
            customPrompt: ''
        }
    };
};

ViewCallbacks.storyConfig._renderDataSourceSection = function(setting) {
    const ds = setting || {};
    const charFields = ds.charFields || ['name', 'gender', 'age', 'appearance', 'personality', 'backstory', 'fetish', 'turnOns'];
    const allFields = [
        { key: 'name', label: '名字' },
        { key: 'gender', label: '性别' },
        { key: 'age', label: '年龄' },
        { key: 'appearance', label: '外貌' },
        { key: 'personality', label: '性格' },
        { key: 'backstory', label: '背景故事' },
        { key: 'fetish', label: '性癖' },
        { key: 'turnOns', label: '性偏好' },
        { key: 'stats', label: '属性数值' },
        { key: 'inventory', label: '持有物品' }
    ];

    const isExpanded = ds._expanded === true;

    return `
        <div class="card" style="border-left: 4px solid var(--accent);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="enable_dataSources" ${ds.enabled !== false ? 'checked' : ''} onchange="ViewCallbacks.storyConfig.toggleSection('dataSources', this.checked)">
                    <h4 style="margin: 0;">${setting?.title || '数据源设置'}</h4>
                </div>
                <button class="btn btn-secondary" onclick="ViewCallbacks.storyConfig.toggleSectionDetail('dataSources')" style="font-size: 0.8rem; padding: 4px 8px;">
                    ${isExpanded ? '▼ 收起' : '▶ 展开'}
                </button>
            </div>
            <div id="section_dataSources" style="display: ${isExpanded ? 'block' : 'none'};">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">角色信息字段（勾选要包含的字段）：</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${allFields.map(f => `
                            <label style="display: flex; align-items: center; gap: 4px; padding: 6px 10px; background: var(--card); border-radius: 4px; cursor: pointer;">
                                <input type="checkbox" class="charFieldCheck" value="${f.key}" ${charFields.includes(f.key) ? 'checked' : ''}>
                                ${f.label}
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">剧情内容截取长度：</label>
                    <select id="storyContentLength" style="padding: 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        <option value="0" ${ds.storyContentLength === 0 ? 'selected' : ''}>0字（不限制）</option>
                        <option value="300" ${ds.storyContentLength === 300 ? 'selected' : ''}>300字（简短）</option>
                        <option value="500" ${ds.storyContentLength === 500 ? 'selected' : ''}>500字（中等）</option>
                        <option value="800" ${ds.storyContentLength === 800 ? 'selected' : ''}>800字（标准）</option>
                        <option value="1200" ${ds.storyContentLength === 1200 ? 'selected' : ''}>1200字（详细）</option>
                        <option value="2000" ${ds.storyContentLength === 2000 ? 'selected' : ''}>2000字（完整）</option>
                    </select>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">历史剧情取最近几幕：</label>
                    <select id="historyScenes" style="padding: 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        <option value="0" ${ds.historyScenes === 0 ? 'selected' : ''}>0幕（不限制）</option>
                        <option value="1" ${ds.historyScenes === 1 ? 'selected' : ''}>1幕</option>
                        <option value="3" ${ds.historyScenes === 3 ? 'selected' : ''}>3幕</option>
                        <option value="5" ${ds.historyScenes === 5 ? 'selected' : ''}>5幕</option>
                        <option value="10" ${ds.historyScenes === 10 ? 'selected' : ''}>10幕</option>
                    </select>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">角色描述详细程度：</label>
                    <select id="charDescriptionLength" style="padding: 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        <option value="short" ${ds.charDescriptionLength === 'short' ? 'selected' : ''}>简短（名字+性格）</option>
                        <option value="medium" ${ds.charDescriptionLength === 'medium' || !ds.charDescriptionLength ? 'selected' : ''}>中等（+外貌+背景）</option>
                        <option value="long" ${ds.charDescriptionLength === 'long' ? 'selected' : ''}>详细（全部字段）</option>
                    </select>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="includeAdultProfile" ${ds.includeAdultProfile !== false ? 'checked' : ''}>
                        包含成人配置（性癖、敏感度等）
                    </label>
                </div>
                <div style="padding: 12px; background: var(--accent); color: white; border-radius: 6px; font-size: 0.85rem;">
                    💡 数据源设置将影响所有向API输入的内容。修改后会影响角色信息完整性、剧情摘要长度等。
                </div>
            </div>
        </div>
    `;
};

ViewCallbacks.storyConfig._renderAISettingSection = function(aiSettings) {
    const sections = [];
    const defaultSettings = this._getDefaultAISettings();

    sections.push(this._renderDataSourceSection(aiSettings?.dataSources || defaultSettings.dataSources));

    const sectionKeys = ['storyStart', 'storyChoice', 'storyFree', 'storyContinue', 'generateChoices', 'updateStats', 'extractItems', 'level1Summary', 'level2Summary', 'level3Summary', 'chatStart', 'chatContinue'];

    for (const key of sectionKeys) {
        const defaultSetting = defaultSettings[key] || {};
        const setting = (aiSettings && aiSettings[key]) ? { ...defaultSetting, ...aiSettings[key] } : defaultSetting;
        const isExpanded = setting._expanded === true;
        sections.push(`
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="enable_${key}" ${setting.enabled !== false ? 'checked' : ''} onchange="ViewCallbacks.storyConfig.toggleSection('${key}', this.checked)">
                        <h4 style="margin: 0;">${setting.title || key}</h4>
                    </div>
                    <button class="btn btn-secondary" onclick="ViewCallbacks.storyConfig.toggleSectionDetail('${key}')" style="font-size: 0.8rem; padding: 4px 8px;">
                        ${isExpanded ? '▼ 收起' : '▶ 展开'}
                    </button>
                </div>
                <div id="section_${key}" style="display: ${isExpanded ? 'block' : 'none'};">
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 500;">Prompt模板：</label>
                        <textarea id="template_${key}" rows="8" style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-family: monospace; font-size: 0.85rem;" placeholder="输入Prompt模板...">${setting.template || ''}</textarea>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 500;">自定义补充（追加到模板后面）：</label>
                        <textarea id="custom_${key}" rows="3" style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-family: inherit;" placeholder="输入自定义内容...">${setting.customPrompt || ''}</textarea>
                    </div>
                    ${setting.temperature !== undefined ? `
                        <div style="margin-bottom: 12px;">
                            <label id="temp_label_${key}" style="display: block; margin-bottom: 6px; font-weight: 500;">Temperature: ${setting.temperature}</label>
                            <input type="range" id="temp_${key}" min="0" max="1" step="0.1" value="${setting.temperature}" style="width: 100%;" onchange="document.getElementById('temp_label_${key}').textContent = 'Temperature: ' + this.value">
                        </div>
                    ` : ''}
                    ${setting.maxTokens !== undefined ? `
                        <div style="margin-bottom: 12px;">
                            <label id="tokens_label_${key}" style="display: block; margin-bottom: 6px; font-weight: 500;">Max Tokens: ${setting.maxTokens}</label>
                            <input type="range" id="tokens_${key}" min="50" max="4000" step="50" value="${setting.maxTokens}" style="width: 100%;" onchange="document.getElementById('tokens_label_${key}').textContent = 'Max Tokens: ' + this.value">
                        </div>
                    ` : ''}
                    <div style="padding: 12px; background: var(--border); border-radius: 6px; font-size: 0.8rem;">
                        <div style="font-weight: 500; margin-bottom: 6px;">可用变量：</div>
                        <div style="color: var(--text-dim);">[系统提示词] - 从系统配置中获取</div>
                        <div style="color: var(--text-dim);">[角色信息/角色JSON] - 角色详细数据</div>
                        <div style="color: var(--text-dim);">[场景] - 用户选择的场景</div>
                        <div style="color: var(--text-dim);">[风格设置] - 故事风格配置</div>
                        <div style="color: var(--text-dim);">[上下文/之前的故事剧情] - 历史剧情</div>
                        <div style="color: var(--text-dim);">[内容摘要] - 当前剧情摘要</div>
                        <div style="color: var(--text-dim);">[物品名/物品效果] - 物品数据</div>
                    </div>
                </div>
            </div>
        `);
    }

    return sections.join('');
};

ViewCallbacks.storyConfig.toggleSection = function(key, enabled) {
    const plugin = PluginSystem.get('story-config');
    const world = Data.getCurrentWorld();
    let currentSettings = world
        ? (plugin?.getWorldAISettings(world.id) || plugin?.getAISettings())
        : (plugin?.getAISettings());
    
    if (!currentSettings) {
        currentSettings = this._getDefaultAISettings();
    }

    if (currentSettings[key]) {
        currentSettings[key].enabled = enabled;
        if (world) {
            plugin?.saveWorldAISettings(world.id, currentSettings);
        } else {
            plugin?.saveAISettings(currentSettings);
        }
    }
};

ViewCallbacks.storyConfig.toggleSectionDetail = function(key) {
    const plugin = PluginSystem.get('story-config');
    const world = Data.getCurrentWorld();
    let currentSettings = world
        ? (plugin?.getWorldAISettings(world.id) || plugin?.getAISettings())
        : (plugin?.getAISettings());

    if (!currentSettings) {
        currentSettings = this._getDefaultAISettings();
    }
    
    const defaultSettings = this._getDefaultAISettings();
    const keySettings = currentSettings[key] || defaultSettings[key] || {};
    keySettings._expanded = !keySettings._expanded;
    currentSettings[key] = keySettings;
    
    if (world) {
        plugin?.saveWorldAISettings(world.id, currentSettings);
    } else {
        plugin?.saveAISettings(currentSettings);
    }
    showPage('story-config');
};

ViewCallbacks.storyConfig.savePrompts = function() {
    const world = Data.getCurrentWorld();
    const plugin = PluginSystem.get('story-config');

    const charFieldCheckboxes = document.querySelectorAll('.charFieldCheck:checked');
    const charFields = Array.from(charFieldCheckboxes).map(cb => cb.value);

    const dataSources = {
        title: '数据源设置',
        enabled: document.getElementById('enable_dataSources')?.checked !== false,
        charFields: charFields.length > 0 ? charFields : ['name', 'gender', 'age', 'appearance', 'personality', 'backstory', 'fetish', 'turnOns'],
        storyContentLength: parseInt(document.getElementById('storyContentLength')?.value || 800),
        historyScenes: parseInt(document.getElementById('historyScenes')?.value || 3),
        charDescriptionLength: document.getElementById('charDescriptionLength')?.value || 'medium',
        includeAdultProfile: document.getElementById('includeAdultProfile')?.checked !== false
    };

    const sectionKeys = ['storyStart', 'storyChoice', 'storyFree', 'storyContinue', 'generateChoices', 'updateStats', 'extractItems', 'level1Summary', 'level2Summary', 'level3Summary', 'chatStart', 'chatContinue'];
    const aiSettings = { dataSources: dataSources };

    for (const key of sectionKeys) {
        const templateEl = document.getElementById(`template_${key}`);
        const customEl = document.getElementById(`custom_${key}`);
        const enableEl = document.getElementById(`enable_${key}`);
        const sectionEl = document.getElementById(`section_${key}`);
        
        aiSettings[key] = {
            title: this._getDefaultAISettings()[key]?.title || key,
            enabled: enableEl ? enableEl.checked : true,
            template: templateEl ? templateEl.value : '',
            customPrompt: customEl ? customEl.value : '',
            _expanded: sectionEl ? sectionEl.style.display !== 'none' : false
        };

        const tempEl = document.getElementById(`temp_${key}`);
        if (tempEl) {
            aiSettings[key].temperature = parseFloat(tempEl.value);
        }

        const tokensEl = document.getElementById(`tokens_${key}`);
        if (tokensEl) {
            aiSettings[key].maxTokens = parseInt(tokensEl.value);
        }
    }

    if (world && document.getElementById('useWorldConfig')?.checked) {
        plugin?.saveWorldAISettings(world.id, aiSettings);
    } else {
        plugin?.saveAISettings(aiSettings);
    }

    const saved = localStorage.getItem('story_ai_settings');
    console.log('Saved settings:', saved ? JSON.parse(saved).intimateContinue : 'not found');
    
    alert('配置已保存！');
    showPage('story-config');
};

ViewCallbacks.storyConfig.updatePreview = function() {
    alert('请在对应的配置项中修改Prompt模板');
};

ViewCallbacks.storyConfig.resetToDefault = function() {
    if (!confirm('确定要恢复默认配置吗？')) return;

    const world = Data.getCurrentWorld();
    const plugin = PluginSystem.get('story-config');

    if (world) {
        localStorage.removeItem(`story_ai_settings_${world.id}`);
    }
    plugin?.saveAISettings(this._getDefaultAISettings());

    showPage('story-config');
    alert('已恢复默认配置');
};

ViewCallbacks.storyConfig.toggleWorldConfig = function(worldId, enabled) {
    if (enabled) {
        const currentAISettings = PluginSystem.get('story-config')?.getAISettings() || {};
        PluginSystem.get('story-config')?.saveWorldAISettings(worldId, currentAISettings);
    } else {
        localStorage.removeItem(`story_ai_settings_${worldId}`);
    }
    showPage('story-config');
};

ViewCallbacks.storyConfig.applyStylePreset = function(presetId) {
    const promptManager = window.PromptManagerPlugin;
    
    if (!promptManager) {
        alert('提示词管理插件未加载');
        return;
    }
    
    const preset = promptManager.getStylePreset(presetId);
    
    if (!preset) {
        alert('未找到该预设');
        return;
    }
    
    const world = Data.getCurrentWorld();
    if (!world) {
        alert('请先选择一个世界');
        return;
    }
    
    const settings = Settings.get(world.id) || {};
    settings.systemRole = preset.systemRole;
    settings.outputRules = preset.outputRules;
    settings.customRules = preset.customRules;
    Settings.save(world.id, settings);
    
    alert(`✅ 已应用"${preset.name}"风格预设`);
    showPage('story-config');
};

ViewCallbacks.storyConfig.exportPrompts = function() {
    const plugin = PluginSystem.get('story-config');
    const world = Data.getCurrentWorld();
    const aiSettings = world
        ? (plugin?.getWorldAISettings(world.id) || plugin?.getAISettings())
        : (plugin?.getAISettings() || this._getDefaultAISettings());

    const exportData = {
        aiSettings: aiSettings,
        exportTime: Date.now()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story-ai-settings.json';
    a.click();
    URL.revokeObjectURL(url);
};

ViewCallbacks.storyConfig.importFromFile = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const plugin = PluginSystem.get('story-config');
        const world = Data.getCurrentWorld();

        try {
            const data = JSON.parse(content);
            if (data.aiSettings) {
                if (world) {
                    plugin?.saveWorldAISettings(world.id, data.aiSettings);
                } else {
                    plugin?.saveAISettings(data.aiSettings);
                }
            }
            showPage('story-config');
            alert('导入成功！');
        } catch (err) {
            alert('导入失败：无效的JSON格式');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
};

ViewCallbacks.storyConfig.testApiConfig = async function() {
    const resultDiv = document.getElementById('apiTestResult');
    if (!resultDiv) return;
    
    if (!ai.config.apiKey) {
        resultDiv.className = 'api-test-result error';
        resultDiv.textContent = '请先在设置页面配置 API Key';
        resultDiv.style.display = 'block';
        return;
    }
    
    resultDiv.className = 'api-test-result';
    resultDiv.textContent = '正在测试 API 连接...';
    resultDiv.style.display = 'block';
    
    try {
        const result = await ai.testConnection();
        
        if (result.success) {
            resultDiv.className = 'api-test-result success';
            resultDiv.textContent = '✅ ' + result.message;
        } else {
            resultDiv.className = 'api-test-result error';
            resultDiv.textContent = '❌ ' + result.error;
        }
    } catch (err) {
        resultDiv.className = 'api-test-result error';
        resultDiv.textContent = '❌ 测试失败: ' + err.message;
    }
};
