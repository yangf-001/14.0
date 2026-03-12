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
                this.basePath = './js/plugins/adult-library/user-content/';
            }
        }
        
        console.log('📝 Base path:', this.basePath);
        
        await this.loadAllUserContent();
        
        console.log('📝 User Content Loader Ready');
    },
    
    async loadAllUserContent() {
        const categories = ['poses', 'actions', 'body', 'dialogue', 'locations', 'roles', 'style', 'toys', 'reference'];

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
            }
        }
    },
    
    async fetchFile(url) {
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
        console.log(`   Loaded ${items.length} items for ${category} from ${filename}`);
    },
    
    getItems(category) {
        return this.cache[category] || [];
    },
    
    getAllCategories() {
        return Object.keys(this.cache);
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
    
    getRandomItem(category) {
        const items = this.cache[category] || [];
        if (items.length === 0) return null;
        return items[Math.floor(Math.random() * items.length)];
    },
    
    getRandomItems(category, count) {
        const items = this.cache[category] || [];
        if (items.length === 0) return [];
        
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
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
