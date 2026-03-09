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
        return btoa(encodeURIComponent(prompt.substring(0, 100) + JSON.stringify(options)));
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
            '短篇': this.CONSTANTS.MAX_TOKENS_SHORT,
            '中篇': this.CONSTANTS.MAX_TOKENS_STORY,
            '长篇': this.CONSTANTS.MAX_TOKENS
        };
        return lengthMap[length] || this.CONSTANTS.MAX_TOKENS_STORY;
    }

    async chat(messages, options = {}) {
        return this.call('', { ...options, system: messages[0]?.role === 'system' ? messages[0].content : '' });
    }

    async generateStory(prompt, settings) {
        const systemPrompt = this.buildSystemPrompt(settings);
        const options = {
            system: systemPrompt,
            length: settings.output?.length || '中篇'
        };
        return this.call(prompt, options);
    }

    buildSystemPrompt(settings) {
        const world = Data.getCurrentWorld();
        const worldId = world?.id;
        
        if (typeof StoryConfigPlugin !== 'undefined') {
            const pluginPrompt = StoryConfigPlugin.getWorldSystemPrompt(worldId);
            if (pluginPrompt) {
                const s = settings.content || {};
                let additionalPrompt = '';
                
                if (s.tone) additionalPrompt += `\n风格基调：${s.tone}`;
                if (s.detailLevel) additionalPrompt += `\n描写详细程度：${s.detailLevel}`;
                if (s.intimacy && s.intimacy > 0) {
                    const levels = ['纯爱', '暧昧', '亲密', '热烈', '激情', '淫乱', '重口'];
                    additionalPrompt += `\n亲密程度：${levels[Math.min(6, Math.floor(s.intimacy / 15))] || '纯爱'}`;
                }
                
                if (s.forbidden && s.forbidden.length > 0) {
                    additionalPrompt += `\n禁止内容：${s.forbidden.join('、')}`;
                }
                
                additionalPrompt += '\n\n【重要限制】剧情中女角色不能和陌生人、路人或其他未建立关系的角色进行亲密行为。所有互动必须由主角和已建立关系的角色完成，如果需要多人参与，请用主角的分身、神奇道具、魔法道具、玩具等来代替。';
                
                return pluginPrompt + additionalPrompt;
            }
        }
        
        const s = settings.content || {};
        let prompt = '你是一个色情故事生成AI。请用色情故事的方式呈现内容。专注于性场景的详细描写，包括肢体动作、内心描写、感官描写和语气描写。';
        
        if (s.tone) prompt += `\n风格基调：${s.tone}`;
        if (s.detailLevel) prompt += `\n描写详细程度：${s.detailLevel}`;
        if (s.intimacy && s.intimacy > 0) {
            const levels = ['纯爱', '暧昧', '亲密', '热烈', '激情', '淫乱', '重口'];
            prompt += `\n亲密程度：${levels[Math.min(6, Math.floor(s.intimacy / 15))] || '纯爱'}`;
        }
        
        if (s.forbidden && s.forbidden.length > 0) {
            prompt += `\n禁止内容：${s.forbidden.join('、')}`;
        }
        
        prompt += '\n请用故事的方式呈现内容。重要提示：只输出故事正文内容，不要包含任何选项、后续发展、剧情走向、选择提示等信息。用词直白露骨，直接描写性器官接触、插入、抽动、高潮等细节。';
        
        prompt += '\n\n【重要限制】剧情中女角色不能和陌生人、路人或其他未建立关系的角色进行亲密行为。所有互动必须由主角和已建立关系的角色完成，如果需要多人参与，请用主角的分身、神奇道具、魔法道具、玩具等来代替。';
        
        return prompt;
    }

    clearCache() {
        this._cache.clear();
    }
}

const ai = new AI();
window.ai = ai;
