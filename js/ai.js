class AI {
    constructor() {
        this.config = this.loadConfig();
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
            model: 'deepseek-chat'
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

    async call(prompt, options = {}) {
        if (!this.config.apiKey) throw new Error('请先配置API密钥');

        const messages = [];
        if (options.system) messages.push({ role: 'system', content: options.system });
        messages.push({ role: 'user', content: prompt });

        const body = {
            model: options.model || this.config.model || 'deepseek-chat',
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.config.apiKey
        };

        const response = await fetch(this.getEndpoint(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API错误 (${response.status}): ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async chat(messages, options = {}) {
        return this.call('', { ...options, system: messages[0]?.role === 'system' ? messages[0].content : '' });
    }

    async generateStory(prompt, settings) {
        const systemPrompt = this.buildSystemPrompt(settings);
        return this.call(prompt, { system: systemPrompt });
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
                    const levels = ['纯爱', '暧昧', '亲密', '热烈', '激情'];
                    additionalPrompt += `\n亲密程度：${levels[Math.min(4, Math.floor(s.intimacy / 25))] || '纯爱'}`;
                }
                
                if (s.forbidden && s.forbidden.length > 0) {
                    additionalPrompt += `\n禁止内容：${s.forbidden.join('、')}`;
                }
                
                return pluginPrompt + additionalPrompt;
            }
        }
        
        const s = settings.content || {};
        let prompt = '你是一个故事生成AI。';
        
        if (s.tone) prompt += `\n风格基调：${s.tone}`;
        if (s.detailLevel) prompt += `\n描写详细程度：${s.detailLevel}`;
        if (s.intimacy && s.intimacy > 0) {
            const levels = ['纯爱', '暧昧', '亲密', '热烈', '激情'];
            prompt += `\n亲密程度：${levels[Math.min(4, Math.floor(s.intimacy / 25))] || '纯爱'}`;
        }
        
        if (s.forbidden && s.forbidden.length > 0) {
            prompt += `\n禁止内容：${s.forbidden.join('、')}`;
        }
        
        prompt += '\n请用故事的方式呈现内容。重要提示：只输出故事正文内容，不要包含任何选项、后续发展、剧情走向、选择提示等信息。';
        return prompt;
    }
}

const ai = new AI();
window.ai = ai;
