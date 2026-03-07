const HentaiUserContent = {
    basePath: '',
    cache: {},
    
    async init(basePathOverride) {
        console.log('📝 Hentai User Content Loader Initializing...');
        
        if (basePathOverride && !basePathOverride.includes('js/plugins/adult-library/js/plugins')) {
            this.basePath = basePathOverride;
        } else {
            const scripts = document.getElementsByTagName('script');
            for (let script of scripts) {
                if (script.src && script.src.includes('hentai-user-content.js')) {
                    const basePath = script.src.substring(0, script.src.lastIndexOf('/') + 1);
                    this.basePath = basePath + 'user-content/';
                    break;
                }
            }
            if (!this.basePath) {
                this.basePath = 'js/plugins/adult-library/user-content/';
            }
        }
        
        console.log('📝 Base path:', this.basePath);
        
        await this.loadAllUserContent();
        
        console.log('📝 User Content Loader Ready');
    },
    
    async loadAllUserContent() {
        const categories = ['poses', 'actions', 'body', 'dialogue', 'locations', 'roles', 'style', 'toys', 'rules', 'reference'];

        for (const category of categories) {
            await this.loadCategory(category);
        }
    },
    
    async loadCategory(category) {
        const files = [
            `${this.basePath}${category}.txt`,
            `${this.basePath}${category}.md`,
            `${this.basePath}${category}.json`
        ];
        
        for (const file of files) {
            try {
                const content = await this.fetchFile(file);
                if (content) {
                    this.parseContent(category, content, file);
                    return;
                }
            } catch (e) {
                // File doesn't exist, try next
            }
        }
    },
    
    async fetchFile(url) {
        console.log('📝 Fetching:', url);
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        reject(new Error('File not found'));
                        return;
                    }
                    return response.text();
                })
                .then(text => resolve(text))
                .catch(e => reject(e));
        });
    },
    
    parseContent(category, content, filename) {
        if (category === 'rules') {
            this.parseRulesContent(content, filename);
            return;
        }

        const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        
        const items = [];
        let currentGroup = 'default';
        
        for (const line of lines) {
            if (line.startsWith('[') && line.endsWith(']')) {
                currentGroup = line.slice(1, -1);
                continue;
            }
            
            if (line.includes('|')) {
                const parts = line.split('|').map(p => p.trim());
                items.push({
                    name: parts[0],
                    desc: parts[1] || '',
                    category: currentGroup,
                    tags: parts.slice(2).map(t => t.trim()).filter(t => t)
                });
            } else {
                items.push({
                    name: line,
                    desc: '',
                    category: currentGroup,
                    tags: []
                });
            }
        }
        
        this.cache[category] = items;
        
        this.registerToPlugin(category, items);
        
        console.log(`   Loaded ${items.length} items for ${category} from ${filename}`);
    },

    parseRulesContent(content, filename) {
        const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        
        const rules = [];
        let currentGroup = 'default';
        
        for (const line of lines) {
            if (line.startsWith('[') && line.endsWith(']')) {
                currentGroup = line.slice(1, -1);
                continue;
            }
            
            if (line.includes('|')) {
                const parts = line.split('|').map(p => p.trim());
                try {
                    const conditions = JSON.parse(parts[1]);
                    const actions = JSON.parse(parts[2]);
                    rules.push({
                        name: parts[0],
                        conditions,
                        actions,
                        group: currentGroup
                    });
                } catch (e) {
                    console.warn('Failed to parse rule:', parts[0], e);
                }
            }
        }
        
        this.cache['rules'] = rules;
        
        if (HentaiPluginHub) {
            HentaiPluginHub.config.ruleTrigger = HentaiPluginHub.config.ruleTrigger || {};
            HentaiPluginHub.config.ruleTrigger.rules = rules;
        }
        
        console.log(`   Loaded ${rules.length} rules from ${filename}`);
    },
    
    registerToPlugin(category, items) {
        const pluginName = `intimate-${category}`;
        const plugin = PluginSystem.get(pluginName);
        
        if (plugin && plugin.addUserItems) {
            plugin.addUserItems(items);
        } else if (plugin) {
            const data = plugin.getData ? plugin.getData() : {};
            
            if (!data.user) data.user = { name: '👤 用户自定义', items: [] };
            data.user.items = [...data.user.items, ...items];
            
            if (plugin.getRandomUser) {
                const originalGetRandom = plugin.getRandom.bind(plugin);
                plugin.getRandom = function(categoryId) {
                    if (categoryId === 'user' || !categoryId) {
                        const userItems = data.user.items;
                        if (userItems.length > 0) {
                            return userItems[Math.floor(Math.random() * userItems.length)];
                        }
                    }
                    return originalGetRandom(categoryId);
                };
            }
        }
    },
    
    addItem(category, item) {
        if (!this.cache[category]) {
            this.cache[category] = [];
        }
        
        this.cache[category].push(item);
        
        this.registerToPlugin(category, [item]);
    },
    
    removeItem(category, itemName) {
        if (!this.cache[category]) return;
        
        this.cache[category] = this.cache[category].filter(item => item.name !== itemName);
        
        this.registerToPlugin(category, this.cache[category]);
    },
    
    getItems(category) {
        return this.cache[category] || [];
    },
    
    searchItems(query) {
        const results = {};
        
        for (const [category, items] of Object.entries(this.cache)) {
            const matched = items.filter(item => 
                item.name.includes(query) || 
                item.desc.includes(query) ||
                item.tags.some(tag => tag.includes(query))
            );
            
            if (matched.length > 0) {
                results[category] = matched;
            }
        }
        
        return results;
    },
    
    exportTemplate(category) {
        const templates = {
            poses: `# 姿势模板
# 格式：名称|描述|标签1,标签2

[传统]
传教士|经典男上女下姿势|温柔,亲密
后入式|从背后进入|激烈,深入

[进阶]
火车便当|狭窄空间姿势|刺激

[情趣]
捆绑式|使用绳索捆绑|SM,束缚`,

            actions: `# 动作模板
# 格式：名称|描述|标签

[抚摸]
轻抚|轻柔地抚摸|温柔
揉捏|用力揉捏|激烈

[亲吻]
舌吻|深入亲吻|亲密
咬吻|轻轻咬舐|挑逗`,

            body: `# 身体部位模板
# 格式：名称|描述|敏感度

[上身]
乳房|女性重要敏感部位|高
乳头|极其敏感的部位|极高

[下身]
阴蒂|女性最敏感部位|极高
阴道|女性性器官|高`,

            dialogue: `# 对话模板
# 格式：对话内容|类型|情感

[调情]
你好美|调情|喜爱
想要你|调情|欲望

[喘息]
啊~|喘息|快感
好舒服|喘息|享受`,

            locations: `# 地点模板
# 格式：名称|描述|类型

[室内]
卧室|私密空间|私密
浴室|有水的地方|潮湿

[户外]
海滩|浪漫场所|浪漫
公园|隐蔽处|刺激`,

            roles: `# 角色模板
# 格式：名称|描述|服装

护士|医护人员角色|护士服
女仆|家务角色|女仆装
OL|办公室角色|职业装`,

            style: `# 风格模板
# 格式：名称|描述|强度

温柔|轻柔缓慢|低
激烈|用力快速|高
浪漫|有氛围|中`,

            toys: `# 道具模板
# 格式：名称|描述|类型

按摩棒|震动按摩|电动
跳蛋|小型震动|便携
眼罩|遮蔽视线|的情趣`,

            fetish: `# 特殊性癖模板
# 格式：名称|描述|强度

足交|使用脚进行|中等
乳交|使用胸部进行|中等
肛交|肛门性交|较高`
        };
        
        return templates[category] || '# 无模板';
    },
    
    getAllCategories() {
        return Object.keys(this.cache);
    },
    
    clearCache() {
        this.cache = {};
    },
    
    reload() {
        this.clearCache();
        return this.loadAllUserContent();
    }
};

window.HentaiUserContent = HentaiUserContent;
