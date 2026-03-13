PluginSystem.register('prompt-manager', {
    description: 'AI提示词管理 - 统一管理所有AI提示词模板',
    features: ['模板管理', '预设模板', '自定义模板', '阶段描写规则', '导入导出'],
    
    _presets: {},
    _templates: {},
    _stylePresets: {},
    _stageDescriptions: {},
    _loaded: false,
    
    async init() {
        window.PromptManagerPlugin = this;
        this._loadPresets();
        await this._loadAllTemplates();
        console.log('[提示词管理] 插件已加载');
    },
    
    _loadPresets() {
        this._presets = {
            storyStart: {
                name: '故事开头模板',
                description: '生成故事的开头，设定故事背景和初始情境',
                presets: [
                    { id: 'default', name: '默认模板', file: '故事生成/故事开头/默认模板.json' },
                    { id: 'erotic', name: '色色故事', file: '故事生成/故事开头/色色故事.json' }
                ]
            },
            storyChoice: {
                name: '故事继续模板',
                description: '根据用户选择继续故事发展',
                presets: [
                    { id: 'default', name: '默认模板', file: '故事生成/故事继续/默认模板.json' },
                    { id: 'erotic', name: '色色模式', file: '故事生成/故事继续/色色模式.json' }
                ]
            },
            storyFree: {
                name: '自由发展模板',
                description: '自由发展剧情，无需用户选择',
                presets: [
                    { id: 'default', name: '默认模板', file: '故事生成/自由发展/默认模板.json' }
                ]
            },
            storyContinue: {
                name: '继续故事模板',
                description: '继续故事发展，保持剧情连贯性',
                presets: [
                    { id: 'default', name: '默认模板', file: '故事生成/继续故事/默认模板.json' }
                ]
            },
            simpleStory: {
                name: '小故事模板',
                description: '小故事模式的提示词模板',
                presets: [
                    { id: 'default', name: '默认模板', file: '故事生成/小故事/默认模板.json' }
                ]
            },
            generateChoices: {
                name: '选项生成模板',
                description: '生成供用户选择的剧情分支选项',
                presets: [
                    { id: 'default', name: '默认模板', file: '选项生成/选项生成/默认模板.json' },
                    { id: 'daily', name: '日常模式', file: '选项生成/选项生成/日常模式.json' },
                    { id: 'erotic', name: '色色模式', file: '选项生成/选项生成/色色模式.json' }
                ]
            },
            chatStart: {
                name: '聊天开场模板',
                description: '聊天开场的提示词模板',
                presets: [
                    { id: 'default', name: '默认模板', file: '聊天对话/聊天开场/默认模板.json' }
                ]
            },
            chatContinue: {
                name: '聊天继续模板',
                description: '聊天继续的提示词模板',
                presets: [
                    { id: 'default', name: '默认模板', file: '聊天对话/聊天继续/默认模板.json' }
                ]
            },
            multiCharChat: {
                name: '多人对话模板',
                description: '多人对话时的提示词模板',
                presets: [
                    { id: 'default', name: '默认模板', file: '聊天对话/多人对话/默认模板.json' }
                ]
            },
            intimateInteraction: {
                name: '亲密互动模板',
                description: '亲密互动时的提示词模板',
                presets: [
                    { id: 'default', name: '默认模板', file: '设置/亲密互动/默认模板.json' }
                ]
            },
            diary: {
                name: '日记生成模板',
                description: '生成角色日记的提示词模板',
                presets: [
                    { id: 'default', name: '默认模板', file: '辅助功能/日记生成/默认模板.json' }
                ]
            },
            sceneSummary: {
                name: '场景摘要模板',
                description: '生成场景摘要的提示词模板',
                presets: [
                    { id: 'default', name: '默认模板', file: '辅助功能/场景摘要/默认模板.json' }
                ]
            },
            storyTitle: {
                name: '故事标题模板',
                description: '生成故事标题的提示词模板',
                presets: [
                    { id: 'default', name: '默认模板', file: '辅助功能/故事标题/默认模板.json' }
                ]
            },
            updateStats: {
                name: '更新属性模板',
                description: '分析角色属性变化的提示词模板',
                presets: [
                    { id: 'default', name: '默认模板', file: '辅助功能/更新属性/默认模板.json' }
                ]
            },
            extractItems: {
                name: '提取物品模板',
                description: '从故事中提取物品的提示词模板',
                presets: [
                    { id: 'default', name: '默认模板', file: '辅助功能/提取物品/默认模板.json' }
                ]
            },
            storySummary: {
                name: '故事摘要模板',
                description: '生成故事摘要的提示词模板',
                presets: [
                    { id: 'level1', name: '一级摘要', file: '辅助功能/故事摘要/一级摘要.json' },
                    { id: 'level2', name: '二级摘要', file: '辅助功能/故事摘要/二级摘要.json' },
                    { id: 'level3', name: '三级摘要', file: '辅助功能/故事摘要/三级摘要.json' }
                ]
            },
            stylePreset: {
                name: '风格预设',
                description: '不同写作风格的预设',
                presets: [
                    { id: 'default', name: '默认风格', file: '设置/风格预设/默认风格.json' },
                    { id: 'detailed', name: '详细描写', file: '设置/风格预设/详细描写.json' },
                    { id: 'concise', name: '简洁风格', file: '设置/风格预设/简洁风格.json' },
                    { id: 'romantic', name: '言情风格', file: '设置/风格预设/言情风格.json' },
                    { id: 'plot', name: '剧情向', file: '设置/风格预设/剧情向.json' },
                    { id: 'erotic', name: '色色风格', file: '设置/风格预设/色色风格.json' }
                ]
            },
            stageDescription: {
                name: '阶段描写规则',
                description: '不同阶段的描写规则',
                presets: [
                    { id: 'default', name: '默认规则', file: '设置/阶段描写/默认规则.json' }
                ]
            }
        };
    },
    
    async _loadAllTemplates() {
        const basePath = 'js/plugins/prompt-manager/素材库/';
        
        for (const [category, data] of Object.entries(this._presets)) {
            this._templates[category] = {};
            
            for (const preset of data.presets) {
                try {
                    const response = await fetch(basePath + preset.file);
                    if (response.ok) {
                        const json = await response.json();
                        this._templates[category][preset.id] = json;
                        
                        if (category === 'stylePreset') {
                            this._stylePresets[preset.id] = json;
                        } else if (category === 'stageDescription') {
                            this._stageDescriptions[preset.id] = json;
                        }
                    }
                } catch (e) {
                    console.warn(`[提示词管理] 加载模板失败: ${preset.file}`, e);
                }
            }
        }
        
        this._loaded = true;
        console.log('[提示词管理] 模板加载完成');
    },
    
    getTemplate(category, presetId = 'default') {
        const customTemplate = this.loadCustomTemplate(category, presetId);
        if (customTemplate) {
            return customTemplate;
        }
        
        const template = this._templates[category]?.[presetId];
        if (!template) return '';
        
        if (typeof template === 'object') {
            if (template.template) {
                return template.template;
            }
            if (template.systemRole || template.outputRules || template.stages) {
                return JSON.stringify(template);
            }
            return template.template || '';
        }
        
        return template || '';
    },
    
    getTemplateWithPreset(category, presetId, variables = {}) {
        let template = this.getTemplate(category, presetId);
        if (!template) return null;
        
        if (typeof template === 'object' && template.template) {
            template = template.template;
        }
        
        for (const [key, value] of Object.entries(variables)) {
            template = template.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
        }
        
        return template;
    },
    
    getPresets(category) {
        if (!category) {
            return this._presets;
        }
        return this._presets[category] || null;
    },
    
    getStylePreset(presetId = 'default') {
        return this._stylePresets[presetId] || this._stylePresets['default'];
    },
    
    getStageDescription(stage, presetId = 'default') {
        const preset = this._stageDescriptions[presetId] || this._stageDescriptions['default'];
        if (!preset?.stages) return '';
        return preset.stages[stage] || preset.stages['1'] || '';
    },
    
    getStageName(stage, presetId = 'default') {
        const names = { 1: '日常模式', 2: '色色模式' };
        return names[stage] || names[1];
    },
    
    saveCustomTemplate(category, presetId, template) {
        try {
            const key = `prompt_${category}_${presetId}`;
            localStorage.setItem(key, JSON.stringify({
                template: template,
                updatedAt: Date.now()
            }));
            console.log(`[提示词管理] 已保存自定义模板: ${category}/${presetId}`);
            return true;
        } catch (e) {
            console.error('[提示词管理] 保存失败:', e);
            return false;
        }
    },
    
    loadCustomTemplate(category, presetId) {
        try {
            const key = `prompt_${category}_${presetId}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                const data = JSON.parse(saved);
                return data.template;
            }
            return null;
        } catch (e) {
            return null;
        }
    },
    
    deleteCustomTemplate(category, presetId) {
        const key = `prompt_${category}_${presetId}`;
        localStorage.removeItem(key);
        console.log(`[提示词管理] 已删除自定义模板: ${category}/${presetId}`);
    },
    
    checkTemplates() {
        const results = {
            total: 0,
            loaded: 0,
            missing: [],
            custom: 0,
            details: {}
        };
        
        for (const [category, data] of Object.entries(this._presets)) {
            results.details[category] = {
                name: data.name,
                presets: {}
            };
            
            for (const preset of data.presets) {
                results.total++;
                
                const template = this.getTemplate(category, preset.id);
                const hasCustom = this.loadCustomTemplate(category, preset.id);
                
                if (hasCustom) {
                    results.custom++;
                }
                
                if (template && template.trim()) {
                    results.loaded++;
                    results.details[category].presets[preset.id] = {
                        name: preset.name,
                        status: 'ok',
                        custom: !!hasCustom,
                        length: template.length
                    };
                } else {
                    results.missing.push(`${category}/${preset.id}`);
                    results.details[category].presets[preset.id] = {
                        name: preset.name,
                        status: 'missing',
                        custom: false,
                        length: 0
                    };
                }
            }
        }
        
        results.success = results.missing.length === 0;
        
        console.log(`[提示词管理] 模板检测完成: ${results.loaded}/${results.total} 已加载, ${results.custom} 个自定义`);
        
        return results;
    },
    
    getTemplateStatus() {
        const check = this.checkTemplates();
        return {
            success: check.success,
            total: check.total,
            loaded: check.loaded,
            custom: check.custom,
            missing: check.missing
        };
    },
    
    loadDefaultTemplates() {
        let loaded = 0;
        let skipped = 0;
        
        for (const [category, data] of Object.entries(this._presets)) {
            for (const preset of data.presets) {
                const existing = this.loadCustomTemplate(category, preset.id);
                if (existing) {
                    skipped++;
                    continue;
                }
                
                const defaultTemplate = this.getTemplate(category, preset.id);
                if (defaultTemplate && defaultTemplate.trim()) {
                    this.saveCustomTemplate(category, preset.id, defaultTemplate);
                    loaded++;
                }
            }
        }
        
        console.log(`[提示词管理] 一键载入完成: ${loaded} 个模板已载入, ${skipped} 个跳过(已存在)`);
        
        return {
            loaded,
            skipped,
            total: loaded + skipped
        };
    },
    
    resetAllTemplates() {
        let count = 0;
        
        for (const [category, data] of Object.entries(this._presets)) {
            for (const preset of data.presets) {
                this.deleteCustomTemplate(category, preset.id);
                count++;
            }
        }
        
        console.log(`[提示词管理] 已重置 ${count} 个模板`);
        
        return count;
    }
});
