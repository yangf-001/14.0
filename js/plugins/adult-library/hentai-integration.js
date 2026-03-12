const HentaiIntegration = {
    initialized: false,
    
    async init() {
        console.log('🎭 Hentai System Integration Starting...');
        
        if (typeof HentaiUserContent !== 'undefined') {
            await HentaiUserContent.init();
        }
        
        await HentaiPluginHub.init();
        
        this.initialized = true;
        console.log('🎭 Hentai System Ready!');
        
        return this;
    },
    
    async trigger(context = {}) {
        if (!this.initialized) {
            await this.init();
        }
        
        const result = await HentaiPluginHub.checkTrigger(context);
        
        if (result && result.scene) {
            const prompt = HentaiPluginHub.buildIntimatePrompt(result.scene, context.extraContext || '');
            return {
                triggered: true,
                type: result.type,
                scene: result.scene,
                prompt,
                context
            };
        }
        
        return { triggered: false, context };
    },
    
    manualTrigger(context = {}) {
        if (!this.initialized) {
            return { triggered: false, error: 'Not initialized' };
        }
        
        const result = HentaiPluginHub.userTrigger(context);
        
        if (result && result.suggestions) {
            return {
                triggered: true,
                type: 'manual',
                suggestions: result.suggestions,
                context
            };
        }
        
        return { triggered: false, context };
    },
    
    async generateFromPlugins(plugins, context = {}) {
        if (!this.initialized) {
            await this.init();
        }
        
        const scene = await HentaiPluginHub.generateSceneFromPlugins(plugins, context);
        const prompt = HentaiPluginHub.buildIntimatePrompt(scene, context.extraContext || '');
        
        return { scene, prompt, context };
    },
    
    async generateScene(context = {}) {
        if (!this.initialized) {
            await this.init();
        }
        
        const scene = await HentaiPluginHub.generateScene(context);
        const prompt = HentaiPluginHub.buildIntimatePrompt(scene, context.extraContext || '');
        
        return { scene, prompt, context };
    },
    
    buildPrompt(elements, extraContext = '') {
        return HentaiPluginHub.buildIntimatePrompt(elements, extraContext);
    },
    
    setTriggerMode(mode) {
        HentaiPluginHub.setTriggerMode(mode);
    },
    
    getTriggerMode() {
        return HentaiPluginHub.triggerMode;
    },
    
    getPlugins() {
        return HentaiPluginHub.getAllPlugins();
    },
    
    getPlugin(name) {
        return HentaiPluginHub.getPlugin(name);
    },
    
    getHistory() {
        return HentaiPluginHub.getHistory();
    },
    
    clearHistory() {
        HentaiPluginHub.clearHistory();
    },
    
    getStats() {
        return HentaiPluginHub.getStats();
    },
    
    getUserContent(category) {
        if (typeof HentaiUserContent !== 'undefined') {
            return HentaiUserContent.getItems(category);
        }
        return [];
    },
    
    searchUserContent(query) {
        if (typeof HentaiUserContent !== 'undefined') {
            return HentaiUserContent.searchItems(query);
        }
        return {};
    },
    
    reloadUserContent() {
        if (typeof HentaiUserContent !== 'undefined') {
            return HentaiUserContent.reload();
        }
    },
    
    getSystemStatus() {
        return {
            initialized: this.initialized,
            triggerMode: this.getTriggerMode(),
            pluginsLoaded: Object.keys(HentaiPluginHub.plugins).length,
            historyLength: HentaiPluginHub.history.length,
            stats: this.getStats()
        };
    }
};

window.HentaiIntegration = HentaiIntegration;
