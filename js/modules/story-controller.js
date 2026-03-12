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
    
    async makeChoice(choice) {
        try {
            await Story.continue(choice);
            const main = document.getElementById('mainContent');
            if (main) {
                Pages.renderStory(main);
            }
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
        const simpleInput = document.getElementById('customChoiceText');
        
        if (simpleInput && simpleInput.offsetParent !== null) {
            const text = simpleInput.value.trim();
            if (!text) {
                return;
            }
            const inputDiv = document.getElementById('simpleStoryCustomInput');
            if (inputDiv) inputDiv.style.display = 'none';
            simpleInput.value = '';
            
            if (window.SimpleStoryPlugin) {
                SimpleStoryPlugin._continueStory(text);
            }
            return;
        }
        
        const customText = document.getElementById('customChoiceText')?.value.trim();
        if (!customText) {
            return;
        }
        const inputDiv = document.getElementById('customChoiceInput');
        if (inputDiv) inputDiv.style.display = 'none';
        const textInput = document.getElementById('customChoiceText');
        if (textInput) textInput.value = '';
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
    },
    
    showWorldEditModal() {
        const world = Data.getCurrentWorld();
        if (!world) {
            alert('请先选择一个世界');
            return;
        }
        
        const plugin = Story._getPlugin();
        const level3Archives = plugin?.getLevel3Archives(world.id) || [];
        const level2Archives = plugin?.getLevel2Archives(world.id) || [];
        const archives = plugin?.getArchives(world.id) || [];
        
        let allStoryContent = '';
        
        for (const l3 of level3Archives) {
            if (l3.summary) {
                allStoryContent += `\n\n【很久以前的故事】\n${l3.summary}`;
            }
        }
        
        for (const l2 of level2Archives) {
            if (l2.summary) {
                allStoryContent += `\n\n【之前的故事】\n${l2.summary}`;
            }
        }
        
        for (const archive of archives) {
            if (archive.fullSummary) {
                allStoryContent += `\n\n【上一个故事】\n${archive.fullSummary}`;
            }
        }
        
        let timeInfo = '';
        const timePlugin = window.WorldTimePlugin;
        if (timePlugin) {
            const displayTime = timePlugin.getDisplayTime(world.id);
            if (displayTime) {
                timeInfo = `主角年龄：${displayTime.protagonistAge}岁<br>故事时间：${displayTime.formatted}<br>从${displayTime.storyStartAge}岁开始，已过${displayTime.yearsPassed}年`;
            }
        }
        
        const modalContent = `
            <div style="max-height: 60vh; overflow-y: auto;">
                <h3 style="margin-bottom: 16px;">🎮 世界编辑</h3>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="font-size: 0.9rem; margin-bottom: 8px;">⏰ 时间设置</h4>
                    <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 8px;">${timeInfo || '暂无时间信息'}</div>
                    <button class="btn btn-secondary" onclick="App.namespace.storyController.showTimeEditModal()">调整时间</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="font-size: 0.9rem; margin-bottom: 8px;">📜 剧情总结</h4>
                    <textarea id="storySummaryEdit" style="width: 100%; min-height: 150px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text);" placeholder="编辑之前的剧情总结...">${allStoryContent}</textarea>
                    <button class="btn btn-secondary" onclick="App.namespace.storyController.saveStorySummary()" style="margin-top: 8px;">保存总结</button>
                </div>
                
                <div>
                    <h4 style="font-size: 0.9rem; margin-bottom: 8px;">📚 故事历史</h4>
                    <div style="font-size: 0.8rem; color: var(--text-dim);">
                        <p>三级储存：${level3Archives.length}个</p>
                        <p>二级储存：${level2Archives.length}个</p>
                        <p>一级储存：${archives.length}个</p>
                    </div>
                    <button class="btn btn-secondary" onclick="App.namespace.storyController.clearStoryHistory()" style="margin-top: 8px; color: #ff6b6b;">清除所有历史</button>
                </div>
            </div>
            <button class="btn btn-secondary" onclick="App.namespace.modal.close()" style="margin-top: 16px;">关闭</button>
        `;
        App.namespace.modal.show('🎮 世界编辑', modalContent);
    },
    
    showTimeEditModal() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const timePlugin = window.WorldTimePlugin;
        if (!timePlugin) {
            alert('时间插件未加载');
            return;
        }
        
        const displayTime = timePlugin.getDisplayTime(world.id);
        const currentAge = displayTime?.protagonistAge || 18;
        const currentYear = displayTime?.year || new Date().getFullYear();
        
        const modalContent = `
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px;">主角年龄：<input type="number" id="editProtagonistAge" value="${currentAge}" min="1" max="100" style="width: 60px; padding: 4px;"></label>
                <label style="display: block; margin-bottom: 8px;">故事年份：<input type="number" id="editStoryYear" value="${currentYear}" style="width: 80px; padding: 4px;"></label>
            </div>
            <button class="btn" onclick="App.namespace.storyController.saveTimeEdit()">保存</button>
            <button class="btn btn-secondary" onclick="App.namespace.modal.close()" style="margin-left: 8px;">取消</button>
        `;
        App.namespace.modal.show('⏰ 调整时间', modalContent);
    },
    
    saveTimeEdit() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const timePlugin = window.WorldTimePlugin;
        if (!timePlugin) return;
        
        const newAge = parseInt(document.getElementById('editProtagonistAge').value, 10);
        const newYear = parseInt(document.getElementById('editStoryYear').value, 10);
        
        const timeData = timePlugin._getWorldTime(world.id);
        if (timeData) {
            timeData.protagonistAge = newAge;
            timeData.currentYear = newYear;
            timeData.storyStartYear = newYear;
            timePlugin._saveWorldTime(world.id, timeData);
        }
        
        App.namespace.modal.close();
        alert('时间已更新');
        App.namespace.router.showPage('story');
    },
    
    saveStorySummary() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const newSummary = document.getElementById('storySummaryEdit').value.trim();
        
        localStorage.setItem(`story_manual_summary_${world.id}`, newSummary);
        
        App.namespace.modal.close();
        alert('剧情总结已保存');
    },
    
    clearStoryHistory() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        if (!confirm('确定要清除所有故事历史吗？此操作不可恢复！')) return;
        
        localStorage.removeItem(`story_archives_${world.id}`);
        localStorage.removeItem(`story_archived_${world.id}`);
        localStorage.removeItem(`story_level2_${world.id}`);
        localStorage.removeItem(`story_level3_${world.id}`);
        localStorage.removeItem(`story_manual_summary_${world.id}`);
        
        App.namespace.modal.close();
        alert('故事历史已清除');
        App.namespace.router.showPage('story');
    }
};

window.startStory = function() {
    StoryController.startStory();
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

window.showWorldEditModal = function() {
    StoryController.showWorldEditModal();
};
