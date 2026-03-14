PluginSystem.register('prompt-manager', {
    description: 'AI提示词管理 - 统一管理所有AI提示词模板',
    features: ['模板管理', '预设模板', '自定义模板', '导入导出'],
    
    _presets: {},
    _templates: {},
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
                    { id: 'default', name: '默认模板', file: '故事生成/故事开头/默认模板.json' }
                ]
            },
            storyChoice: {
                name: '故事继续模板',
                description: '根据用户选择继续故事发展',
                presets: [
                    { id: 'default', name: '默认模板', file: '故事生成/故事继续/默认模板.json' }
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
                    { id: 'default', name: '默认模板', file: '选项生成/选项生成/默认模板.json' }
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
                        

                    }
                } catch (e) {
                    console.warn(`[提示词管理] 加载模板失败: ${preset.file}`, e);
                }
            }
        }
        
        this._loaded = true;
        console.log('[提示词管理] 模板加载完成');
    },
    
    getTemplate(category, presetId = 'default', stage = 1) {
        const customTemplate = this.loadCustomTemplate(category, presetId);
        if (customTemplate) {
            if (typeof customTemplate === 'object') {
                if (customTemplate.日常模式 && customTemplate.色色模式) {
                    const mode = stage === 2 ? customTemplate.色色模式 : customTemplate.日常模式;
                    return mode.描述 || JSON.stringify(mode);
                } else if (customTemplate.描述) {
                    return typeof customTemplate.描述 === 'string' ? customTemplate.描述 : JSON.stringify(customTemplate);
                }
                return JSON.stringify(customTemplate);
            }
            return customTemplate;
        }
        
        const template = this._templates[category]?.[presetId];
        if (!template) return '';
        
        if (typeof template === 'object') {
            if (template.template) {
                if (typeof template.template === 'object') {
                    if (template.template.日常模式 && template.template.色色模式) {
                        const mode = stage === 2 ? template.template.色色模式 : template.template.日常模式;
                        return mode.描述 || JSON.stringify(mode);
                    } else if (template.template.描述) {
                        return typeof template.template.描述 === 'string' ? template.template.描述 : JSON.stringify(template.template);
                    }
                }
                return typeof template.template === 'string' ? template.template : JSON.stringify(template.template);
            }
            if (template.systemRole || template.outputRules || template.stages) {
                return JSON.stringify(template);
            }
            return template.template || '';
        }
        
        return template || '';
    },
    
    getTemplateFull(category, presetId = 'default') {
        const customTemplate = this.loadCustomTemplateFull(category, presetId);
        if (customTemplate) {
            return customTemplate;
        }
        
        const template = this._templates[category]?.[presetId];
        if (!template) return null;
        
        if (typeof template === 'object' && template.template) {
            return template;
        }
        
        return null;
    },
    
    getTemplateWithPreset(category, presetId, variables = {}, stage = 1) {
        let template = this.getTemplate(category, presetId, stage);
        if (!template) return null;
        
        if (typeof template === 'object' && template.描述) {
            template = template.描述;
        }
        
        for (const [key, value] of Object.entries(variables)) {
            template = template.replace(new RegExp(`\[${key}\]`, 'g'), value);
        }
        
        return template;
    },
    
    getPresets(category) {
        if (!category) {
            return this._presets;
        }
        return this._presets[category] || null;
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
    
    loadCustomTemplateFull(category, presetId) {
        try {
            const key = `prompt_${category}_${presetId}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                return JSON.parse(saved);
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
                
                if (template && typeof template === 'string' && template.trim()) {
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
                if (defaultTemplate && typeof defaultTemplate === 'string' && defaultTemplate.trim()) {
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
    },
    
    importTemplates(data) {
        if (!data || !data.templates) {
            console.error('[提示词管理] 导入失败：数据格式错误');
            return { success: false, message: '数据格式错误' };
        }
        
        let imported = 0;
        let skipped = 0;
        
        for (const [category, categoryData] of Object.entries(data.templates)) {
            if (!categoryData.presets) continue;
            
            for (const [presetId, presetData] of Object.entries(categoryData.presets)) {
                if (presetData.template) {
                    this.saveCustomTemplate(category, presetId, presetData.template);
                    imported++;
                } else {
                    skipped++;
                }
            }
        }
        
        console.log(`[提示词管理] 导入完成：${imported} 个模板已导入，${skipped} 个跳过`);
        
        return { success: true, imported, skipped };
    }
});
