(function() {
    // 加载模块
    const scripts = [
        'js/modules/app.js',
        'js/modules/modal.js',
        'js/modules/forms.js',
        'js/modules/intimate.js',
        'js/modules/archive.js',
        'js/modules/character.js',
        'js/modules/story-controller.js',
        'js/modules/router.js'
    ];
    
    let loadedCount = 0;
    
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    async function loadAllScripts() {
        for (const script of scripts) {
            await loadScript(script);
            loadedCount++;
            console.log(`加载模块 ${loadedCount}/${scripts.length}: ${script}`);
        }
    }
    
    function formatDateTime(timestamp) {
        if (!timestamp) return '未知';
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekDay = weekDays[date.getDay()];
        return `${year}年${month}月${day}日 ${hours}:${minutes} 星期${weekDay}`;
    }
    
    // 暴露 formatDateTime 到全局
    window.formatDateTime = formatDateTime;
    
    // 初始化应用
    async function init() {
        try {
            await loadAllScripts();
            console.log('所有模块加载完成');
            
            // 初始化路由
            Router.setupNav();
            Router.setupMobileNav();
            
            // 初始化应用
            await App.init();
            
            console.log('应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            alert('应用初始化失败，请刷新页面重试');
        }
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();