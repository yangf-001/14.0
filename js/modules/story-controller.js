const StoryController = {
    async startStory() {
        const world = Data.getCurrentWorld();
        const chars = Array.from(document.querySelectorAll('input[name="storyChars"]:checked')).map(c => c.value);
        const scene = document.getElementById('sceneInput').value;
        const charRatio = document.getElementById('charRatioStart')?.value || 80;
        
        const playerCharSelect = document.getElementById('playerCharSelect');
        const customCharName = document.getElementById('customCharName');
        let playerChar = playerCharSelect?.value || '';
        let customChar = customCharName?.value || '';
        
        if (!playerChar && customChar) {
            playerChar = 'custom:' + customChar;
        }
        
        try {
            await Story.start({ 
                characters: chars, 
                scene, 
                playerChar,
                charRatio: parseInt(charRatio)
            });
            App.namespace.router.showPage('story');
            this.updateStoryRightPanel();
        } catch (err) {
            alert('错误：' + err.message);
        }
    },
    
    async continueStory() {
        const selectedCharIds = Array.from(document.querySelectorAll('input[name="storyCharsContinue"]:checked')).map(c => c.value);
        const charRatio = document.getElementById('charRatio')?.value || 80;
        const world = Data.getCurrentWorld();
        
        const currentStory = Story.load(world.id);
        const currentCharIds = currentStory?.characters?.map(c => c.id) || [];
        
        const addedChars = selectedCharIds.filter(id => !currentCharIds.includes(id));
        const stillPresentChars = selectedCharIds.filter(id => currentCharIds.includes(id));
        
        const allChars = Data.getCharacters(world.id);
        
        const addedCharInfo = addedChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        const stillPresentCharInfo = stillPresentChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        let charChangeNote = '';
        if (addedCharInfo.length > 0 || stillPresentCharInfo.length > 0) {
            charChangeNote = '\n\n【参与角色调整】';
            if (stillPresentCharInfo.length > 0) {
                charChangeNote += `\n继续参与的角色：${stillPresentCharInfo.join('、')}`;
            }
            if (addedCharInfo.length > 0) {
                charChangeNote += `\n新加入的角色：${addedCharInfo.join('、')}（这些角色与主角可能还不熟悉，需要适当介绍）`;
            }
        }
        
        try {
            await Story.continue(null, { 
                characters: selectedCharIds,
                charChangeNote: charChangeNote,
                charRatio: parseInt(charRatio)
            });
            App.namespace.router.showPage('story');
            this.updateStoryRightPanel();
        } catch (err) {
            alert('错误：' + err.message);
        }
    },
    
    async continueStoryWithNewChars() {
        const selectedCharIds = Array.from(document.querySelectorAll('input[name="storyCharsContinue"]:checked')).map(c => c.value);
        const charRatio = document.getElementById('charRatio')?.value || 80;
        const world = Data.getCurrentWorld();
        
        const currentStory = Story.load(world.id);
        const currentCharIds = currentStory?.characters?.map(c => c.id) || [];
        
        const addedChars = selectedCharIds.filter(id => !currentCharIds.includes(id));
        const stillPresentChars = selectedCharIds.filter(id => currentCharIds.includes(id));
        
        const allChars = Data.getCharacters(world.id);
        
        const addedCharInfo = addedChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        const stillPresentCharInfo = stillPresentChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        let charChangeNote = '';
        if (addedCharInfo.length > 0 || stillPresentCharInfo.length > 0) {
            charChangeNote = '\n\n【参与角色调整】';
            if (stillPresentCharInfo.length > 0) {
                charChangeNote += `\n继续参与的角色：${stillPresentCharInfo.join('、')}`;
            }
            if (addedCharInfo.length > 0) {
                charChangeNote += `\n新加入的角色：${addedCharInfo.join('、')}（这些角色与主角可能还不熟悉，需要适当介绍）`;
            }
        }
        
        try {
            await Story.continue(null, { 
                characters: selectedCharIds,
                charChangeNote: charChangeNote,
                generateNewScene: true,
                charRatio: parseInt(charRatio)
            });
            App.namespace.router.showPage('story');
            this.updateStoryRightPanel();
            document.getElementById('storyCharSelector').style.display = 'none';
        } catch (err) {
            alert('错误：' + err.message);
        }
    },
    
    async refreshChoicesWithNewChars() {
        const selectedCharIds = Array.from(document.querySelectorAll('input[name="storyCharsContinue"]:checked')).map(c => c.value);
        const world = Data.getCurrentWorld();
        
        const currentStory = Story.load(world.id);
        const currentCharIds = currentStory?.characters?.map(c => c.id) || [];
        
        const addedChars = selectedCharIds.filter(id => !currentCharIds.includes(id));
        const stillPresentChars = selectedCharIds.filter(id => currentCharIds.includes(id));
        
        const allChars = Data.getCharacters(world.id);
        
        const addedCharInfo = addedChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        const stillPresentCharInfo = stillPresentChars.map(id => {
            const char = allChars.find(c => c.id === id);
            return char ? `${char.name}` : '';
        }).filter(Boolean);
        
        let charChangeNote = '';
        if (addedCharInfo.length > 0 || stillPresentCharInfo.length > 0) {
            charChangeNote = '\n\n【参与角色调整】';
            if (stillPresentCharInfo.length > 0) {
                charChangeNote += `\n继续参与的角色：${stillPresentCharInfo.join('、')}`;
            }
            if (addedCharInfo.length > 0) {
                charChangeNote += `\n新加入的角色：${addedCharInfo.join('、')}（这些角色与主角可能还不熟悉，需要适当介绍）`;
            }
        }
        
        try {
            const newChoices = await Story.refreshChoices(currentStory, {
                characters: selectedCharIds,
                charChangeNote: charChangeNote
            });
            
            const lastSceneIndex = currentStory.scenes.length - 1;
            if (currentStory.scenes[lastSceneIndex]) {
                currentStory.scenes[lastSceneIndex].choices = newChoices;
            }
            
            Data.saveStory(world.id, currentStory);
            
            App.namespace.router.showPage('story');
            this.updateStoryRightPanel();
            document.getElementById('storyCharSelector').style.display = 'none';
        } catch (err) {
            alert('错误：' + err.message);
        }
    },
    
    async getRecommendedChars() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const story = Story.load(world.id);
        if (!story || !story.scenes || story.scenes.length === 0) {
            alert('暂无剧情内容，无法推荐角色');
            return;
        }
        
        const allChars = Data.getCharacters(world.id);
        if (allChars.length === 0) {
            alert('暂无角色数据');
            return;
        }
        
        const recentScenes = story.scenes.slice(-3);
        const recentContent = recentScenes.map(s => s.content).join('\n\n');
        const currentCharNames = story.characters?.map(c => c.name).join('、') || '无';
        const allCharNames = allChars.map(c => c.name).join('、');
        
        const prompt = `根据以下最近的故事剧情，推荐接下来最应该参与剧情的角色。

【当前参与角色】：${currentCharNames}
【所有可用角色】：${allCharNames}

【最近剧情】：
${recentContent}

请根据剧情发展和人物关系，推荐3-5个最适合参与下一段剧情的角色。只返回角色名字，用顿号分隔，不需要其他解释。`;

        try {
            const loadingDiv = document.getElementById('recommendedChars');
            const loadingList = document.getElementById('recommendedCharsList');
            loadingDiv.style.display = 'block';
            loadingList.innerHTML = '<span style="color: var(--bg); font-size: 0.8rem;">正在分析剧情...</span>';
            
            const result = await ai.call(prompt, { 
                system: '你是一个故事创作助手，擅长分析剧情和人物关系。',
                temperature: 0.3
            });
            
            const recommended = result.split(/[、，,]/).map(s => s.trim()).filter(s => s.length > 0);
            
            const matchedChars = allChars.filter(c => 
                recommended.some(r => c.name.includes(r) || r.includes(c.name))
            );
            
            loadingList.innerHTML = matchedChars.map(c => `
                <button class="btn btn-secondary" onclick="App.namespace.storyController.toggleRecommendChar('${c.id}')" 
                    style="padding: 4px 8px; font-size: 0.75rem; background: var(--bg); color: var(--accent);">
                    ${c.name}
                </button>
            `).join('');
            
            matchedChars.forEach(c => {
                const checkbox = document.querySelector(`input[name="storyCharsContinue"][value="${c.id}"]`);
                if (checkbox) checkbox.checked = true;
            });
            
        } catch (err) {
            console.error('推荐角色失败:', err);
            alert('推荐角色失败，请重试');
        }
    },
    
    toggleRecommendChar(charId) {
        const checkbox = document.querySelector(`input[name="storyCharsContinue"][value="${charId}"]`);
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
        }
    },
    
    async makeChoice(choice) {
        try {
            await Story.continue(choice);
            App.namespace.router.showPage('story');
            this.updateStoryRightPanel();
        } catch (err) {
            alert('错误：' + err.message);
        }
    },
    
    updateStoryRightPanel() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const right = document.getElementById('rightPanel');
        if (!right) return;
        
        const story = Story.load(world.id);
        Pages.renderStoryRightPanel(right, world, story);
    },
    
    showCustomChoiceInput() {
        const inputDiv = document.getElementById('customChoiceInput');
        inputDiv.style.display = inputDiv.style.display === 'none' ? 'flex' : 'none';
        if (inputDiv.style.display !== 'none') {
            document.getElementById('customChoiceText').focus();
        }
    },
    
    makeCustomChoice() {
        const customText = document.getElementById('customChoiceText').value.trim();
        if (!customText) {
            alert('请输入你的选择');
            return;
        }
        document.getElementById('customChoiceInput').style.display = 'none';
        document.getElementById('customChoiceText').value = '';
        this.makeChoice(customText);
    },
    
    showEndStoryModal() {
        const modalContent = `
            <p style="margin-bottom: 16px;">确定要结束当前故事吗？</p>
            <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 20px;">
                故事结束后会被保存到历史记录中，你可以随时查看。
            </p>
            <button class="btn" onclick="App.namespace.storyController.endStory()">确认结束</button>
            <button class="btn btn-secondary" onclick="App.namespace.modal.close()" style="margin-left: 8px;">取消</button>
        `;
        App.namespace.modal.show('🏁 结束故事', modalContent);
    },
    
    async endStory() {
        try {
            const archive = await Story.end();
            
            // 支持新格式（stories数组）和旧格式
            const storyCount = archive.stories ? archive.stories.length : 1;
            const sceneCount = archive.stories 
                ? archive.stories.reduce((sum, s) => sum + (s.sceneCount || 0), 0)
                : (archive.sceneCount || 0);
            
            if (typeof AchievementPlugin !== 'undefined') {
                AchievementPlugin.updateStats('story_end');
                let wordCount = 0;
                if (archive.stories) {
                    for (const s of archive.stories) {
                        wordCount += (s.content ? s.content.length : 0);
                    }
                } else {
                    wordCount = archive.fullSummary ? archive.fullSummary.length : 0;
                }
                if (wordCount > 0) {
                    AchievementPlugin.updateStats('total_words', wordCount);
                }
            }
            
            App.namespace.modal.close();
            alert(`故事已结束！\n标题：${archive.title}\n故事数：${storyCount}个\n总幕数：${sceneCount}`);
            App.namespace.router.showPage('story');
        } catch (err) {
            alert('错误：' + err.message);
        }
    },
    
    async continueStoryWithIntimate(prompt) {
        try {
            await Story.continue(prompt);
            App.namespace.router.showPage('story');
            this.updateStoryRightPanel();
        } catch (err) {
            alert('错误：' + err.message);
        }
    }
};

// 暴露到全局
window.startStory = function() {
    StoryController.startStory();
};

window.continueStory = function() {
    StoryController.continueStory();
};

window.continueStoryWithNewChars = function() {
    StoryController.continueStoryWithNewChars();
};

window.refreshChoicesWithNewChars = function() {
    StoryController.refreshChoicesWithNewChars();
};

window.getRecommendedChars = function() {
    StoryController.getRecommendedChars();
};

window.toggleRecommendChar = function(charId) {
    StoryController.toggleRecommendChar(charId);
};

window.makeChoice = function(choice) {
    StoryController.makeChoice(choice);
};

window.updateStoryRightPanel = function() {
    StoryController.updateStoryRightPanel();
};

window.showCustomChoiceInput = function() {
    StoryController.showCustomChoiceInput();
};

window.makeCustomChoice = function() {
    StoryController.makeCustomChoice();
};

window.showEndStoryModal = function() {
    StoryController.showEndStoryModal();
};

window.endStory = function() {
    StoryController.endStory();
};