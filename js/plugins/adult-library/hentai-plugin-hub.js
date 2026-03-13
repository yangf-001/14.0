const HentaiPluginHub = {
    plugins: {},
    config: {},
    triggerMode: 'mixed',
    history: [],
    onUserTriggerConfirm: null,

    async init() {
        console.log('🎯 Hentai Plugin Hub Initializing...');
        
        await this.loadConfig();
        await this.loadPlugins();
        
        console.log('🎯 Hentai Plugin Hub Ready');
        console.log(`   Loaded plugins: ${Object.keys(this.plugins).length}`);
        console.log(`   Trigger mode: ${this.triggerMode}`);
    },
    
    async loadConfig() {
        const defaultConfig = {
            triggerMode: 'mixed',
            userTrigger: {
                enabled: true,
                requireConfirmation: true
            },
            combination: {
                intelligent: true,
                maxElements: 5,
                minElements: 2
            }
        };
        
        try {
            const saved = localStorage.getItem('hentaiPluginHub_config');
            this.config = saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
        } catch (e) {
            this.config = defaultConfig;
        }
        
        this.triggerMode = this.config.triggerMode || 'mixed';
    },
    
    saveConfig() {
        localStorage.setItem('hentaiPluginHub_config', JSON.stringify(this.config));
    },

    async loadPlugins() {
        this.plugins = {
            poses: {
                name: 'poses',
                category: 'poses',
                loaded: true,
                lastUsed: null,
                useCount: 0,
                getRandom: () => this.getRandomFromUserContent('poses'),
                getAll: () => HentaiUserContent?.getItems('poses') || []
            },
            actions: {
                name: 'actions',
                category: 'actions',
                loaded: true,
                lastUsed: null,
                useCount: 0,
                getRandom: () => this.getRandomFromUserContent('actions'),
                getAll: () => HentaiUserContent?.getItems('actions') || []
            },
            body: {
                name: 'body',
                category: 'body',
                loaded: true,
                lastUsed: null,
                useCount: 0,
                getRandom: () => this.getRandomFromUserContent('body'),
                getAll: () => HentaiUserContent?.getItems('body') || []
            },
            dialogue: {
                name: 'dialogue',
                category: 'dialogue',
                loaded: true,
                lastUsed: null,
                useCount: 0,
                getRandom: () => this.getRandomFromUserContent('dialogue'),
                getAll: () => HentaiUserContent?.getItems('dialogue') || []
            },
            locations: {
                name: 'locations',
                category: 'locations',
                loaded: true,
                lastUsed: null,
                useCount: 0,
                getRandom: () => this.getRandomFromUserContent('locations'),
                getAll: () => HentaiUserContent?.getItems('locations') || []
            },
            roles: {
                name: 'roles',
                category: 'roles',
                loaded: true,
                lastUsed: null,
                useCount: 0,
                getRandom: () => this.getRandomFromUserContent('roles'),
                getAll: () => HentaiUserContent?.getItems('roles') || []
            },
            style: {
                name: 'style',
                category: 'style',
                loaded: true,
                lastUsed: null,
                useCount: 0,
                getRandom: () => this.getRandomFromUserContent('style'),
                getAll: () => HentaiUserContent?.getItems('style') || []
            },
            toys: {
                name: 'toys',
                category: 'toys',
                loaded: true,
                lastUsed: null,
                useCount: 0,
                getRandom: () => this.getRandomFromUserContent('toys'),
                getAll: () => HentaiUserContent?.getItems('toys') || []
            },
            reference: {
                name: 'reference',
                category: 'reference',
                loaded: true,
                lastUsed: null,
                useCount: 0,
                getRandom: () => this.getRandomFromUserContent('reference'),
                getAll: () => HentaiUserContent?.getItems('reference') || []
            }
        };
    },
    
    getRandomFromUserContent(category) {
        const items = HentaiUserContent?.getItems(category) || [];
        if (items.length === 0) return null;
        return items[Math.floor(Math.random() * items.length)];
    },
    
    registerPlugin(name, plugin) {
        this.plugins[name] = {
            ...plugin,
            loaded: true,
            lastUsed: null,
            useCount: 0
        };
    },
    
    getPlugin(name) {
        return this.plugins[name];
    },
    
    getAllPlugins() {
        return Object.values(this.plugins);
    },
    
    getPluginCategories() {
        const categories = {};
        for (const [name, plugin] of Object.entries(this.plugins)) {
            const cat = plugin.category || 'other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push({ name, plugin });
        }
        return categories;
    },
    
    setTriggerMode(mode) {
        if (['user', 'mixed'].includes(mode)) {
            this.triggerMode = mode;
            this.config.triggerMode = mode;
            this.saveConfig();
        }
    },
    
    async checkTrigger(context) {
        const { triggerMode } = this;
        
        if (context.preferredPlugins && context.preferredPlugins.length > 0) {
            return await this.customTrigger(context);
        }
        
        if (triggerMode === 'user' || (triggerMode === 'mixed' && context.userRequested)) {
            return this.userTrigger(context);
        }
        
        if (triggerMode === 'mixed') {
            const scene = await this.generateScene(context);
            return {
                type: 'auto',
                scene,
                context,
                pending: false
            };
        }
        
        return null;
    },
    
    async customTrigger(context) {
        const { preferredPlugins } = context;
        
        const scene = await this.generateSceneFromPlugins(preferredPlugins, context);
        
        return {
            type: 'custom',
            scene,
            context,
            pending: false
        };
    },
    
    async generateSceneFromPlugins(plugins, context) {
        const elements = {};
        
        for (const pluginName of plugins) {
            const plugin = this.plugins[pluginName];
            if (plugin && plugin.getRandom) {
                const content = plugin.getRandom();
                if (content) {
                    elements[pluginName] = content;
                    plugin.useCount++;
                    plugin.lastUsed = Date.now();
                }
            }
        }
        
        this.history.push({
            timestamp: Date.now(),
            context,
            elements,
            type: 'custom'
        });
        
        if (this.history.length > 100) {
            this.history = this.history.slice(-100);
        }
        
        return elements;
    },
    
    userTrigger(context) {
        if (!this.config.userTrigger.enabled) return null;
        
        const suggestions = this.getSuggestions(context);
        
        return {
            type: 'user',
            suggestions,
            context,
            requireConfirmation: this.config.userTrigger.requireConfirmation
        };
    },
    
    getSuggestions(context) {
        const suggestions = [
            {
                type: 'full',
                label: '完整亲密互动',
                plugins: ['poses', 'dialogue', 'style', 'body', 'actions']
            },
            {
                type: 'passion',
                label: '激情互动',
                plugins: ['poses', 'actions', 'body', 'toys']
            },
            {
                type: 'romantic',
                label: '浪漫互动',
                plugins: ['dialogue', 'style', 'locations', 'roles']
            },
            {
                type: 'playful',
                label: '情趣互动',
                plugins: ['toys', 'actions', 'dialogue', 'style']
            }
        ];
        
        return suggestions;
    },
    
    async generateScene(context) {
        const { combination } = this.config;
        const elements = {};
        
        const pluginOrder = this.getPluginPriority(context);
        
        const numElements = Math.floor(
            Math.random() * (combination.maxElements - combination.minElements + 1)
        ) + combination.minElements;
        
        for (let i = 0; i < Math.min(numElements, pluginOrder.length); i++) {
            const pluginName = pluginOrder[i];
            const plugin = this.plugins[pluginName];
            
            if (plugin && plugin.getRandom) {
                const content = plugin.getRandom();
                if (content) {
                    elements[pluginName] = content;
                    plugin.useCount++;
                    plugin.lastUsed = Date.now();
                }
            }
        }
        
        this.history.push({
            timestamp: Date.now(),
            context,
            elements
        });
        
        if (this.history.length > 100) {
            this.history = this.history.slice(-100);
        }
        
        return elements;
    },
    
    getPluginPriority(context) {
        return ['poses', 'body', 'actions', 'dialogue', 'style', 'locations', 'roles', 'toys', 'reference'];
    },
    
    buildPrompt(elements, context) {
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
            prompt += `场景地点：${locName}`;
        }
        
        if (elements.roles) {
            const roleName = typeof elements.roles === 'object' ? elements.roles.name : elements.roles;
            prompt += `角色扮演：${roleName}`;
        }
        
        if (elements.toys) {
            const toyName = typeof elements.toys === 'object' ? elements.toys.name : elements.toys;
            prompt += `使用道具：${toyName}`;
        }
        
        if (elements.reference) {
            const refName = typeof elements.reference === 'object' ? elements.reference.name : elements.reference;
            const refDesc = typeof elements.reference === 'object' ? elements.reference.desc : '';
            prompt += `，参考词汇：${refName}${refDesc ? ' - ' + refDesc : ''}`;
        }
        
        return prompt || '生成亲密互动场景';
    },

    buildIntimatePrompt(elements, extraContext = '') {
        const basePrompt = this.buildPrompt(elements, {});
        
        const promptManager = window.PromptManagerPlugin;
        const intimateTemplate = promptManager ? promptManager.getTemplate('intimateInteraction', 'default') : '';
        
        let fullPrompt = basePrompt;
        if (intimateTemplate) {
            fullPrompt += '\n\n' + intimateTemplate;
            if (extraContext) {
                fullPrompt = fullPrompt.replace('[额外上下文]', extraContext);
            }
        } else {
            fullPrompt += `\n\n【亲密互动要求】
${extraContext ? extraContext + '\n' : ''}用词直白露骨，直接描写性器官接触、插入、抽动、高潮等细节。
描写要流畅如小说，避免罗列。
只描述亲密互动过程，自然融入剧情。`;
        }

        return fullPrompt;
    },
    
    getHistory() {
        return this.history;
    },
    
    clearHistory() {
        this.history = [];
    },
    
    getStats() {
        const stats = {};
        for (const [name, plugin] of Object.entries(this.plugins)) {
            stats[name] = {
                useCount: plugin.useCount || 0,
                lastUsed: plugin.lastUsed
            };
        }
        return stats;
    }
};

window.HentaiPluginHub = HentaiPluginHub;
