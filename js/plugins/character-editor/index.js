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
    storyStarts: {},
    _cacheData: null,
    
    // 硬编码世界观和文件结构，避免依赖目录索引
    _worldData: {
        '七元素-纯爱': {
            characters: ['林逸_主角.json', '菲娅_光之精灵.json', '炽羽_火之精灵.json', '澜心_水之精灵.json', '凌风_风之精灵.json', '安雅_土之精灵.json', '瑶光_雷之精灵.json', '夜璃_暗之精灵.json'],

            storyStarts: ['剧情1_元素共鸣.json', '剧情2_光之精灵.json', '剧情3_火之精灵.json', '剧情4_水之精灵.json', '剧情5_风之精灵.json', '剧情6_土之精灵.json', '剧情7_雷之精灵.json', '剧情8_暗之精灵.json']
        },
        '人妻太太-后宫': {
            characters: ['陈洛_男主.json', '苏晚晴_人妻太太.json', '林诗雅_楼上人妻.json', '王思雨_新婚妻子.json'],

            storyStarts: ['剧情1_隔壁的寂寞人妻.json', '剧情2_楼上的贵妇.json', '剧情3_对门的新婚妻子.json']
        },
        '仙尊-纯爱': {
            characters: ['玄霄子_师尊.json', '胡媚儿_狐妖女主.json', '萧逸尘_大师兄.json'],

            storyStarts: ['剧情1_狐妖报恩.json', '剧情2_仙尊出山.json']
        },
        '修仙系统-后宫': {
            characters: ['陈凡_男主.json', '苏晚晴_校花女友.json', '林诗雨_学霸女友.json', '沈冰月_冰山女友.json'],

            storyStarts: ['剧情1_学霸的请教.json', '剧情2_校花的倒追.json', '剧情3_冰山融化.json']
        },
        '卡通-后宫': {
            characters: ['苏墨_男主.json', '白甜甜_甜妹.json', '紫夜_御姐.json', '林萌萌_萌系少女.json', '粉绒绒_可爱少女.json', '顾小小_娇蛮少女.json'],

            storyStarts: ['剧情1_萌系少女的邀请.json', '剧情2_温柔的JK少女.json', '剧情3_蓬蓬裙小公主.json', '剧情4_御姐的诱惑.json', '剧情5_娇蛮少女的挑战.json']
        },
        '好兄弟-纯爱': {
            characters: ['陈晨_男主.json', '林晓_好兄弟.json'],

            storyStarts: ['剧情1_好兄弟的秘密.json']
        },
        '巨龙-纯爱': {
            characters: ['陈风_男主.json', '艾露西亚_巨龙女主.json'],

            storyStarts: ['剧情1_烤鱼引发的羁绊.json']
        },
        '常识混乱-后宫': {
            characters: ['陈晨_男主.json', '林诗雅_便利店店员.json', '李婷_餐厅服务员.json', '张萌_护士.json', '王雪_女教师.json', '陈珂_公交车司机.json'],

            storyStarts: ['剧情1_便利店初遇.json', '剧情2_餐厅艳遇.json', '剧情3_医院温柔陷阱.json', '剧情4_教师辅导.json', '剧情5_公交车上.json']
        },
        '死宅-后宫': {
            characters: ['陈洛_男主.json', '夏诗涵_女友.json', '林允儿_学妹.json', '苏沐橙_副会长.json'],

            storyStarts: ['剧情2_青梅竹马.json', '剧情3_学妹倒追.json', '剧情4_副会长的秘密.json']
        },
        '示例世界': {
            characters: ['角色1.json', '角色2.json'],

            storyStarts: ['剧情1.json', '剧情2.json', '剧情3.json']
        },
        '社恐-纯爱': {
            characters: ['陈轩_男主.json', '林诗雅_女友.json'],

            storyStarts: ['剧情1_社恐少女的暗恋.json']
        },
        '千变万化-后宫': {
            characters: ['林羽_男主.json', '千面_女友.json'],

            storyStarts: ['剧情1_图书馆的邂逅.json']
        },
        '怪物女友-后宫': {
            characters: ['林羽_男主.json', '苏小柔_狐妖女友.json', '敖霜_龙娘女友.json', '凌月_狼娘女友.json'],

            storyStarts: ['剧情1_狐妖的诱惑.json', '剧情2_龙娘的挑战.json', '剧情3_狼娘的告白.json']
        },
        '校霸复仇-后宫': {
            characters: ['林轩_男主.json', '张美玲_校霸妈妈.json', '王淑芬_校霸妈妈2.json', '刘雅琴_校霸妈妈3.json'],

            storyStarts: ['剧情2_寂寞的妈妈.json', '剧情3_职场女强人.json', '剧情4_酒吧风情.json']
        },
        '渡劫失败-后宫': {
            characters: ['慕容清雪_师尊.json', '苏浅月_大徒弟.json', '林紫萱_二徒弟.json', '东方月_三徒弟.json'],

            storyStarts: ['剧情1_大徒弟登场.json', '剧情2_三徒弟登场.json', '剧情3_二徒弟登场.json']
        },
        '物件成精-后宫': {
            characters: ['张伟_男主.json', '小杯_飞机杯成精.json', '小跳_跳蛋成精.json', '小棒_按摩棒成精.json', '小穴_阴道按摩棒成精.json', '小骚_骚气内裤成精.json'],

            storyStarts: ['剧情1_飞机杯成精.json', '剧情2_跳蛋成精.json', '剧情3_按摩棒成精.json', '剧情4_阴道按摩棒成精.json', '剧情5_骚气内裤成精.json']
        },
        '社恐变强-后宫': {
            characters: ['周明_男主.json', '柳诗雨_女主.json', '林羽墨_学生会长.json', '苏晚晴_邻居姐姐.json'],

            storyStarts: ['剧情2_主动的学姐.json', '剧情3_会长的邀请.json', '剧情4_邻居姐姐.json']
        },
        '精灵妈妈-后宫': {
            characters: ['林阳_儿子.json', '艾琳_精灵妈妈.json', '叶轻语_追求者.json'],

            storyStarts: ['剧情1_班长的告白.json', '剧情2_精灵妈妈的日常.json']
        },
        '纯爱灭杀-纯爱': {
            characters: ['林渊_男主.json', '米娅_魅魔女主.json'],

            storyStarts: ['剧情1_猎人与猎物.json']
        },
        '转世咸鱼-纯爱': {
            characters: ['叶凡_男主.json', '顾清寒_徒弟长老.json'],

            storyStarts: ['剧情1_徒弟的寻找.json']
        },
        '骚气世界-后宫': {
            characters: ['林宇_男主.json', '林小柔_甜美萌妹.json', '冷若雪_冰山女神.json', '王诗雅_绿茶婊.json', '苏媚儿_御姐老师.json', '陈思雨_温柔学姐.json'],

            storyStarts: ['剧情1_甜妹的诱惑.json', '剧情2_冰山女神的融化.json', '剧情3_绿茶婊的主动.json', '剧情4_御姐老师的邀请.json', '剧情5_温柔学姐的关怀.json']
        },
        '魔物工具人-后宫': {
            characters: ['林风_男主.json', '黛西_魅魔契约.json', '塞壬_人鱼契约.json', '娜塔莎_蛛女契约.json', '米诺娃_蛇女契约.json'],

            storyStarts: ['剧情1_魅魔契约.json', '剧情2_人鱼塞壬.json', '剧情3_蛛女娜塔莎.json', '剧情4_蛇女米诺娃.json']
        },
        '白月光复活-纯爱': {
            characters: ['林轩_男主.json', '苏雨晴_未婚妻.json', '林诗雅_青梅竹马.json', '林小暖_干妹妹.json', '沈冰_公司后辈.json'],

            storyStarts: ['剧情1_死而复生.json', '剧情2_青梅竹马的十年.json', '剧情3_干妹妹的执念.json', '剧情4_传说变成了现实.json']
        },
        '兄控妹妹-后宫': {
            characters: ['林逸_男主.json', '林诗涵_亲妹妹.json', '林小暖_干妹妹.json'],

            storyStarts: ['剧情1_突如其来的发现.json', '剧情2_亲妹妹的温柔陷阱.json', '剧情3_干妹妹的元气表白.json', '剧情4_日常相处中的甜蜜.json', '剧情5_高考结束后的突破.json']
        },
        '完美大师兄-后宫': {
            characters: ['萧逸_男主.json', '慕容清雪_师尊.json', '苏小柔_小师妹.json', '上官月_二师姐.json', '林紫萱_小徒弟.json'],

            storyStarts: ['剧情1_穿越成完美大师兄.json', '剧情2_师尊的温柔考察.json', '剧情3_小师妹的撒娇攻势.json', '剧情4_傲娇二师姐的嘴硬.json', '剧情5_小徒弟的占有欲.json']
        },
        '失忆杀神-后宫': {
            characters: ['夜刃_男主.json', '白洛璃_妻子.json', '夜轻舞_义妹.json', '萧若水_未婚妻.json', '血刹_下属.json'],

            storyStarts: ['剧情1_失忆的杀神.json', '剧情2_妻子的重逢.json', '剧情3_义妹的追随.json', '剧情4_未婚妻的坚持.json', '剧情5_血刹的忠诚.json']
        },
        '冲师逆徒-纯爱': {
            characters: ['玄渊子_师父.json', '苏小酒_徒弟.json', '上官晴_二师姐.json', '萧云逸_大师兄.json'],

            storyStarts: ['剧情1_倒反天罡.json', '剧情2_求求你了.json', '剧情3_二师姐的助攻.json']
        },
        '男妈妈-纯爱': {
            characters: ['顾临风_男主.json', '顾临月_女主.json', '林诗雨_大师姐.json', '苏小暖_小徒弟.json', '萧云_小师弟.json'],

            storyStarts: ['剧情1_嗷嗷待哺.json', '剧情2_摆烂的师傅.json', '剧情3_天降女主.json']
        },
        '八卦-后宫': {
            characters: ['陈轩_男主.json', '顾清歌_天道掌控者.json', '顾柔嘉_大地守护者.json', '顾澜心_水灵.json', '顾曜_火灵.json', '顾凌风_风灵.json', '顾惊蛰_雷灵.json', '顾岩_山灵.json', '顾盈泽_泽灵.json'],

            storyStarts: ['剧情1_八卦传承.json', '剧情2_天道掌控者.json', '剧情3_大地守护者.json', '剧情4_水灵与火灵.json', '剧情5_风灵与雷灵.json']
        },
        '山海神话-纯爱': {
            characters: ['云寒_男主.json', '青璃_青鸾女主.json', '白汐_白虎女主.json', '玄冥_玄武女主.json', '朱焰_朱雀女主.json', '林语_麒麟女主.json', '鲲鹏_鲲鹏女主.json', '朱六_九尾狐女主.json', '烛龙_烛龙女主.json', '应龙_应龙女主.json', '天马_天马女主.json', '夔牛_夔牛女主.json', '白泽_白泽女主.json', '饕餮_饕餮女主.json', '猼訑_猼訑女主.json', '陆吾_陆吾女主.json', '麒麟儿_瑞兽麒麟女主.json', '乘黄_乘黄女主.json', '腰市_腰市女主.json', '光影_光影女主.json', '祸斗_祸斗女主.json', '玉兔_月兔女主.json', '丈仙_丈仙女主.json', '狡墨_狡墨女主.json', '腓腓_腓腓女主.json', '诸犍_诸犍女主.json', '狻猊_狻猊女主.json', '獬豸_獬豸女主.json', '狡獬_狡獬女主.json', '帝俊_太阳女神.json', '嫦娥_月宫仙子.json', '瑶池_瑶池仙子.json', '精精_精精兽.json', '梨梨_山梨女神.json', '螺蛳_螺蛳精女主.json', '蝇螺_蝇螺小妖女主.json', '蜉蝣_蜉蝣仙子女主.json', '萤火_萤火虫精女主.json', '蚂蚁_蚂蚁精女主.json', '浮游_浮游神兽.json', '山魈_山魈女主.json', '赤蚊_赤蚊女主.json', '窃脂_窃脂女主.json', '无仙_无仙女主.json', '严狚_严狚女主.json', '朱猄_朱猄女主.json', '赤纽_赤纽女主.json', '番禺_番禺女主.json', '鼍雅_鼍女主.json', '猫又_猫又女主.json', '赑屃_赑屃女主.json'],

            storyStarts: ['剧情1_青鸾报恩.json', '剧情2_白虎抢亲.json', '剧情3_北海之救.json', '剧情4_火海情深.json', '剧情5_仙泽疗伤.json', '剧情6_北海惊梦.json', '剧情7_青丘幻境.json', '剧情8_极西时间.json', '剧情9_黄河治水.json', '剧情10_天穹赛跑.json', '剧情11_雷泽雷劫.json', '剧情12_山中指点.json', '剧情13_烤鱼之约.json', '剧情14_命运占卜.json', '剧情15_昆仑禁地.json', '剧情16_祥瑞降临.json', '剧情17_神马援救.json', '剧情18_竹林天籁.json', '剧情19_光影交错.json', '剧情20_火山冲突.json', '剧情21_月下相遇.json', '剧情22_山神之母.json', '剧情23_墨池画缘.json', '剧情24_梦幻遗忘.json', '剧情25_山林追逐.json', '剧情26_阳光普照.json', '剧情27_月下邂逅.json', '剧情28_瑶池治愈.json', '剧情29_精灵恶作剧.json', '剧情30_花果赠予.json', '剧情31_夜猫捕猎.json', '剧情32_山谷正义.json', '剧情33_火山相遇.json', '剧情34_法场审判.json', '剧情35_河畔负重.json', '剧情36_林间跳跃.json', '剧情37_山中偶遇.json', '剧情38_海边织女.json', '剧情39_池塘晒背.json', '剧情40_草丛精灵.json', '剧情41_池塘螺蛳.json', '剧情42_水边蝇螺.json', '剧情43_朝阳光芒.json', '剧情44_黑夜萤火.json', '剧情45_草地蚂蚁.json', '剧情46_温暖火焰.json', '剧情47_山谷幽魂.json', '剧情48_山中之笑.json', '剧情49_深山悟道.json', '剧情50_夜晚吸血.json']
        },
        '灵蛟-现代纯爱': {
            characters: ['陈轩_男主.json', '青凝_灵蛟女主.json'],
            aiSettings: null,
            storyStarts: ['剧情1_雨夜奇遇.json', '剧情2_化形.json', '剧情3_原形缠绵.json', '剧情4_做饭时的骚扰.json', '剧情5_洗澡时的恶作剧.json', '剧情6_沙发上.json', '剧情7_床上.json', '剧情8_逛街.json', '剧情9_看电影.json']
        },
        '狂想曲-后宫': {
            characters: ['李阳_男主.json', '美雪_姑姑.json', '莉音_表姐.json', '结衣_表妹.json'],
            aiSettings: null,
            storyStarts: ['剧情1_返乡.json', '剧情2_初见结衣.json', '剧情3_美味早餐.json', '剧情4_洗碗时光.json', '剧情5_逛街.json', '剧情6_辅导作业.json', '剧情7_夜晚.json', '剧情8_感冒.json', '剧情9_海边.json', '剧情10_家庭聚会.json']
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
                    this.storyStarts = data.storyStarts || {};
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
            this.showWorldSelector();
            return;
        }
        
        this.worlds = Object.keys(this._worldData);
        this.characters = {};
        this.storyStarts = {};
        
        for (const worldName of this.worlds) {
            this.characters[worldName] = [];
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
            '千变万化-后宫',
            '白月光复活-纯爱',
            '兄控妹妹-后宫',
            '完美大师兄-后宫',
            '失忆杀神-后宫',
            '冲师逆徒-纯爱',
            '男妈妈-纯爱',
            '八卦-后宫'
        ];
        
        this.characters = {};
        this.storyStarts = {};
        
        for (const worldName of this.worlds) {
            this.characters[worldName] = [];
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
                                // 忽略AI设置文件
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
                            // 忽略AI设置文件
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
        html += '<p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:12px;">导入将包含该世界观下的所有角色</p>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
        
        for (const worldName of this.worlds) {
            const charCount = this.characters[worldName]?.length || 0;

            const hasStoryStart = this.storyStarts[worldName]?.length > 0 ? ' 🎬' : '';
            const safeWorldName = worldName.replace(/'/g, "\\'");
            html += `<button type="button" class="btn btn-secondary" onclick="PresetCharacterLibrary.selectStoryStart('${safeWorldName}')" style="font-size:0.85rem;padding:8px 12px;margin-bottom:4px;">${worldName} (${charCount}个角色)${hasStoryStart}</button>`;
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
        if (!confirm(`确定要导入世界观 "${worldName}" 吗？\n这将创建新世界并导入 ${charCount} 个角色${startInfo}。`)) {
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
    
    createCharacterFromData(charData, worldId, storyStartData) {
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
    

};

window.PresetCharacterLibrary = PresetCharacterLibrary;
PresetCharacterLibrary.init();
