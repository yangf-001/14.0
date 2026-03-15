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
            window._userSelectedStoryNode = null;
            // 延迟刷新UI，确保数据完全保存
            setTimeout(() => {
                const main = document.getElementById('mainContent');
                if (main) {
                    Pages.renderStory(main);
                }
                this.updateStoryRightPanel();
            }, 100);
        } catch (err) {
            alert('错误：' + err.message);
        }
    },
    
    async makeChoice(choice) {
        try {
            await Story.continue(choice);
            // 延迟刷新UI，确保数据完全保存
            setTimeout(() => {
                const main = document.getElementById('mainContent');
                if (main) {
                    Pages.renderStory(main);
                }
                this.updateStoryRightPanel();
            }, 100);
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
        const customChoiceInput = document.getElementById('customChoiceInput');
        const simpleStoryCustomInput = document.getElementById('simpleStoryCustomInput');
        const simpleInput = document.getElementById('customChoiceText');
        
        if (!simpleInput) {
            return;
        }
        
        const isCustomChoiceVisible = customChoiceInput && customChoiceInput.offsetParent !== null;
        const isSimpleStoryVisible = simpleStoryCustomInput && simpleStoryCustomInput.offsetParent !== null;
        
        if (isSimpleStoryVisible && window.SimpleStoryPlugin && window.SimpleStoryPlugin.isRunning()) {
            const text = simpleInput.value.trim();
            if (!text) {
                return;
            }
            if (simpleStoryCustomInput) simpleStoryCustomInput.style.display = 'none';
            simpleInput.value = '';
            
            SimpleStoryPlugin._continueStory(text);
            return;
        }
        
        if (isCustomChoiceVisible) {
            const text = simpleInput.value.trim();
            if (!text) {
                return;
            }
            if (customChoiceInput) customChoiceInput.style.display = 'none';
            simpleInput.value = '';
            this.makeChoice(text);
            return;
        }
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
            setTimeout(() => {
                App.namespace.router.showPage('story');
            }, 100);
        } catch (err) {
            alert('错误：' + err.message);
        }
    },
    
    async continueStoryWithIntimate(prompt) {
        try {
            await Story.continue(prompt);
            // 延迟刷新UI，确保数据完全保存
            setTimeout(() => {
                App.namespace.router.showPage('story');
                this.updateStoryRightPanel();
            }, 100);
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
        
        const storyNodes = world.storyNodes || [];
        const storyNodesListHtml = storyNodes.length > 0 
            ? storyNodes.map((node, index) => {
                const nodeData = node.data || {};
                const displayDesc = nodeData.description || '';
                return `
                <div style="padding: 8px 12px; background: var(--bg); border-radius: 6px; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 500;">${index + 1}. ${node.name}</span>
                            ${node.unlocked ? '<span style="font-size: 0.7rem; color: #22c55e;">✅ 已解锁</span>' : '<span style="font-size: 0.7rem; color: var(--text-dim);">🔒 未解锁</span>'}
                        </div>
                        <button class="btn btn-secondary" onclick="App.namespace.storyController.deleteStoryNode('${node.name}')" style="padding: 4px 8px; font-size: 0.75rem; color: #ff6b6b;">🗑️ 删除</button>
                    </div>
                    ${nodeData.startStage ? `<div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">阶段：${nodeData.startStage}</div>` : ''}
                    ${displayDesc ? `<div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">${displayDesc.substring(0, 50)}${displayDesc.length > 50 ? '...' : ''}</div>` : ''}
                </div>
            `}).join('')
            : '<p style="color: var(--text-dim); font-size: 0.85rem;">暂无节点</p>';
        
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
                
                <div style="margin-bottom: 20px;">
                    <h4 style="font-size: 0.9rem; margin-bottom: 8px;">🎬 剧情节点</h4>
                    <div style="margin-bottom: 12px;">${storyNodesListHtml}</div>
                    
                    <div style="padding: 12px; background: var(--card); border-radius: 8px; margin-bottom: 12px;">
                        <div style="font-size: 0.85rem; font-weight: 500; margin-bottom: 12px;">➕ 添加新节点</div>
                        <div class="form-group">
                            <label style="font-size: 0.8rem;">节点名称 *</label>
                            <input type="text" id="newStoryNodeName" placeholder="例如：相遇、表白、热恋..." style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        </div>
                        <div class="form-group" style="margin-top: 8px;">
                            <label style="font-size: 0.8rem;">剧情阶段</label>
                            <input type="text" id="newStoryNodeStage" placeholder="例如：相遇、暧昧、表白、热恋..." style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        </div>
                        <div class="form-group" style="margin-top: 8px;">
                            <label style="font-size: 0.8rem;">自定义开始场景</label>
                            <textarea id="newStoryNodeScene" placeholder="描述故事开始的场景，例如：主角第一次遇到女主..." style="width: 100%; min-height: 60px; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text);"></textarea>
                        </div>
                        <div class="form-group" style="margin-top: 8px;">
                            <label style="font-size: 0.8rem;">节点描述</label>
                            <input type="text" id="newStoryNodeDesc" placeholder="简短描述这个节点的故事" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        </div>
                        <button class="btn" onclick="App.namespace.storyController.addStoryNode()" style="margin-top: 12px; width: 100%;">➕ 添加节点</button>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-dim);">
                        说明：节点用于标记故事进度，第一个节点会自动解锁，其他节点随故事进行自动解锁
                    </div>
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
    },
    
    addStoryNode() {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        const nodeNameInput = document.getElementById('newStoryNodeName');
        if (!nodeNameInput) return;
        
        const nodeName = nodeNameInput.value.trim();
        if (!nodeName) {
            alert('请输入节点名称');
            return;
        }
        
        const nodes = world.storyNodes || [];
        
        if (nodes.some(n => n.name === nodeName)) {
            alert('节点名称已存在');
            return;
        }
        
        const stageInput = document.getElementById('newStoryNodeStage');
        const sceneInput = document.getElementById('newStoryNodeScene');
        const descInput = document.getElementById('newStoryNodeDesc');
        
        const nodeData = {
            startStage: stageInput?.value.trim() || '',
            customStartScene: sceneInput?.value.trim() || '',
            description: descInput?.value.trim() || ''
        };
        
        const newNode = {
            name: nodeName,
            unlocked: nodes.length === 0,
            data: nodeData
        };
        
        nodes.push(newNode);
        
        Data.updateWorld(world.id, {
            storyNodes: nodes,
            currentStoryNode: nodes[0]?.name || null
        });
        
        nodeNameInput.value = '';
        if (stageInput) stageInput.value = '';
        if (sceneInput) sceneInput.value = '';
        if (descInput) descInput.value = '';
        
        this.showWorldEditModal();
    },
    
    deleteStoryNode(nodeName) {
        const world = Data.getCurrentWorld();
        if (!world) return;
        
        if (!confirm(`确定要删除节点"${nodeName}"吗？`)) return;
        
        let nodes = world.storyNodes || [];
        nodes = nodes.filter(n => n.name !== nodeName);
        
        const currentNode = world.currentStoryNode === nodeName 
            ? (nodes[0]?.name || null) 
            : world.currentStoryNode;
        
        Data.updateWorld(world.id, {
            storyNodes: nodes,
            currentStoryNode: currentNode
        });
        
        this.showWorldEditModal();
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
