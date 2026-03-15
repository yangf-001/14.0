class AI {
    constructor() {
        this.CONSTANTS = {
            DEFAULT_TIMEOUT: 60000,
            MAX_TOKENS: 2048,
            MIN_TOKENS: 100,
            MAX_TOKENS_STORY: 1500,
            MAX_TOKENS_SHORT: 500,
            CACHE_EXPIRY: 300000,
            MAX_CACHE_SIZE: 100
        };
        this.config = this.loadConfig();
        this._cache = new Map();
        this._pendingRequests = new Map();
    }

    loadConfig() {
        const stored = localStorage.getItem('ai_config');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) {}
        }
        return {
            provider: 'DeepSeek',
            apiKey: localStorage.getItem('apiKey') || '',
            endpoint: localStorage.getItem('apiEndpoint') || 'https://api.deepseek.com',
            model: 'deepseek-chat',
            maxTokens: this.CONSTANTS.MAX_TOKENS,
            timeout: this.CONSTANTS.DEFAULT_TIMEOUT
        };
    }

    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('ai_config', JSON.stringify(this.config));
    }

    async testConnection() {
        if (!this.config.apiKey) {
            return { success: false, error: '请先配置 API Key' };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(this.getEndpoint(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.config.apiKey
                },
                body: JSON.stringify({
                    model: this.config.model || 'deepseek-chat',
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 10
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return { success: true, message: '连接成功！API 配置正确。' };
            } else {
                const error = await response.text();
                return { success: false, error: `API 错误 (${response.status}): ${error.substring(0, 100)}` };
            }
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                return { success: false, error: '请求超时，请检查网络连接' };
            }
            return { success: false, error: err.message };
        }
    }

    getEndpoint() {
        let endpoint = this.config.endpoint;
        if (!endpoint) {
            const endpoints = { 'DeepSeek': 'https://api.deepseek.com/v1/chat/completions' };
            return endpoints[this.config.provider] || endpoints['DeepSeek'];
        }
        if (endpoint.includes('/v1/')) return endpoint;
        return endpoint + '/v1/chat/completions';
    }

    _generateCacheKey(prompt, options) {
        return btoa(encodeURIComponent(prompt + JSON.stringify(options)));
    }

    _getFromCache(key) {
        const cached = this._cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CONSTANTS.CACHE_EXPIRY) {
            return cached.content;
        }
        this._cache.delete(key);
        return null;
    }

    _saveToCache(key, content) {
        if (this._cache.size >= this.CONSTANTS.MAX_CACHE_SIZE) {
            const firstKey = this._cache.keys().next().value;
            this._cache.delete(firstKey);
        }
        this._cache.set(key, { content, timestamp: Date.now() });
    }

    _removePendingRequest(key) {
        this._pendingRequests.delete(key);
    }

    cancelAllRequests() {
        this._pendingRequests.forEach((controller, key) => {
            controller.abort();
        });
        this._pendingRequests.clear();
    }

    cancelRequest(key) {
        const controller = this._pendingRequests.get(key);
        if (controller) {
            controller.abort();
            this._pendingRequests.delete(key);
        }
    }

    async call(prompt, options = {}) {
        if (!this.config.apiKey) {
            throw new Error('请先配置API密钥');
        }

        // 如果没有传入系统提示词，则从提示词插件获取
        if (!options.system) {
            const promptManager = window.PromptManagerPlugin;
            if (promptManager) {
                const systemTemplate = promptManager.getTemplate('system', 'default');
                if (systemTemplate && typeof systemTemplate === 'string' && systemTemplate.trim()) {
                    options.system = systemTemplate;
                }
            }
        }

        const cacheKey = this._generateCacheKey(prompt, options);
        const cachedContent = this._getFromCache(cacheKey);
        if (cachedContent) {
            console.log('[AI] 使用缓存响应');
            return cachedContent;
        }

        if (this._pendingRequests.has(cacheKey)) {
            console.log('[AI] 相同请求正在进行中');
        }

        const controller = new AbortController();
        this._pendingRequests.set(cacheKey, controller);

        const messages = [];
        if (options.system) messages.push({ role: 'system', content: options.system });
        messages.push({ role: 'user', content: prompt });

        const maxTokens = this._calculateMaxTokens(options);

        const body = {
            model: options.model || this.config.model || 'deepseek-chat',
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? maxTokens
        };

        console.log('========== [AI] 输入 ==========');
        if (options.system) {
            console.log('系统:', options.system.substring(0, 300));
        }
        console.log('用户:', prompt.substring(0, 500));
        console.log('===============================');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.config.apiKey
        };

        const timeout = options.timeout || this.config.timeout || this.CONSTANTS.DEFAULT_TIMEOUT;
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(this.getEndpoint(), {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            this._pendingRequests.delete(cacheKey);

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`API错误 (${response.status}): ${error}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            console.log('========== [AI] 输出 ==========');
            console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
            console.log('==============================');

            this._saveToCache(cacheKey, content);
            return content;
        } catch (err) {
            clearTimeout(timeoutId);
            this._pendingRequests.delete(cacheKey);
            
            if (err.name === 'AbortError') {
                throw new Error(`请求超时 (${timeout/1000}秒)，请检查网络连接或增加超时时间`);
            }
            throw err;
        }
    }

    _calculateMaxTokens(options) {
        if (options.maxTokens) return options.maxTokens;
        
        const length = options.length || '中篇';
        const lengthMap = {
            '短篇': 500,  // 对应100-300字
            '中篇': 800,  // 对应300-500字
            '长篇': 1200  // 对应500-800字
        };
        return lengthMap[length] || 800;
    }

    async chat(messages, options = {}) {
        return this.call('', { ...options, system: messages[0]?.role === 'system' ? messages[0].content : '' });
    }

    clearCache() {
        this._cache.clear();
    }
}

const ai = new AI();
window.ai = ai;
