const mobileNavItems = [
    { page: 'home', icon: '🏠', label: '首页' },
    { page: 'worlds', icon: '🌍', label: '世界' },
    { page: 'characters', icon: '👤', label: '角色' },
    { page: 'story', icon: '📖', label: '故事' },
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
    
    continueLastStory() {
        const world = Data.getCurrentWorld();
        if (!world) {
            alert('请先选择一个世界');
            return;
        }
        
        try {
            const archives = Story.getArchives(world.id);
            if (archives.length === 0) {
                alert('没有可继续的故事');
                return;
            }
            
            const archivesHtml = archives.map((archive, index) => {
                const startDate = formatDateTime(archive.startTime);
                const endDate = archive.endTime ? formatDateTime(archive.endTime) : '进行中';
                
                const storyCount = archive.stories ? archive.stories.length : (archive.sceneCount || 0);
                const title = archive.title || '未命名故事';
                
                return `
                    <div class="card archive-item" data-id="${archive.id}" style="margin-bottom: 12px; cursor: pointer; transition: all 0.2s; padding: 12px; border: 1px solid var(--border); border-radius: 8px;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
                        <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 4px;">
                            故事数：${storyCount}个 | 开始：${startDate}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-dim);">
                            结束：${endDate}
                        </div>
                    </div>
                `;
            }).join('');
            
            const modalContent = `
                <div style="max-height: 60vh; overflow-y: auto;" id="archivesList">
                    ${archivesHtml}
                </div>
                <button class="btn btn-secondary" onclick="App.namespace.modal.close()" style="margin-top: 16px; width: 100%;">取消</button>
            `;
            
            App.namespace.modal.show('🔄 选择要继续的故事', modalContent);
            
            setTimeout(() => {
                document.querySelectorAll('.archive-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        App.namespace.router.resumeSelectedArchive(id);
                    });
                    item.addEventListener('mouseover', function() {
                        this.style.borderColor = 'var(--accent)';
                        this.style.background = 'var(--accent-dim)';
                    });
                    item.addEventListener('mouseout', function() {
                        this.style.borderColor = 'var(--border)';
                        this.style.background = 'var(--card)';
                    });
                });
            }, 100);
        } catch (err) {
            alert('错误：' + err.message);
        }
    },
    
    resumeSelectedArchive(archiveId) {
        try {
            const resumedStoryPromise = Story.resumeArchive(archiveId);
            
            if (resumedStoryPromise && typeof resumedStoryPromise.then === 'function') {
                resumedStoryPromise.then(resumedStory => {
                    if (resumedStory) {
                        App.namespace.modal.close();
                        this.showPage('story');
                        App.namespace.storyController.updateStoryRightPanel();
                    } else {
                        alert('继续故事失败');
                    }
                }).catch(err => {
                    alert('错误：' + err.message);
                });
            } else if (resumedStory) {
                App.namespace.modal.close();
                this.showPage('story');
                App.namespace.storyController.updateStoryRightPanel();
            } else {
                alert('继续故事失败');
            }
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

window.continueLastStory = function() {
    Router.continueLastStory();
};

window.resumeSelectedArchive = function(archiveId) {
    Router.resumeSelectedArchive(archiveId);
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
