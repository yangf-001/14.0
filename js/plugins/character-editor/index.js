PluginSystem.register('character-editor', {
    description: '角色详细编辑插件',
    features: ['角色详细编辑', '属性管理', '色色设定', '预设人物库'],
    _storageKey: 'character_editor_presets',
    
    init() {
        console.log('Character editor plugin loaded');
    }
});

const PresetCharacterLibrary = {
    basePath: './js/plugins/character-editor/世界观/',
    worlds: [],
    characters: {},
    aiSettings: {},
    storyStarts: {},
    _cacheData: null,
    
    // 硬编码世界观和文件结构，避免依赖目录索引
    _worldData: {
        '七元素-纯爱': {
            characters: ['林逸_主角.json', '菲娅_光之精灵.json', '炽羽_火之精灵.json', '澜心_水之精灵.json', '凌风_风之精灵.json', '安雅_土之精灵.json', '瑶光_雷之精灵.json', '夜璃_暗之精灵.json'],
            aiSettings: '七元素提示词.json',
            storyStarts: ['剧情2_光之精灵.json', '剧情3_火之精灵.json', '剧情4_水之精灵.json', '剧情5_风之精灵.json', '剧情6_土之精灵.json', '剧情7_雷之精灵.json', '剧情8_暗之精灵.json']
        },
        '人妻太太-后宫': {
            characters: ['陈洛_男主.json', '苏晚晴_人妻太太.json', '林诗雅_楼上人妻.json', '王思雨_新婚妻子.json'],
            aiSettings: '隔壁的人妻太太今天也是寂寞的一个人提示词.json',
            storyStarts: ['剧情1_隔壁的寂寞人妻.json', '剧情2_楼上的贵妇.json', '剧情3_对门的新婚妻子.json']
        },
        '仙尊-纯爱': {
            characters: ['玄霄子_师尊.json', '胡媚儿_狐妖女主.json', '萧逸尘_大师兄.json'],
            aiSettings: '修仙提示词.json',
            storyStarts: ['剧情1_狐妖报恩.json', '剧情2_仙尊出山.json']
        },
        '修仙系统-后宫': {
            characters: ['陈凡_男主.json', '苏晚晴_校花女友.json', '林诗雨_学霸女友.json', '沈冰月_冰山女友.json'],
            aiSettings: '修仙系统提示词.json',
            storyStarts: ['剧情1_学霸的请教.json', '剧情2_校花的倒追.json', '剧情3_冰山融化.json']
        },
        '卡通-后宫': {
            characters: ['苏墨_男主.json', '白甜甜_甜妹.json', '紫夜_御姐.json', '林萌萌_萌系少女.json', '粉绒绒_可爱少女.json', '顾小小_娇蛮少女.json'],
            aiSettings: '可爱卡通画风的色气世界提示词.json',
            storyStarts: ['剧情1_萌系少女的邀请.json', '剧情2_温柔的JK少女.json', '剧情3_蓬蓬裙小公主.json', '剧情4_御姐的诱惑.json', '剧情5_娇蛮少女的挑战.json']
        },
        '好兄弟-纯爱': {
            characters: ['陈晨_男主.json', '林晓_好兄弟.json'],
            aiSettings: '好兄弟提示词.json',
            storyStarts: ['剧情1_好兄弟的秘密.json']
        },
        '巨龙-纯爱': {
            characters: ['陈风_男主.json', '艾露西亚_巨龙女主.json'],
            aiSettings: '巨龙赖上我提示词.json',
            storyStarts: ['剧情1_烤鱼引发的羁绊.json']
        },
        '常识混乱-后宫': {
            characters: ['陈晨_男主.json', '林诗雅_便利店店员.json', '李婷_餐厅服务员.json', '张萌_护士.json', '王雪_女教师.json', '陈珂_公交车司机.json'],
            aiSettings: '常识混乱的平行世界提示词.json',
            storyStarts: ['剧情1_便利店初遇.json', '剧情2_餐厅艳遇.json', '剧情3_医院温柔陷阱.json', '剧情4_教师辅导.json', '剧情5_公交车上.json']
        },
        '死宅-后宫': {
            characters: ['陈洛_男主.json', '夏诗涵_女友.json', '林允儿_学妹.json', '苏沐橙_副会长.json'],
            aiSettings: '渣男系统提示词.json',
            storyStarts: ['剧情2_青梅竹马.json', '剧情3_学妹倒追.json', '剧情4_副会长的秘密.json']
        },
        '示例世界': {
            characters: ['角色1.json', '角色2.json'],
            aiSettings: '1.json',
            storyStarts: ['剧情1.json', '剧情2.json', '剧情3.json']
        },
        '社恐-纯爱': {
            characters: ['陈轩_男主.json', '林诗雅_女友.json'],
            aiSettings: '社恐女友提示词.json',
            storyStarts: ['剧情1_社恐少女的暗恋.json']
        },
        '千变万化-后宫': {
            characters: ['林羽_男主.json', '千面_女友.json'],
            aiSettings: '我的女友千变万化提示词.json',
            storyStarts: ['剧情1_图书馆的邂逅.json']
        },
        '怪物女友-后宫': {
            characters: ['林羽_男主.json', '苏小柔_狐妖女友.json', '敖霜_龙娘女友.json', '凌月_狼娘女友.json'],
            aiSettings: '怪物女友提示词.json',
            storyStarts: ['剧情1_狐妖的诱惑.json', '剧情2_龙娘的挑战.json', '剧情3_狼娘的告白.json']
        },
        '校霸复仇-后宫': {
            characters: ['林轩_男主.json', '张美玲_校霸妈妈.json', '王淑芬_校霸妈妈2.json', '刘雅琴_校霸妈妈3.json'],
            aiSettings: '校霸休想欺负我提示词.json',
            storyStarts: ['剧情2_寂寞的妈妈.json', '剧情3_职场女强人.json', '剧情4_酒吧风情.json']
        },
        '渡劫失败-后宫': {
            characters: ['慕容清雪_师尊.json', '苏浅月_大徒弟.json', '林紫萱_二徒弟.json', '东方月_三徒弟.json'],
            aiSettings: '渡劫失败提示词.json',
            storyStarts: ['剧情1_大徒弟登场.json', '剧情2_三徒弟登场.json', '剧情3_二徒弟登场.json']
        },
        '物件成精-后宫': {
            characters: ['张伟_男主.json', '小杯_飞机杯成精.json', '小跳_跳蛋成精.json', '小棒_按摩棒成精.json', '小穴_阴道按摩棒成精.json', '小骚_骚气内裤成精.json'],
            aiSettings: '什么叫色色物件成精了提示词.json',
            storyStarts: ['剧情1_飞机杯成精.json', '剧情2_跳蛋成精.json', '剧情3_按摩棒成精.json', '剧情4_阴道按摩棒成精.json', '剧情5_骚气内裤成精.json']
        },
        '社恐变强-后宫': {
            characters: ['周明_男主.json', '柳诗雨_女主.json', '林羽墨_学生会长.json', '苏晚晴_邻居姐姐.json'],
            aiSettings: '做爱就能变强但是我是社恐提示词.json',
            storyStarts: ['剧情2_主动的学姐.json', '剧情3_会长的邀请.json', '剧情4_邻居姐姐.json']
        },
        '精灵妈妈-后宫': {
            characters: ['林阳_儿子.json', '艾琳_精灵妈妈.json', '叶轻语_追求者.json'],
            aiSettings: '精灵妈妈提示词.json',
            storyStarts: ['剧情1_班长的告白.json', '剧情2_精灵妈妈的日常.json']
        },
        '纯爱灭杀-纯爱': {
            characters: ['林渊_男主.json', '米娅_魅魔女主.json'],
            aiSettings: '纯爱灭杀提示词.json',
            storyStarts: ['剧情1_猎人与猎物.json']
        },
        '转世咸鱼-纯爱': {
            characters: ['叶凡_男主.json', '顾清寒_徒弟长老.json'],
            aiSettings: '转世咸鱼提示词.json',
            storyStarts: ['剧情1_徒弟的寻找.json']
        },
        '骚气世界-后宫': {
            characters: ['林宇_男主.json', '林小柔_甜美萌妹.json', '冷若雪_冰山女神.json', '王诗雅_绿茶婊.json', '苏媚儿_御姐老师.json', '陈思雨_温柔学姐.json'],
            aiSettings: '全是骚逼的世界提示词.json',
            storyStarts: ['剧情1_甜妹的诱惑.json', '剧情2_冰山女神的融化.json', '剧情3_绿茶婊的主动.json', '剧情4_御姐老师的邀请.json', '剧情5_温柔学姐的关怀.json']
        },
        '魔物工具人-后宫': {
            characters: ['林风_男主.json', '黛西_魅魔契约.json', '塞壬_人鱼契约.json', '娜塔莎_蛛女契约.json', '米诺娃_蛇女契约.json'],
            aiSettings: '魔物工具提示词.json',
            storyStarts: ['剧情1_魅魔契约.json', '剧情2_人鱼塞壬.json', '剧情3_蛛女娜塔莎.json', '剧情4_蛇女米诺娃.json']
        }
    },
    
    init() {
        this.createModal();
        this._loadFromStorage();
    },
    
    _loadFromStorage() {
        try {
            const stored = localStorage.getItem('character_editor_presets');
            if (stored) {
                const data = JSON.parse(stored);
                const now = Date.now();
                if (data.timestamp && (now - data.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                    this.worlds = data.worlds || [];
                    this.characters = data.characters || {};
                    this.aiSettings = data.aiSettings || {};
                    this.storyStarts = data.storyStarts || {};
                    console.log('[角色编辑器] 从缓存加载了预设库');
                    return true;
                }
            }
        } catch (e) {
            console.warn('[角色编辑器] 读取缓存失败:', e);
        }
        return false;
    },
    
    _saveToStorage() {
        try {
            localStorage.setItem('character_editor_presets', JSON.stringify({
                timestamp: Date.now(),
                worlds: this.worlds,
                characters: this.characters,
                aiSettings: this.aiSettings,
                storyStarts: this.storyStarts
            }));
        } catch (e) {
            console.warn('[角色编辑器] 保存缓存失败:', e);
        }
    },
    
    createModal() {
        if (document.getElementById('presetModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'presetModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="presetModalTitle">导入世界观</h3>
                    <button class="modal-close" onclick="document.getElementById('presetModal').classList.remove('active')">×</button>
                </div>
                <div id="presetModalBody"></div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    async scan() {
        // 先尝试从缓存加载
        if (await this._tryLoadFromCache()) {
            console.log('[角色编辑器] 使用缓存的预设库');
            this.showWorldSelector();
            return;
        }
        
        this.worlds = Object.keys(this._worldData);
        this.characters = {};
        this.aiSettings = {};
        this.storyStarts = {};
        
        for (const worldName of this.worlds) {
            this.characters[worldName] = [];
            this.aiSettings[worldName] = null;
            this.storyStarts[worldName] = [];
        }
        
        // 加载世界详情
        await this._loadWorldDetails();
        
        console.log('Preset library scanned:', this.worlds.length, 'worlds');
        this._saveToStorage();
        this.showWorldSelector();
    },
    
    async _loadWorldDetails() {
        for (const worldName of this.worlds) {
            try {
                const worldData = this._worldData[worldName];
                if (!worldData) continue;
                
                // 加载角色
                if (worldData.characters) {
                    for (const charFile of worldData.characters) {
                        this.characters[worldName].push({
                            name: charFile.replace('.json', ''),
                            path: `${this.getBasePath()}${encodeURIComponent(worldName)}/角色/${charFile}`
                        });
                    }
                }
                
                // 加载AI设置
                if (worldData.aiSettings) {
                    this.aiSettings[worldName] = {
                        name: worldData.aiSettings.replace('.json', ''),
                        path: `${this.getBasePath()}${encodeURIComponent(worldName)}/AI配置/${worldData.aiSettings}`
                    };
                }
                
                // 加载剧情节点
                if (worldData.storyStarts) {
                    for (const storyFile of worldData.storyStarts) {
                        this.storyStarts[worldName].push({
                            name: storyFile.replace('.json', ''),
                            path: `${this.getBasePath()}${encodeURIComponent(worldName)}/剧情节点/${storyFile}`
                        });
                    }
                }
            } catch (e) {
                console.warn(`[角色编辑器] 加载 ${worldName} 详情失败:`, e);
            }
        }
    },
    
    _loadOfflineWorlds() {
        this.worlds = [
            '七元素-纯爱',
            '仙尊-纯爱',
            '好兄弟-纯爱',
            '社恐-纯爱',
            '巨龙-纯爱',
            '转世咸鱼-纯爱',
            '纯爱灭杀-纯爱',
            '死宅-后宫',
            '卡通-后宫',
            '怪物女友-后宫',
            '人妻太太-后宫',
            '修仙系统-后宫',
            '校霸复仇-后宫',
            '精灵妈妈-后宫',
            '魔物工具人-后宫',
            '物件成精-后宫',
            '常识混乱-后宫',
            '渡劫失败-后宫',
            '骚气世界-后宫',
            '社恐变强-后宫',
            '千变万化-后宫'
        ];
        
        this.characters = {};
        this.aiSettings = {};
        this.storyStarts = {};
        
        for (const worldName of this.worlds) {
            this.characters[worldName] = [];
            this.aiSettings[worldName] = null;
            this.storyStarts[worldName] = [];
        }
        
        console.log('[角色编辑器] 使用离线预设库:', this.worlds.length, '个世界观');
        
        // 尝试加载角色和AI配置（网络请求）
        this._loadOfflineWorldDetails();
    },
    
    async _loadOfflineWorldDetails() {
        const basePath = this.getBasePath();
        
        for (const worldName of this.worlds) {
            try {
                const worldPath = basePath + encodeURIComponent(worldName) + '/';
                const response = await fetch(worldPath);
                if (!response.ok) continue;
                
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                const links = doc.querySelectorAll('a');
                const subFolders = {};
                
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href) {
                        if (href.endsWith('/') && href !== '../') {
                            let folderName = href.replace(/\/$/, '');
                            try { folderName = decodeURIComponent(folderName); } catch (e) {}
                            subFolders[folderName] = href;
                        } else if (href.endsWith('.json')) {
                            let fileName = href.replace('.json', '');
                            try { fileName = decodeURIComponent(fileName); } catch (e) {}
                            if (fileName.includes('提示词') || fileName.includes('settings') || fileName.includes('setting')) {
                                this.aiSettings[worldName] = {
                                    name: fileName,
                                    path: worldPath + href
                                };
                            } else {
                                this.characters[worldName].push({
                                    name: fileName,
                                    path: worldPath + href
                                });
                            }
                        }
                    }
                });
                
                if (subFolders['剧情节点']) {
                    await this.loadStoryStartsFromFolder(worldName, worldPath + subFolders['剧情节点']);
                }
                
                if (subFolders['角色']) {
                    await this.loadCharactersFromFolder(worldName, worldPath + subFolders['角色']);
                }
                
                if (subFolders['AI配置']) {
                    await this.loadAISettingsFromFolder(worldName, worldPath + subFolders['AI配置']);
                }
            } catch (e) {
                console.warn(`[角色编辑器] 加载 ${worldName} 详情失败:`, e);
            }
        }
        
        this._saveToStorage();
        this.showWorldSelector();
    },
    
    getBasePath() {
        const path = window.location.pathname;
        const isIndex = path.endsWith('index.html') || path.endsWith('/');
        
        if (isIndex) {
            const baseDir = path.substring(0, path.lastIndexOf('/'));
            return baseDir + '/js/plugins/character-editor/世界观/';
        }
        
        const pathLower = path.toLowerCase();
        if (pathLower.includes('/character-editor/') || pathLower.includes('/plugins/character-editor')) {
            return './js/plugins/character-editor/世界观/';
        }
        
        return './js/plugins/character-editor/世界观/';
    },

    async _tryLoadFromCache() {
        try {
            const stored = localStorage.getItem('character_editor_presets');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.worlds && data.worlds.length > 0) {
                    console.log('[角色编辑器] 从缓存加载预设库:', data.worlds.length, '个世界观');
                    this.worlds = data.worlds || [];
                    this.characters = data.characters || {};
                    this.aiSettings = data.aiSettings || {};
                    this.storyStarts = data.storyStarts || {};
                    return true;
                }
            }
        } catch (e) {
            console.warn('[角色编辑器] 读取缓存失败:', e);
        }
        return false;
    },
    
    getWorldPath(worldName) {
        return this.getBasePath() + encodeURIComponent(worldName) + '/';
    },
    
    async loadWorldCharacters(worldName) {
        try {
            const worldPath = this.getWorldPath(worldName);
            const response = await fetch(worldPath);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            this.characters[worldName] = [];
            this.aiSettings[worldName] = null;
            this.storyStarts[worldName] = [];
            
            const links = doc.querySelectorAll('a');
            const subFolders = {};
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    if (href.endsWith('/') && href !== '../') {
                        let folderName = href.replace(/\/$/, '');
                        try { folderName = decodeURIComponent(folderName); } catch (e) {}
                        subFolders[folderName] = href;
                    } else if (href.endsWith('.json')) {
                        let fileName = href.replace('.json', '');
                        try { fileName = decodeURIComponent(fileName); } catch (e) {}
                        if (fileName.includes('提示词') || fileName.includes('settings') || fileName.includes('setting')) {
                            this.aiSettings[worldName] = {
                                name: fileName,
                                path: worldPath + href
                            };
                        } else {
                            this.characters[worldName].push({
                                name: fileName,
                                path: worldPath + href
                            });
                        }
                    }
                }
            });
            
            if (subFolders['剧情节点']) {
                await this.loadStoryStartsFromFolder(worldName, worldPath + subFolders['剧情节点']);
            }
            
            if (subFolders['角色']) {
                this.characters[worldName] = [];
                await this.loadCharactersFromFolder(worldName, worldPath + subFolders['角色']);
            }
            
            if (subFolders['AI配置']) {
                await this.loadAISettingsFromFolder(worldName, worldPath + subFolders['AI配置']);
            }
            
        } catch (e) {
            console.warn('Failed to load characters for', worldName, e);
        }
    },
    
    async loadStoryStartsFromFolder(worldName, folderPath) {
        try {
            const response = await fetch(folderPath);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const links = doc.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.json')) {
                    let fileName = href.replace('.json', '');
                    try { fileName = decodeURIComponent(fileName); } catch (e) {}
                    this.storyStarts[worldName].push({
                        name: fileName,
                        path: folderPath + href
                    });
                }
            });
        } catch (e) {
            console.warn('Failed to load story starts from folder:', folderPath, e);
        }
    },
    
    async loadCharactersFromFolder(worldName, folderPath) {
        try {
            const response = await fetch(folderPath);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const links = doc.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.json')) {
                    let fileName = href.replace('.json', '');
                    try { fileName = decodeURIComponent(fileName); } catch (e) {}
                    this.characters[worldName].push({
                        name: fileName,
                        path: folderPath + href
                    });
                }
            });
        } catch (e) {
            console.warn('Failed to load characters from folder:', folderPath, e);
        }
    },
    
    async loadAISettingsFromFolder(worldName, folderPath) {
        try {
            const response = await fetch(folderPath);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const links = doc.querySelectorAll('a');
            let firstSetting = null;
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.json')) {
                    let fileName = href.replace('.json', '');
                    try { fileName = decodeURIComponent(fileName); } catch (e) {}
                    if (!firstSetting) {
                        firstSetting = {
                            name: fileName,
                            path: folderPath + href
                        };
                    }
                }
            });
            
            if (firstSetting) {
                this.aiSettings[worldName] = firstSetting;
            }
        } catch (e) {
            console.warn('Failed to load AI settings from folder:', folderPath, e);
        }
    },
    
    async loadCharacterFile(worldName, charFileName) {
        try {
            const charList = this.characters[worldName];
            const charInfo = charList?.find(c => c.name === charFileName);
            
            if (charInfo && charInfo.path) {
                const response = await fetch(charInfo.path);
                if (!response.ok) {
                    console.warn('Character file not found:', charInfo.path, 'Status:', response.status);
                    return null;
                }
                const data = await response.json();
                return data;
            }
            
            const worldPath = this.getWorldPath(worldName);
            const charPath = worldPath + '角色/' + encodeURIComponent(charFileName) + '.json';
            const response = await fetch(charPath);
            if (!response.ok) {
                console.warn('Character file not found:', charPath, 'Status:', response.status);
                return null;
            }
            const data = await response.json();
            return data;
        } catch (e) {
            console.warn('Failed to load character:', charFileName, e);
            return null;
        }
    },
    
    async loadAISettings(worldName) {
        try {
            const settings = this.aiSettings[worldName];
            if (!settings) {
                await this.loadWorldCharacters(worldName);
            }
            const finalSettings = this.aiSettings[worldName];
            if (!finalSettings) return null;
            
            const response = await fetch(finalSettings.path);
            const data = await response.json();
            return data;
        } catch (e) {
            console.warn('Failed to load AI settings for', worldName, e);
            return null;
        }
    },
    
    async showWorldSelector() {
        if (this.worlds.length === 0) {
            await this.scan();
        }
        
        if (this.worlds.length === 0) {
            alert('未找到预设人物库，请检查 世界观 目录');
            return;
        }
        
        let html = '<div style="max-height:500px;overflow-y:auto;">';
        html += '<h4 style="margin:12px 0 8px;font-size:0.9rem;color:var(--accent);">选择要导入的世界观</h4>';
        html += '<p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:12px;">导入将包含该世界观下的所有角色和AI设置</p>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
        
        for (const worldName of this.worlds) {
            const charCount = this.characters[worldName]?.length || 0;
            const hasAI = this.aiSettings[worldName] ? ' 📝' : '';
            const hasStoryStart = this.storyStarts[worldName]?.length > 0 ? ' 🎬' : '';
            const safeWorldName = worldName.replace(/'/g, "\\'");
            html += `<button type="button" class="btn btn-secondary" onclick="PresetCharacterLibrary.selectStoryStart('${safeWorldName}')" style="font-size:0.85rem;padding:8px 12px;margin-bottom:4px;">${worldName} (${charCount}个角色)${hasAI}${hasStoryStart}</button>`;
        }
        
        html += '</div></div>';
        
        document.getElementById('presetModalTitle').textContent = '导入世界观';
        document.getElementById('presetModalBody').innerHTML = html;
        document.getElementById('presetModal').classList.add('active');
    },
    
    async selectStoryStart(worldName) {
        const storyStarts = this.storyStarts[worldName] || [];
        
        if (storyStarts.length === 0) {
            await this.importWorld(worldName, null);
            return;
        }
        
        let html = '<div style="max-height:400px;overflow-y:auto;">';
        html += `<h4 style="margin:12px 0 8px;font-size:0.9rem;color:var(--accent);">选择剧情开始点</h4>`;
        html += '<p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:12px;">选择故事从什么剧情开始</p>';
        html += '<div style="display:flex;flex-direction:column;gap:8px;">';
        
        html += `<button type="button" class="btn btn-secondary" onclick="PresetCharacterLibrary.importWorld('${worldName.replace(/'/g, "\\'")}', null)" style="font-size:0.85rem;padding:10px;">从头开始（默认）</button>`;
        
        for (const start of storyStarts) {
            const startName = start.name.replace(/剧情开始|开局|start/gi, '').trim() || start.name;
            html += `<button type="button" class="btn btn-primary" onclick="PresetCharacterLibrary.importWorld('${worldName.replace(/'/g, "\\'")}', '${start.name.replace(/'/g, "\\'")}')" style="font-size:0.85rem;padding:10px;">${startName}</button>`;
        }
        
        html += '</div></div>';
        
        document.getElementById('presetModalTitle').textContent = '选择剧情开始点 - ' + worldName;
        document.getElementById('presetModalBody').innerHTML = html;
    },
    
    async importWorld(worldName, storyStartName) {
        const charCount = this.characters[worldName]?.length || 0;
        const startInfo = storyStartName ? `，剧情开始点: ${storyStartName}` : '';
        if (!confirm(`确定要导入世界观 "${worldName}" 吗？\n这将创建新世界并导入 ${charCount} 个角色和AI设置${startInfo}。`)) {
            return;
        }
        
        document.getElementById('presetModal').classList.remove('active');
        
        const newWorld = Data.createWorld({
            name: worldName,
            type: '修仙'
        });
        
        Data.setCurrentWorld(newWorld.id);
        
        let storyStartData = null;
        if (storyStartName) {
            storyStartData = await this.loadStoryStart(worldName, storyStartName);
        }
        
        const chars = this.characters[worldName] || [];
        let successCount = 0;
        let errorCount = 0;
        
        for (const char of chars) {
            const charData = await this.loadCharacterFile(worldName, char.name);
            if (charData) {
                try {
                    this.createCharacterFromData(charData, newWorld.id, storyStartData);
                    successCount++;
                } catch (e) {
                    console.error('创建角色失败:', char.name, e);
                    errorCount++;
                }
            } else {
                errorCount++;
            }
        }
        
        if (this.aiSettings[worldName]) {
            const aiData = await this.loadAISettings(worldName);
            if (aiData && aiData.aiSettings) {
                this.applyAISettings(aiData.aiSettings, newWorld.id, storyStartData);
            }
        }
        
        const allStoryStarts = this.storyStarts[worldName] || [];
        const storyStartsData = [];
        for (const start of allStoryStarts) {
            try {
                const response = await fetch(start.path);
                const data = await response.json();
                storyStartsData.push({
                    name: start.name,
                    data: data,
                    unlocked: false
                });
            } catch (e) {
                console.warn('Failed to load story start data:', start.name, e);
            }
        }
        
        if (storyStartsData.length > 0) {
            storyStartsData[0].unlocked = true;
        }
        
        const worldUpdates = {
            storyStart: storyStartData,
            storyNodes: storyStartsData,
            currentStoryNode: storyStartData ? storyStartData.name : (storyStartsData[0]?.name || null)
        };
        
        Data.updateWorld(newWorld.id, worldUpdates);
        
        alert(`导入完成！\n世界: ${worldName}\n剧情开始点: ${storyStartName || '默认（从头开始）'}\n成功: ${successCount} 个角色\n失败: ${errorCount} 个角色`);
        
        if (window.renderWorldsPage) {
            renderWorldsPage();
        } else if (window.renderWorlds) {
            renderWorlds(document.getElementById('main'));
        }
        
        if (window.navigateTo) {
            navigateTo('characters');
        }
    },
    
    async loadStoryStart(worldName, storyStartName) {
        const storyStarts = this.storyStarts[worldName] || [];
        const targetStart = storyStarts.find(s => s.name === storyStartName);
        
        if (!targetStart) {
            console.warn('Story start not found:', storyStartName);
            return null;
        }
        
        try {
            const response = await fetch(targetStart.path);
            const data = await response.json();
            return data;
        } catch (e) {
            console.warn('Failed to load story start:', storyStartName, e);
            return null;
        }
    },
    
    createCharacterFromData(charData, worldId) {
        const targetWorldId = worldId || Data.getCurrentWorld()?.id;
        if (!targetWorldId) {
            throw new Error('未选择世界');
        }
        
        const profile = charData.profile || {};
        const adultProfile = charData.adultProfile || {};
        
        Data.createCharacter(targetWorldId, {
            name: charData.name || '未命名',
            gender: charData.gender || '女',
            role: charData.role || '配角',
            age: parseInt(charData.age) || 18,
            profile: {
                race: profile.race || '',
                occupation: profile.occupation || '',
                height: profile.height || '',
                appearance: profile.appearance || '',
                personality: profile.personality || '',
                hobby: profile.hobby || '',
                favorite: profile.favorite || '',
                dislike: profile.dislike || '',
                backstory: profile.backstory || '',
                catchphrase: profile.catchphrase || ''
            },
            adultProfile: Object.keys(adultProfile).length > 0 ? {
                sexuality: adultProfile.sexuality || '异性恋',
                sensitiveParts: adultProfile.sensitiveParts || '',
                fetish: adultProfile.fetish || '',
                fantasies: adultProfile.fantasies || '',
                limits: adultProfile.limits || ''
            } : {},
            relationship: charData.relationship || ''
        });
    },
    
    applyAISettings(aiSettings, worldId, storyStartData) {
        console.log('Applying AI settings:', aiSettings);
        
        const targetWorldId = worldId || Data.getCurrentWorld()?.id;
        
        if (targetWorldId) {
            const updates = { aiSettings: aiSettings };
            
            if (storyStartData && storyStartData.customStartScene) {
                if (!aiSettings.storyStart) {
                    aiSettings.storyStart = {};
                }
                aiSettings.storyStart.customStartScene = storyStartData.customStartScene;
                aiSettings.storyStart.startStage = storyStartData.startStage || '相遇';
            }
            
            Data.updateWorld(targetWorldId, updates);
            
            const storyConfigPlugin = window.StoryConfigPlugin || window.PluginSystem?.get?.('story-config');
            if (storyConfigPlugin) {
                storyConfigPlugin.saveWorldAISettings(targetWorldId, aiSettings);
            } else {
                try {
                    localStorage.setItem(`story_ai_settings_${targetWorldId}`, JSON.stringify(aiSettings));
                } catch (e) {
                    console.warn('Failed to save AI settings to localStorage:', e);
                }
            }
            
            console.log('AI settings saved to world and localStorage:', targetWorldId);
        }
    }
};

window.PresetCharacterLibrary = PresetCharacterLibrary;
PresetCharacterLibrary.init();
