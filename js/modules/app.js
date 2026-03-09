const App = {
    currentPage: 'home',
    CONSTANTS: {
        MIN_AGE: 18,
        DEFAULT_TIMEOUT: 60000,
        DEBOUNCE_DELAY: 200,
        GENDER_OPTIONS: ['女', '男'],
        ROLE_OPTIONS: ['主角', '女主', '配角'],
        WORLD_TYPES: ['现代', '都市', '奇幻', '科幻', '古代', '异世界']
    },
    
    namespace: {
        router: null,
        modal: null,
        forms: null,
        intimate: null,
        archive: null,
        character: null,
        storyController: null
    },
    
    async init() {
        LoadingManager.show('正在初始化...', true);
        
        this.namespace.router = Router;
        this.namespace.modal = Modal;
        this.namespace.forms = Forms;
        this.namespace.intimate = Intimate;
        this.namespace.archive = Archive;
        this.namespace.character = Character;
        this.namespace.storyController = StoryController;
        
        if (PluginSystem && !PluginSystem.loaded) {
            await PluginSystem.init();
        }
        
        try {
            await Promise.all([
                new Promise(resolve => LoadingManager.setProgress(30, '加载世界数据...') || setTimeout(resolve, 50)),
                new Promise(resolve => LoadingManager.setProgress(60, '加载角色数据...') || setTimeout(resolve, 50)),
                new Promise(resolve => LoadingManager.setProgress(90, '加载故事进度...') || setTimeout(resolve, 50))
            ]);
        } finally {
            this.namespace.router.showPage('home');
            LoadingManager.hide();
        }
    }
};

// 暴露到全局
window.App = App;