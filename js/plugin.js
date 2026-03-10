const PluginSystem = {
    plugins: {},
    loaded: false,
    eventListeners: {},

    register(name, plugin) {
        if (this.plugins[name]) {
            console.warn(`Plugin ${name} already registered, overwriting...`);
        }
        this.plugins[name] = {
            ...plugin,
            name,
            enabled: true
        };
        console.log(`Plugin registered: ${name}`);
    },

    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    },

    unregister(name) {
        delete this.plugins[name];
    },

    enable(name) {
        if (this.plugins[name]) {
            this.plugins[name].enabled = true;
            this.plugins[name].onEnable?.();
        }
    },

    disable(name) {
        if (this.plugins[name]) {
            this.plugins[name].enabled = false;
            this.plugins[name].onDisable?.();
        }
    },

    get(name) {
        return this.plugins[name];
    },

    getAll() {
        return Object.values(this.plugins);
    },

    getEnabled() {
        return Object.values(this.plugins).filter(p => p.enabled);
    },

    async init() {
        if (this.loaded) return;
        
        for (const plugin of Object.values(this.plugins)) {
            if (plugin.enabled && plugin.init) {
                await plugin.init();
            }
        }
        this.loaded = true;
        console.log('All plugins initialized');
    },

    getFeatures() {
        return this.getEnabled().map(p => ({
            name: p.name,
            description: p.description,
            features: p.features || []
        }));
    },

    onPluginEvent(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    },

    triggerPluginEvent(eventName, data) {
        const enabledPlugins = this.getEnabled();
        
        for (const plugin of enabledPlugins) {
            if (plugin.onPluginEvent) {
                try {
                    plugin.onPluginEvent(eventName, data);
                } catch (e) {
                    console.error(`Plugin ${plugin.name} event error:`, e);
                }
            }
        }
        
        if (this.eventListeners[eventName]) {
            for (const callback of this.eventListeners[eventName]) {
                try {
                    callback(eventName, data);
                } catch (e) {
                    console.error(`Event listener error for ${eventName}:`, e);
                }
            }
        }
    }
};

window.PluginSystem = PluginSystem;
