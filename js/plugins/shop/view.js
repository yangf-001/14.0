View.register('shop.main', function(worldId, characterId) {
    const plugin = PluginSystem.get('shop');
    const money = plugin?.getCharacterMoney(worldId, characterId) || 0;
    const goods = plugin?.getGoodsLibrary() || [];
    const categories = plugin?.getShopCategories() || {};
    
    const categoryNames = {
        'potion': '🧪 药水',
        'food': '🍎 食物',
        'weapon': '⚔️ 武器',
        'tool': '🔧 工具',
        'misc': '📦 杂物',
        'adult': '🔞 成人'
    };
    
    const char = Data.getCharacter(worldId, characterId);
    const isMainCharacter = char?.role === '主角';
    
    return `
        <div class="shop-header">
            <div class="shop-money">
                <span class="money-icon">💰</span>
                <span class="money-amount">${money}</span> 金币
                ${isMainCharacter ? `<button class="btn btn-secondary btn-sm" onclick="ViewCallbacks.shop.showAddMoney('${worldId}', '${characterId}')">+ 增加金钱</button>` : ''}
            </div>
        </div>
        
        <div class="shop-categories">
            <button class="shop-cat-btn active" data-cat="all">全部</button>
            ${Object.keys(categories).map(cat => `
                <button class="shop-cat-btn" data-cat="${cat}">${categoryNames[cat] || cat}</button>
            `).join('')}
        </div>
        
        <div class="shop-items" id="shopItems">
            ${goods.length === 0 ? '<div class="empty">商店暂无商品</div>' : goods.map(item => `
                <div class="shop-item-card" data-type="${item.type}">
                    <span class="shop-item-icon">${item.icon || '📦'}</span>
                    <div class="shop-item-info">
                        <div class="shop-item-name">${item.name}</div>
                        <div class="shop-item-desc">${item.description || item.type}</div>
                        <div class="shop-item-price">💰 ${item.price} 金币</div>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="ViewCallbacks.shop.buy('${worldId}', '${characterId}', '${item.id}')">购买</button>
                </div>
            `).join('')}
        </div>
        
        <style>
            .shop-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding: 15px;
                background: var(--surface);
                border-radius: 8px;
            }
            .shop-money {
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .money-icon {
                font-size: 1.5rem;
            }
            .money-amount {
                color: var(--accent);
                font-weight: bold;
            }
            .shop-categories {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-bottom: 20px;
            }
            .shop-cat-btn {
                padding: 8px 16px;
                border: 1px solid var(--border);
                background: var(--surface);
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .shop-cat-btn.active, .shop-cat-btn:hover {
                background: var(--accent);
                color: white;
                border-color: var(--accent);
            }
            .shop-items {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 12px;
            }
            .shop-item-card {
                display: flex;
                flex-direction: column;
                padding: 12px;
                background: var(--surface);
                border-radius: 8px;
                border: 1px solid var(--border);
            }
            .shop-item-icon {
                font-size: 2rem;
                text-align: center;
                margin-bottom: 8px;
            }
            .shop-item-info {
                flex: 1;
                text-align: center;
            }
            .shop-item-name {
                font-weight: bold;
                margin-bottom: 4px;
            }
            .shop-item-desc {
                font-size: 0.8rem;
                color: var(--text-secondary);
                margin-bottom: 8px;
            }
            .shop-item-price {
                color: var(--accent);
                font-weight: bold;
            }
        </style>
    `;
});

View.register('shop.npcBuy', function(worldId, npcId, budget) {
    const plugin = PluginSystem.get('shop');
    const npc = Data.getCharacter(worldId, npcId);
    const npcMoney = plugin?.getCharacterMoney(worldId, npcId) || 0;
    
    return `
        <div class="shop-npc-header">
            <h3>${npc?.name || 'NPC'} 自动购买</h3>
            <p>当前资金: 💰 ${npcMoney} 金币</p>
        </div>
        
        <div class="form-group">
            <label>购物预算</label>
            <input type="number" id="npcBuyBudget" value="${budget || npcMoney}" min="1" max="${npcMoney}">
        </div>
        
        <div class="shop-npc-result" id="npcBuyResult"></div>
        
        <button class="btn btn-primary" onclick="ViewCallbacks.shop.executeNpcBuy('${worldId}', '${npcId}')">执行购买</button>
    `;
});

View.register('shop.npcMoney', function(worldId, npcId) {
    const plugin = PluginSystem.get('shop');
    const npc = Data.getCharacter(worldId, npcId);
    const npcMoney = plugin?.getCharacterMoney(worldId, npcId) || 0;
    
    return `
        <div class="form-group">
            <label>${npc?.name || 'NPC'} 的资金</label>
            <input type="number" id="npcMoneyAmount" value="${npcMoney}" min="0">
        </div>
        <button class="btn btn-primary" onclick="ViewCallbacks.shop.setNpcMoney('${worldId}', '${npcId}')">设置资金</button>
    `;
});

View.register('shop.addMoney', function(worldId, characterId) {
    const plugin = PluginSystem.get('shop');
    const char = Data.getCharacter(worldId, characterId);
    const currentMoney = plugin?.getCharacterMoney(worldId, characterId) || 0;
    
    return `
        <div class="form-group">
            <label>当前金钱</label>
            <input type="text" value="${currentMoney} 金币" disabled>
        </div>
        <div class="form-group">
            <label>增加金额</label>
            <input type="number" id="addMoneyAmount" value="100" min="1">
        </div>
        <button class="btn btn-primary" onclick="ViewCallbacks.shop.doAddMoney('${worldId}', '${characterId}')">增加金钱</button>
    `;
});

View.register('shop.giveMoney', function(worldId, fromCharId) {
    const plugin = PluginSystem.get('shop');
    const world = Data.getCurrentWorld();
    const fromChar = Data.getCharacter(worldId, fromCharId);
    const allChars = Data.getCharacters(worldId).filter(c => c.id !== fromCharId);
    const fromMoney = plugin?.getCharacterMoney(worldId, fromCharId) || 0;
    
    return `
        <div class="form-group">
            <label>从</label>
            <input type="text" value="${fromChar?.name || '未知'}" disabled>
        </div>
        <div class="form-group">
            <label>当前资金</label>
            <input type="text" value="${fromMoney} 金币" disabled>
        </div>
        <div class="form-group">
            <label>转移给</label>
            <select id="giveMoneyTarget">
                ${allChars.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>金额</label>
            <input type="number" id="giveMoneyAmount" value="100" min="1" max="${fromMoney}">
        </div>
        <button class="btn btn-primary" onclick="ViewCallbacks.shop.doGiveMoney('${worldId}', '${fromCharId}')">转移金钱</button>
    `;
});

ViewCallbacks.shop = {
    currentCategory: 'all',
    
    showShop(worldId, characterId) {
        const html = View.render('shop.main', worldId, characterId);
        const main = document.getElementById('mainContent');
        if (main) {
            main.innerHTML = html;
            setTimeout(() => this.initShopFilters(), 100);
        }
        return html;
    },
    
    initShopFilters() {
        const self = this;
        document.querySelectorAll('.shop-cat-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.shop-cat-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                self.currentCategory = this.dataset.cat;
                
                const cat = this.dataset.cat;
                document.querySelectorAll('.shop-item-card').forEach(card => {
                    if (cat === 'all' || card.dataset.type === cat) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
        
        const activeBtn = document.querySelector(`.shop-cat-btn[data-cat="${this.currentCategory}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            const cat = this.currentCategory;
            document.querySelectorAll('.shop-item-card').forEach(card => {
                if (cat === 'all' || card.dataset.type === cat) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    },
    
    buy(worldId, characterId, goodsId) {
        const plugin = PluginSystem.get('shop');
        const result = plugin?.buyItem(worldId, characterId, goodsId);
        
        if (result?.success) {
            this.showShop(worldId, characterId);
            this.showMessage('购买成功: ' + result.message, 'success');
        } else {
            this.showMessage(result?.message || '购买失败', 'error');
        }
    },
    
    showMessage(text, type = 'info') {
        const existing = document.getElementById('shopMessage');
        if (existing) existing.remove();
        
        const msg = document.createElement('div');
        msg.id = 'shopMessage';
        msg.className = `shop-message shop-message-${type}`;
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: fadeIn 0.3s;
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    },
    
    showAddMoney(worldId, characterId) {
        document.getElementById('modalTitle').textContent = '增加金钱';
        document.getElementById('modalBody').innerHTML = View.render('shop.addMoney', worldId, characterId);
        document.getElementById('modal').classList.add('active');
    },
    
    doAddMoney(worldId, characterId) {
        const amount = parseInt(document.getElementById('addMoneyAmount').value) || 0;
        if (amount <= 0) return;
        
        const plugin = PluginSystem.get('shop');
        plugin?.addCharacterMoney(worldId, characterId, amount);
        
        document.getElementById('modal').classList.remove('active');
        this.showShop(worldId, characterId);
    },
    
    showNpcBuy(worldId, npcId, budget = 100) {
        document.getElementById('modalTitle').textContent = 'NPC 自动购买';
        document.getElementById('modalBody').innerHTML = View.render('shop.npcBuy', worldId, npcId, budget);
        document.getElementById('modal').classList.add('active');
    },
    
    executeNpcBuy(worldId, npcId) {
        const budget = parseInt(document.getElementById('npcBuyBudget').value) || 100;
        
        const plugin = PluginSystem.get('shop');
        const result = plugin?.npcAutoBuy(worldId, npcId, budget);
        
        if (result) {
            let resultHtml = `<div class="result-message">${result.message}</div>`;
            if (result.purchasedItems?.length > 0) {
                resultHtml += `<div class="purchased-list">`;
                resultHtml += `<h4>购买的物品:</h4>`;
                result.purchasedItems.forEach(item => {
                    resultHtml += `<div class="purchased-item">${item.icon} ${item.name} - ${item.price} 金币</div>`;
                });
                resultHtml += `</div>`;
            }
            document.getElementById('npcBuyResult').innerHTML = resultHtml;
        }
    },
    
    showNpcMoney(worldId, npcId) {
        document.getElementById('modalTitle').textContent = '设置 NPC 资金';
        document.getElementById('modalBody').innerHTML = View.render('shop.npcMoney', worldId, npcId);
        document.getElementById('modal').classList.add('active');
    },
    
    setNpcMoney(worldId, npcId) {
        const amount = parseInt(document.getElementById('npcMoneyAmount').value) || 0;
        
        const plugin = PluginSystem.get('shop');
        plugin?.setCharacterMoney(worldId, npcId, amount);
        
        document.getElementById('modal').classList.remove('active');
    },
    
    showGiveMoney(worldId, fromCharId) {
        document.getElementById('modalTitle').textContent = '转移金钱';
        document.getElementById('modalBody').innerHTML = View.render('shop.giveMoney', worldId, fromCharId);
        document.getElementById('modal').classList.add('active');
    },
    
    doGiveMoney(worldId, fromCharId) {
        const toCharId = document.getElementById('giveMoneyTarget').value;
        const amount = parseInt(document.getElementById('giveMoneyAmount').value) || 0;
        
        if (amount <= 0) return;
        
        const plugin = PluginSystem.get('shop');
        const result = plugin?.giveMoneyToCharacter(worldId, fromCharId, toCharId, amount);
        
        if (result?.success) {
            this.showMessage(result.message, 'success');
            document.getElementById('modal').classList.remove('active');
        } else {
            this.showMessage(result?.message || '转移失败', 'error');
        }
    },
    
    getCharacterMoney(worldId, characterId) {
        const plugin = PluginSystem.get('shop');
        return plugin?.getCharacterMoney(worldId, characterId) || 0;
    },
    
    addMoney(worldId, characterId, amount) {
        const plugin = PluginSystem.get('shop');
        return plugin?.addCharacterMoney(worldId, characterId, amount) || 0;
    },
    
    spendMoney(worldId, characterId, amount) {
        const plugin = PluginSystem.get('shop');
        return plugin?.spendCharacterMoney(worldId, characterId, amount);
    }
};
