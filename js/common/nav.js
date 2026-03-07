// 统一导航系统
const NavSystem = {
    // 生成导航栏
    generateNav(activePage) {
        return `
            <div class="sidebar">
                <h1>✨ AI故事</h1>
                <nav>
                    <button class="nav-btn" onclick="window.history.back()">⬅️ 返回</button>
                    <button class="nav-btn ${activePage === 'home' ? 'active' : ''}" onclick="NavSystem.navigate('home')">🏠 首页</button>
                    <button class="nav-btn ${activePage === 'worlds' ? 'active' : ''}" onclick="NavSystem.navigate('worlds')">🌍 世界</button>
                    <button class="nav-btn ${activePage === 'characters' ? 'active' : ''}" onclick="NavSystem.navigate('characters')">👤 角色</button>
                    <button class="nav-btn ${activePage === 'character-editor' ? 'active' : ''}" onclick="NavSystem.navigate('character-editor')">🧩 角色插件</button>
                    <button class="nav-btn ${activePage === 'inventory' ? 'active' : ''}" onclick="NavSystem.navigate('inventory')">🎒 物品</button>
                    <button class="nav-btn ${activePage === 'achievement' ? 'active' : ''}" onclick="NavSystem.navigate('achievement')">🏆 成就</button>
                    <button class="nav-btn ${activePage === 'intimate' ? 'active' : ''}" onclick="NavSystem.navigate('intimate')">💕 亲密互动</button>
                    <button class="nav-btn ${activePage === 'story' ? 'active' : ''}" onclick="NavSystem.navigate('story')">📖 故事</button>
                    <button class="nav-btn ${activePage === 'settings' ? 'active' : ''}" onclick="NavSystem.navigate('settings')">⚙️ 设置</button>
                    <button class="nav-btn ${activePage === 'plugins' ? 'active' : ''}" onclick="NavSystem.navigate('plugins')">🔌 插件</button>
                </nav>
            </div>
        `;
    },
    
    // 导航到指定页面
    navigate(page) {
        switch(page) {
            case 'home':
                window.location.href = '../../../index.html';
                break;
            case 'worlds':
                window.location.href = '../../../index.html?page=worlds';
                break;
            case 'characters':
                window.location.href = '../../../index.html?page=characters';
                break;
            case 'character-editor':
                window.location.href = 'character-editor/index.html';
                break;
            case 'inventory':
                window.location.href = 'inventory/index.html';
                break;
            case 'achievement':
                window.location.href = 'achievement/index.html';
                break;
            case 'intimate':
                window.location.href = 'intimate/index.html';
                break;
            case 'story':
                window.location.href = '../../../index.html?page=story';
                break;
            case 'settings':
                window.location.href = '../../../index.html?page=settings';
                break;
            case 'plugins':
                window.location.href = '../../../index.html?page=plugins';
                break;
        }
    },
    
    // 生成页脚
    generateFooter() {
        return `
            <div class="footer">
                <p>AI故事 - 5.0 | 版权所有 © 2026</p>
            </div>
        `;
    }
};

window.NavSystem = NavSystem;