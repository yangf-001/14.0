const Intimate = {
    _categories: null,
    _items: null,
    _lastElements: null,
    
    async showTriggerModal() {
        if (typeof HentaiIntegration === 'undefined') {
            await this._loadHentaiPlugin();
        }

        if (typeof HentaiIntegration === 'undefined') {
            alert('色色插件未加载，请确保插件已启用');
            return;
        }

        await HentaiIntegration.init();

        const world = Data.getCurrentWorld();
        const settings = world ? Settings.get(world.id) : null;
        const intensity = settings?.adult?.intensity ?? 30;

        this._categories = this._getCategories();
        this._items = this._loadItems();

        const modalContent = this._buildModalContent();
        App.namespace.modal.show('💕 亲密互动', modalContent);

        setTimeout(() => {
            const toggles = document.querySelectorAll('.intimate-category-toggle');
            if (toggles.length > 0) {
                toggles[0].checked = true;
                this.toggleCategory(toggles[0].value);
            }
        }, 100);
    },
    
    _getCategories() {
        return [
            { id: 'poses', name: '姿势', icon: '💑', desc: '体位和姿势' },
            { id: 'actions', name: '动作', icon: '👋', desc: '具体行为' },
            { id: 'body', name: '身体', icon: '💋', desc: '触碰部位' },
            { id: 'dialogue', name: '对话', icon: '💬', desc: '言语交流' },
            { id: 'style', name: '风格', icon: '✨', desc: '进行风格' },
            { id: 'locations', name: '地点', icon: '🏠', desc: '场所' },
            { id: 'roles', name: '角色', icon: '🎭', desc: '角色分工' },
            { id: 'toys', name: '道具', icon: '🎀', desc: '辅助道具' }
        ];
    },
    
    _loadItems() {
        const items = {};
        for (const cat of this._categories) {
            items[cat.id] = HentaiUserContent?.getItems(cat.id) || [];
        }
        return items;
    },
    
    _buildModalContent() {
        const categoryHtml = this._categories.map(cat => {
            const items = this._items[cat.id] || [];
            const optionsHtml = items.map((item, idx) => `
                <label style="display: block; padding: 8px 12px; background: var(--bg); border-radius: 6px; cursor: pointer; margin-bottom: 4px; transition: all 0.2s;"
                       onmouseover="this.style.background='var(--accent-dim)'" 
                       onmouseout="this.style.background='var(--bg)'">
                    <input type="radio" name="intimate_${cat.id}" value="${item.name}" data-cat="${cat.id}" ${idx === 0 ? 'checked' : ''}>
                    <span style="margin-left: 8px; font-weight: 500;">${item.name}</span>
                    ${item.desc ? `<span style="font-size: 0.75rem; color: var(--text-dim); margin-left: 8px;">${item.desc}</span>` : ''}
                </label>
            `).join('');

            return `
                <div class="intimate-category-item" data-cat="${cat.id}" style="margin-bottom: 12px; padding: 12px; background: var(--border); border-radius: 8px; opacity: 0.5;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
                        <input type="checkbox" class="intimate-category-toggle" value="${cat.id}" onchange="App.namespace.intimate.toggleCategory('${cat.id}')">
                        <span style="font-size: 1.2rem;">${cat.icon}</span>
                        <span style="font-weight: bold;">${cat.name}</span>
                        <span style="font-size: 0.8rem; color: var(--text-dim);">${cat.desc}</span>
                    </label>
                    <div class="intimate-category-options" id="options_${cat.id}" style="max-height: 400px; overflow-y: auto; padding: 8px; background: var(--bg); border-radius: 8px; display: none;">
                        ${optionsHtml || '<div style="color: var(--text-dim); text-align: center;">无可用选项</div>'}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <p style="margin-bottom: 12px; font-size: 0.9rem;">选择要包含的元素（勾选类别后选择具体内容）：</p>
            <div style="max-height: 60vh; overflow-y: auto; padding-right: 8px;">
                ${categoryHtml}
            </div>
            <button class="btn" onclick="App.namespace.intimate.generateSelected()" style="width: 100%; margin-top: 16px; background: linear-gradient(135deg, #ff69b4, #ff1493);">✨ 生成亲密互动</button>
            <button class="btn btn-secondary" onclick="App.namespace.modal.close()" style="width: 100%; margin-top: 8px;">取消</button>
        `;
    },
    
    toggleCategory(catId) {
        const checkbox = document.querySelector(`.intimate-category-toggle[value="${catId}"]`);
        const categoryItem = document.querySelector(`.intimate-category-item[data-cat="${catId}"]`);
        const optionsDiv = document.getElementById(`options_${catId}`);
        const radios = document.querySelectorAll(`input[data-cat="${catId}"]`);
        
        if (checkbox && categoryItem && optionsDiv) {
            const isChecked = checkbox.checked;
            categoryItem.style.opacity = isChecked ? '1' : '0.5';
            optionsDiv.style.display = isChecked ? 'block' : 'none';
            
            radios.forEach(r => r.disabled = !isChecked);
        }
    },
    
    generateSelected() {
        const selectedElements = {};

        for (const cat of this._categories) {
            const checkbox = document.querySelector(`.intimate-category-toggle[value="${cat.id}"]`);
            if (checkbox && checkbox.checked) {
                const selected = document.querySelector(`input[name="intimate_${cat.id}"]:checked`);
                if (selected) {
                    const items = this._items[cat.id] || [];
                    const item = items.find(i => i.name === selected.value);
                    if (item) {
                        selectedElements[cat.id] = item;
                    }
                }
            }
        }

        if (Object.keys(selectedElements).length === 0) {
            alert('请至少选择一个元素');
            return;
        }

        const prompt = this._buildPrompt(selectedElements);

        App.namespace.modal.close();

        const previewContent = this._buildPreviewContent(selectedElements, prompt);
        App.namespace.modal.show('💕 亲密互动', previewContent);

        this._lastElements = selectedElements;
    },
    
    _buildPrompt(elements) {
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
            prompt += `，场景地点：${locName}`;
        }
        
        if (elements.roles) {
            const roleName = typeof elements.roles === 'object' ? elements.roles.name : elements.roles;
            prompt += `，角色分工：${roleName}`;
        }
        
        if (elements.toys) {
            const toyName = typeof elements.toys === 'object' ? elements.toys.name : elements.toys;
            prompt += `，使用道具：${toyName}`;
        }
        
        return prompt || '进行亲密互动';
    },
    
    _buildPreviewContent(elements, prompt) {
        return `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">场景元素</div>
                <pre style="background: var(--border); padding: 12px; border-radius: 8px; font-size: 0.85rem; max-height: 200px; overflow-y: auto;">${JSON.stringify(elements, null, 2)}</pre>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">生成提示</div>
                <div style="background: linear-gradient(135deg, #fff0f5, #ffe4e9); padding: 12px; border-radius: 8px; border-left: 3px solid var(--accent);">
                    ${prompt}
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn" onclick="App.namespace.intimate.applyToStory('${prompt.replace(/'/g, "\\'")}')" style="flex: 1; background: linear-gradient(135deg, #ff69b4, #ff1493);">✨ 应用到故事</button>
                <button class="btn btn-secondary" onclick="App.namespace.modal.close()">关闭</button>
            </div>
        `;
    },
    
    applyToStory(prompt) {
        App.namespace.modal.close();
        // 这里需要调用故事继续逻辑
        App.namespace.storyController.continueStoryWithIntimate(prompt);
    },
    
    async showCustomIntimateSelect() {
        const context = window._currentIntimateContext || {
            affection: 50,
            arousal: 40,
            location: 'bedroom',
            time: new Date().getHours()
        };
        
        // 这里可以实现自定义亲密互动选择的逻辑
        // 暂时留空，后续可以根据需要实现
    },
    
    async _loadHentaiPlugin() {
        LoadingManager.show('正在加载色色插件...', true);
        
        return new Promise((resolve) => {
            const scripts = [
                'js/plugins/adult-library/hentai-plugin-hub.js',
                'js/plugins/adult-library/hentai-user-content.js',
                'js/plugins/adult-library/hentai-integration.js'
            ];
            
            let loadedCount = 0;
            let failedCount = 0;
            const failedScripts = [];
            
            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loadedCount++;
                    LoadingManager.updateMessage(`加载插件 ${loadedCount}/${scripts.length}...`);
                    if (loadedCount === scripts.length) {
                        if (typeof HentaiUserContent !== 'undefined') {
                            LoadingManager.updateMessage('初始化色色内容...');
                            HentaiUserContent.init().then(() => {
                                console.log('色色插件已加载');
                                LoadingManager.hide();
                                resolve();
                            });
                        } else {
                            console.log('色色插件已加载');
                            LoadingManager.hide();
                            resolve();
                        }
                    }
                };
                script.onerror = () => {
                    console.error('加载失败:', src);
                    failedCount++;
                    failedScripts.push(src);
                    loadedCount++;
                    if (loadedCount === scripts.length) {
                        LoadingManager.hide();
                        if (failedCount === scripts.length) {
                            alert('⚠️ 色色插件加载失败，请检查网络连接后刷新页面重试');
                        } else if (failedCount > 0) {
                            console.warn('部分插件加载失败:', failedScripts);
                            alert(`⚠️ 部分插件加载失败: ${failedScripts.length}个\n请联系开发者获取帮助`);
                        }
                        resolve();
                    }
                };
                document.head.appendChild(script);
            });
        });
    }
};

// 暴露到全局
window.showIntimateTriggerModal = function() {
    Intimate.showTriggerModal();
};

window.toggleIntimateCategory = function(catId) {
    Intimate.toggleCategory(catId);
};

window.generateSelectedIntimate = function() {
    Intimate.generateSelected();
};

window.showCustomIntimateSelect = function() {
    Intimate.showCustomIntimateSelect();
};