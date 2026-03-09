const Character = {
    showCharacterAttributes() {
        const world = Data.getCurrentWorld();
        if (!world) {
            alert('请先选择一个世界');
            return;
        }

        let chars = Data.getCharacters(world.id);
        if (chars.length === 0) {
            alert('当前世界没有角色');
            return;
        }

        const modalContent = this._buildCharacterAttributesContent(chars);
        App.namespace.modal.show('👤 角色属性', modalContent);
    },
    
    _buildCharacterAttributesContent(chars) {
        const charListHtml = chars.map(c => {
            const p = c.profile || {};
            const tags = [];
            if (c.role) tags.push(c.role);
            if (c.gender) tags.push(c.gender);
            if (c.age) tags.push(c.age + '岁');
            if (p.occupation) tags.push(p.occupation);
            if (p.personality) tags.push(p.personality.substring(0, 4));
            
            return `
                <div style="padding: 12px; background: var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px;"
                     onclick="App.namespace.character.selectCharAttr('${c.id}')"
                     onmouseover="this.style.background='var(--accent-dim)'" 
                     onmouseout="this.style.background='var(--border)'">
                    <div style="font-weight: bold; margin-bottom: 4px;">${c.name}</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                        ${tags.map(t => `<span style="font-size: 0.75rem; padding: 2px 6px; background: var(--bg); border-radius: 4px; color: var(--text-dim);">${t}</span>`).join('')}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="margin-bottom: 12px;">
                <h3 style="margin-bottom: 12px;">👤 角色列表</h3>
                <p style="font-size: 0.85rem; color: var(--text-dim);">点击角色查看详细属性</p>
            </div>
            <div id="charList">
                ${charListHtml}
            </div>
        `;
    },
    
    selectCharAttr(charId) {
        const world = Data.getCurrentWorld();
        if (!world) return;

        const chars = Data.getCharacters(world.id);
        const char = chars.find(ch => ch.id === charId);
        if (!char) return;

        const modalContent = this._buildCharacterDetailContent(char, world.id, charId);
        App.namespace.modal.show(char.name, modalContent);
    },
    
    _buildCharacterDetailContent(char, worldId, charId) {
        const tabs = [
            { id: 'basic', label: '📋 基础' },
            { id: 'personality', label: '🎭 性格' },
            { id: 'background', label: '📖 背景' },
            { id: 'stats', label: '📊 属性' },
            { id: 'adult', label: '🔞 色色' },
            { id: 'inventory', label: '🎒 背包' }
        ];
        
        const tabsHtml = tabs.map(t => `
            <button class="tab-btn" 
                    onclick="App.namespace.character.switchCharTab('${t.id}', '${charId}', '${worldId}')" 
                    style="padding: 8px 12px; border: none; background: var(--border); color: var(--text); border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                ${t.label}
            </button>
        `).join('');
        
        const getDynamicAge = (char) => {
            const world = Data.getCurrentWorld();
            if (world && window.WorldTimePlugin) {
                return window.WorldTimePlugin.getCharacterAge(char, world.id) || char.age;
            }
            return char.age || 18;
        };
        
        const contentHtml = this._renderCharTabContent('basic', worldId, charId);
        
        return `
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 4px;">${char.name}</div>
                <div style="color: var(--text-dim); font-size: 0.85rem;">
                    ${char.gender || '女'} · ${getDynamicAge(char)}岁 · ${char.role || '配角'}
                </div>
            </div>
            <div style="display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap;">
                ${tabsHtml}
            </div>
            <div id="charTabContent">
                ${contentHtml}
            </div>
        `;
    },
    
    switchCharTab(tabId, charId, worldId) {
        const contentHtml = this._renderCharTabContent(tabId, worldId, charId);
        const contentDiv = document.getElementById('charTabContent');
        if (contentDiv) {
            contentDiv.innerHTML = contentHtml;
        }
    },
    
    _renderCharTabContent(tabId, worldId, charId) {
        if (typeof View !== 'undefined' && View.render) {
            return View.render('characterRead.' + tabId, worldId, charId);
        }
        return '<div>角色属性插件未加载</div>';
    }
};

// 暴露到全局
window.showCharacterAttributes = function() {
    Character.showCharacterAttributes();
};

window._selectCharAttr = function(charId) {
    Character.selectCharAttr(charId);
};

window._switchCharTab = function(tabId, charId, worldId) {
    Character.switchCharTab(tabId, charId, worldId);
};