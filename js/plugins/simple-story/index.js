PluginSystem.register('simple-story', {
    description: '简单故事模式 - 减少API提示词和输出内容，加快剧情速度',
    features: ['小故事模式', '快速API响应', '简短故事内容'],
    
    init() {
        console.log('Simple-story plugin loaded');
        this._initHooks();
    },
    
    _initHooks() {
        // 监听开始故事界面的渲染
        PluginSystem.on('storyStartUI', (data) => {
            this._addSimpleStoryOption(data);
        });
        
        // 监听故事生成前的提示词构建
        PluginSystem.on('beforeStoryGenerate', (data) => {
            if (data.simpleStoryMode) {
                this._modifyPromptForSimpleStory(data);
            }
        });
        
        // 监听故事生成后的内容处理
        PluginSystem.on('afterStoryGenerate', (data) => {
            if (data.simpleStoryMode) {
                this._limitOutputLength(data);
            }
        });
    },
    
    _addSimpleStoryOption(data) {
        if (!data || !data.container) return;
        
        // 在开始故事界面添加小故事模式选项
        const simpleStoryOption = document.createElement('div');
        simpleStoryOption.className = 'form-group';
        simpleStoryOption.innerHTML = `
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="simpleStoryMode" style="width: 18px; height: 18px;">
                <span>小故事模式（快速、简短）</span>
                <small style="color: var(--text-dim); font-size: 0.8rem; margin-left: 8px;">减少API提示词，限制输出100字以内</small>
            </label>
        `;
        
        // 插入到场景选择之后
        const sceneSelect = data.container.querySelector('.form-group');
        if (sceneSelect) {
            sceneSelect.after(simpleStoryOption);
        }
    },
    
    _modifyPromptForSimpleStory(data) {
        if (!data || !data.prompt) return;
        
        // 减少提示词长度，只保留核心信息
        const corePrompt = data.prompt
            .split('\n')
            .filter(line => line.includes('角色信息') || line.includes('场景设定') || line.includes('请生成'))
            .join('\n');
        
        // 添加小故事模式的限制
        const simplePrompt = `${corePrompt}\n\n要求：\n1. 故事长度控制在100字以内\n2. 情节简单直接\n3. 快速进入主题\n4. 语言简洁明了`;
        
        data.prompt = simplePrompt;
        console.log('[简单故事模式] 简化提示词');
    },
    
    _limitOutputLength(data) {
        if (!data || !data.content) return;
        
        // 限制输出内容长度在100字以内
        const limitedContent = data.content.substring(0, 100);
        data.content = limitedContent;
        console.log('[简单故事模式] 限制输出长度');
    },
    
    // 提供获取小故事模式状态的方法
    isSimpleStoryMode() {
        return window.simpleStoryMode === true;
    },
    
    // 提供故事生成上下文
    getStoryContext(worldId) {
        if (this.isSimpleStoryMode()) {
            return '\n【小故事模式】故事内容将控制在100字以内，情节简单直接。';
        }
        return '';
    }
});
