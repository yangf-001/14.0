const mobileNavItems = [
    { page: 'home', icon: '🏠', label: '首页' },
    { page: 'worlds', icon: '🌍', label: '世界' },
    { page: 'characters', icon: '👤', label: '角色' },
    { page: 'story', icon: '📖', label: '故事' },
    { page: 'simple-story', icon: '⚡', label: '小故事' },
    { page: 'chat', icon: '💬', label: '聊天' },
    { page: 'story-config', icon: '📝', label: 'AI设置' },
    { page: 'storage', icon: '📦', label: '存储库' },
    { page: 'settings', icon: '⚙️', label: '设置' },
    { page: 'plugins', icon: '🔌', label: '插件' }
];

const Router = {
    async showPage(page) {
        App.currentPage = page;
        
        const desktopNavBtns = document.querySelectorAll('.nav-btn');
        if (desktopNavBtns.length > 0) {
            desktopNavBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.page === page);
            });
        }
        
        this.updateMobileNavActive(page);
        
        const main = document.getElementById('mainContent');
        const right = document.getElementById('rightPanel');
        
        switch(page) {
            case 'home': Pages.renderHome(main, right); break;
            case 'worlds': Pages.renderWorlds(main); break;
            case 'characters': Pages.renderCharacters(main); break;
            case 'story': Pages.renderStory(main); break;
            case 'simple-story': Pages.renderSimpleStory(main); break;
            case 'chat': await Pages.renderChat(main); break;
            case 'story-config': Pages.renderStoryConfig(main); break;
            case 'storage': Storage.renderStorage(main); break;
            case 'settings': Pages.renderSettings(main); break;
            case 'plugins': Pages.renderPlugins(main); break;
        }
    },
    
    setupNav() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.showPage(btn.dataset.page);
            });
        });
    },
    
    setupMobileNav() {
        const mobileNav = document.getElementById('mobileNav');
        if (!mobileNav) return;
        
        const navHtml = mobileNavItems.map(item => `
            <button class="mobile-nav-btn ${App.currentPage === item.page ? 'active' : ''}" data-page="${item.page}">
                <span class="icon">${item.icon}</span>
                <span class="label">${item.label}</span>
            </button>
        `).join('');
        
        mobileNav.innerHTML = navHtml;
        
        mobileNav.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.showPage(page);
                this.updateMobileNavActive(page);
            });
        });
    },
    
    updateMobileNavActive(page) {
        const mobileNav = document.getElementById('mobileNav');
        if (!mobileNav) return;
        
        mobileNav.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
    },
    
    selectWorld(id) {
        Data.setCurrentWorld(id);
        this.showPage('home');
    },
    
    showStorySettings() {
        this.showPage('story-config');
    },
    
    showCharSelector() {
        const selector = document.getElementById('storyCharSelector');
        if (selector) {
            selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
        }
    },
    
    saveAndArchive() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const story = Story.load(world.id);
        if (!story || story.status !== 'ongoing') return;
        
        try {
            const archive = Story.end();
            alert('故事已存档！');
            this.showPage('story');
        } catch (err) {
            alert('存档失败：' + err.message);
        }
    },
    
    restartStory() {
        if (confirm('确定要重新开始故事吗？')) {
            const world = Data.getCurrentWorld();
            if (world) {
                Data.deleteStory(world.id);
                this.showPage('story');
            }
        }
    },
    
    startNewStory() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const title = document.getElementById('storyTitle').value || '未命名故事';
        const type = document.getElementById('storyType').value;
        const summary = document.getElementById('storySummary').value;
        
        try {
            Story.start({
                title: title,
                type: type,
                summary: summary,
                characters: []
            });
            this.showPage('story');
        } catch (err) {
            alert('错误：' + err.message);
        }
    },
    
    toggleCharSelection(charId) {
        const card = document.querySelector(`.char-select-card[data-char-id="${charId}"]`);
        if (card) {
            card.classList.toggle('selected');
        }
    },
    
    showCreateWorld() {
        const formContent = App.namespace.forms.generateWorldForm(false);
        const modalContent = `
            ${formContent}
            <button class="btn" onclick="App.namespace.router.createWorld()">创建</button>
        `;
        App.namespace.modal.show('创建世界', modalContent);
    },
    
    createWorld() {
        const formData = App.namespace.forms.getWorldFormData();
        if (!formData.name) return;
        const world = Data.createWorld(formData);
        Data.setCurrentWorld(world.id);
        
        if (typeof AchievementPlugin !== 'undefined') {
            AchievementPlugin.updateStats('world_create');
        }
        
        App.namespace.modal.close();
        this.showPage('worlds');
    },
    
    editWorld(id) {
        const world = Data.getWorlds().find(w => w.id === id);
        if (!world) return;
        const formContent = App.namespace.forms.generateWorldForm(true, world);
        const modalContent = `
            ${formContent}
            <button class="btn" onclick="App.namespace.router.updateWorld('${id}')">保存</button>
        `;
        App.namespace.modal.show('编辑世界', modalContent);
    },
    
    updateWorld(id) {
        const formData = App.namespace.forms.getWorldFormData();
        Data.updateWorld(id, formData);
        App.namespace.modal.close();
        this.showPage('worlds');
    },
    
    deleteWorld(id) {
        if (confirm('确定删除？')) {
            Data.deleteWorld(id);
            this.showPage('worlds');
        }
    },
    
    showCreateCharacter() {
        const formContent = App.namespace.forms.generateCharacterForm(false);
        const modalContent = `
            ${formContent}
            <button class="btn" onclick="App.namespace.router.createCharacter()">添加</button>
        `;
        App.namespace.modal.show('添加角色', modalContent);
    },
    
    createCharacter() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        const formData = App.namespace.forms.getCharacterFormData();
        if (!formData.name) return;
        
        const charData = {
            ...formData,
            appearance: document.getElementById('charAppearance')?.value || '',
            personality: document.getElementById('charPersonality')?.value || ''
        };
        
        Data.createCharacter(world.id, charData);
        
        if (typeof AchievementPlugin !== 'undefined') {
            AchievementPlugin.updateStats('character_create');
        }
        
        App.namespace.modal.close();
        this.showPage('characters');
    },
    
    editCharacter(id) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        const char = Data.getCharacter(world.id, id);
        if (!char) return;
        const formContent = App.namespace.forms.generateCharacterForm(true, char);
        const modalContent = `
            ${formContent}
            <button class="btn" onclick="App.namespace.router.updateCharacter('${id}')">保存</button>
        `;
        App.namespace.modal.show('编辑角色', modalContent);
    },
    
    updateCharacter(id) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        const formData = App.namespace.forms.getCharacterFormData();
        Data.updateCharacter(world.id, id, formData);
        App.namespace.modal.close();
        this.showPage('characters');
    },
    
    deleteCharacter(id) {
        if (confirm('确定删除？')) {
            const world = Data.getCurrentWorld();
            Data.deleteCharacter(world.id, id);
            this.showPage('characters');
        }
    },
    
    onPlayerCharChange() {
        const select = document.getElementById('playerCharSelect');
        const customGroup = document.getElementById('customCharGroup');
        if (select?.value === 'custom') {
            customGroup.style.display = 'block';
        } else {
            customGroup.style.display = 'none';
        }
    },
    
    showStoryCharSelector() {
        const selector = document.getElementById('storyCharSelector');
        selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
    },

    getRecommendedChars() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const characters = Data.getCharacters(world.id);
        if (!characters || characters.length === 0) return;
        
        const story = window.Story?.current;
        const lastContent = story?.scenes?.slice(-1)[0]?.content || '';
        
        let recommended = [];
        
        if (lastContent) {
            const charNames = characters.map(c => c.name);
            const mentionedChars = charNames.filter(name => 
                lastContent.includes(name)
            );
            
            if (mentionedChars.length > 0) {
                recommended = characters.filter(c => mentionedChars.includes(c.name));
            }
        }
        
        if (recommended.length === 0 && story?.characters?.length > 0) {
            const currentCharIds = story.characters.map(c => c.id || c);
            recommended = characters.filter(c => currentCharIds.includes(c.id));
        }
        
        if (recommended.length === 0) {
            recommended = characters.slice(0, 3);
        }
        
        const container = document.getElementById('recommendedChars');
        const listContainer = document.getElementById('recommendedCharsList');
        
        if (container && listContainer) {
            container.style.display = 'block';
            listContainer.innerHTML = recommended.map(c => `
                <label style="display: flex; align-items: center; gap: 4px; padding: 4px 8px; background: var(--bg); border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                    <input type="checkbox" name="storyCharsContinue" value="${c.id}" ${story?.characters?.some(sc => (sc.id || sc) === c.id) ? 'checked' : ''}>
                    ${c.name}
                </label>
            `).join('');
        }
    }
};

window.showPage = function(page) {
    Router.showPage(page);
};

window.selectWorld = function(id) {
    Router.selectWorld(id);
};

window.showStorySettings = function() {
    Router.showStorySettings();
};

window.showCharSelector = function() {
    Router.showCharSelector();
};

window.saveAndArchive = function() {
    Router.saveAndArchive();
};

window.restartStory = function() {
    Router.restartStory();
};

window.startNewStory = function() {
    Router.startNewStory();
};

window.toggleCharSelection = function(charId) {
    Router.toggleCharSelection(charId);
};

window.showCreateWorld = function() {
    Router.showCreateWorld();
};

window.createWorld = function() {
    Router.createWorld();
};

window.editWorld = function(id) {
    Router.editWorld(id);
};

window.updateWorld = function(id) {
    Router.updateWorld(id);
};

window.deleteWorld = function(id) {
    Router.deleteWorld(id);
};

window.showCreateCharacter = function() {
    Router.showCreateCharacter();
};

window.createCharacter = function() {
    Router.createCharacter();
};

window.editCharacter = function(id) {
    Router.editCharacter(id);
};

window.updateCharacter = function(id) {
    Router.updateCharacter(id);
};

window.deleteCharacter = function(id) {
    Router.deleteCharacter(id);
};

window.onPlayerCharChange = function() {
    Router.onPlayerCharChange();
};

window.showStoryCharSelector = function() {
    Router.showStoryCharSelector();
};

window.getRecommendedChars = function() {
    Router.getRecommendedChars();
};
