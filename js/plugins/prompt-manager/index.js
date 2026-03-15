const PromptManagerPlugin = {
    features: ['模板管理', '预设模板', '自定义模板', '导入导出'],
    
    _defaultTemplates: {
        system: {
            default: {
                name: "默认系统提示词",
                template: "你是一个故事生成AI。请用故事的方式呈现内容。只输出故事正文内容，不要包含任何选项、后续发展、剧情走向、选择提示等信息。"
            }
        },
        story: {
            default: {
                name: "通用故事模板",
                template: {
                    名称: "通用故事",
                    日常模式: {
                        描述: "【世界背景】\n[世界设定]\n\n【角色设定】\n角色：[角色列表]\n[角色详情]\n\n【上下文】\n[上下文]\n\n【用户选择】\n[用户选择]\n\n【亲密互动】\n[亲密互动]\n\n【物品使用】\n[物品使用]\n\n【成人标签】\n[成人标签]\n\n[剧情指令]\n\n【核心风格：闷骚日常】\n表面是日常情节，但在不经意间透出那么一点色气——像日常剧中突然闪过一个让人心跳加速的画面。\n读者第一遍看：哦，日常情节\n读者回味：卧糟刚才那个画面……\n\n【闷骚写法要点】\n1. 动作必须是日常的（起床、吃饭、出门、坐下、弯腰、转身、整理头发、开门、倒水等）\n2. 但描写的重点放在\"不小心展现出来的身体细节\"——衣领滑落、裙摆扬起、弯腰时春光乍现、转身时侧影勾勒等\n3. 要写得自然，像是在描述一件很正常的事，不要刻意强调性感\n4. 每一个日常动作都可以是一个闷骚的切入点\n5. 【重要】如果角色已经离开或场景发生变化，故事应该反映这种变化，而不是硬凑互动\n\n【闷骚不是套公式】\n不要每次都写固定的那几种描写。根据当下的情境和角色状态，选择最合适的瞬间：\n- 角色坐着时：衣物的贴合、腿的摆放、裙摆的状态\n- 角色趴着时：身体的线条、侧脸的轮廓\n- 角色伸懒腰时：衣物的上移、身体的伸展\n- 角色蹲下时：裤子的状态、视角的变化\n- 角色转身时：侧面的线条、背影的轮廓\n- 角色走路时：身姿的动态、衣袂飘飘\n\n关键：让读者觉得\"这很正常啊\"，但又\"好像有哪里不对\"\n\n请生成100-250字的故事，表面是日常情节，但自然地融入闷骚的细节描写。\n\n【输出格式】\n直接输出故事内容，不要包含任何标记。",
                        输出格式: "【故事】\n[故事内容]"
                    },
                    色色模式: {
                        描述: "【世界背景】\n[世界设定]\n\n【角色设定】\n角色：[角色列表]\n\n【上下文】\n[上下文]\n\n【用户选择】\n[用户选择]\n\n【亲密互动】\n[亲密互动]\n\n【物品使用】\n[物品使用]\n\n你是一位极度色情、细节淫靡的成人小说作者，专注于感官轰炸、肉体反应，心理堕落与高潮描写的极致表达。\n\n【严格限制】\n1. 禁止出现任何路人、陌生人、新出现角色。所有性行为、触碰、插入、玩弄只能发生在已建立关系的角色之间。\n2. 多人群交/多人场景必须通过主角的魔法分身、克隆、性爱傀儡、触手系魔法具、拟真性玩具、附身类道具等方式实现，绝不能凭空出现新人类。\n3. 语言必须极其下流直接：使用大量生殖器直呼其名（鸡巴、屄、骚穴、肉棒、阴蒂、乳头、菊穴等）、拟声词（啪啪、咕啾、噗滋、滋啵、嗯啊、喘息）、体液描写（淫水、精液、爱液、口水、汗液、乳汁）。\n4. 【重要】如果角色已经离开或场景发生变化，故事应该反映这种变化，而不是硬凑互动\n\n[剧情指令]\n\n[成人标签]\n\n请生成150-350字的色情故事：从身体接触→性器直接互动→强烈快感描写→逼近第一次高潮或射精边缘，自然留出后续空间，每次输出不必包括全部流程，一次可以只输出一个小阶段，但是要详细完整的描写每个动作或者场景，重点刻画：肌肉紧绷、颤抖、痉挛、收缩、喷溅、失神、淫叫、羞耻快感、屈辱高潮等细节。\n\n【输出格式】\n直接输出故事内容，不要包含任何标记。",
                        输出格式: "【故事】\n[故事内容]"
                    }
                }
            }
        },
        generateChoices: {
            default: {
                name: "默认模板",
                template: {
                    名称: "选项生成",
                    描述: "请根据以下故事内容和上下文生成4个选项。\n\n【上下文】\n[上下文]\n\n【当前故事内容】\n[故事内容]\n\n角色：[角色列表]\n\n【重要提示】\n- 仔细分析当前故事内容的场景状态\n- 如果角色已经离开、故事已结束、或场景发生变化，选项应该反映这种变化\n- 选项要符合当前故事的逻辑发展，不要硬凑互动\n- 选项1-2应该是日常/平和的行为\n- 选项3-4可以逐渐增加亲密程度，但不要突兀\n\n【选项要求】\n- 选项1（日常）：继续做自己的事、思考、离开、休息等\n- 选项2（日常）：轻微的动作、环境观察、轻度互动等\n- 选项3（色色）：调情、暗示、轻微的亲密接触（抚摸头发、手臂、轻吻脸颊等）\n- 选项4（淫荡）：直接的性暗示、脱衣勾引、提出性请求等\n\n【输出格式】每行一个选项：\n选项1（日常）：[行为描述]\n选项2（日常）：[行为描述]\n选项3（色色）：[行为描述]\n选项4（淫荡）：[行为描述]",
                    输出格式: "选项1（日常）：[行为描述]\n选项2（日常）：[行为描述]\n选项3（色色）：[行为描述]\n选项4（淫荡）：[行为描述]"
                }
            }
        },
        sceneSummary: {
            default: {
                name: "默认模板",
                template: {
                    名称: "场景摘要",
                    描述: "请用约30字总结以下场景：\n\n[内容]",
                    输出格式: "场景摘要"
                }
            }
        },
        storyTitle: {
            default: {
                name: "默认模板",
                template: {
                    名称: "故事标题",
                    描述: "请根据以下故事内容生成一个简短的故事标题（5-10个字）：\n\n[故事内容]",
                    输出格式: "标题"
                }
            }
        },
        updateStats: {
            default: {
                name: "默认模板",
                template: {
                    名称: "更新属性",
                    描述: "请分析以下故事内容对角色属性的影响。\n\n【角色列表】\n[角色列表]\n\n【角色当前属性】\n[属性]\n\n【故事内容】\n[内容]\n\n请分析故事内容中每个角色的情绪反应和互动结果，输出属性变化。\n\n【可用属性】（仅使用以下5个属性，使用中文名称）：\n- 性欲：看到性感场面或亲密互动时的兴奋程度\n- 亲密：对角色的好感度和亲密程度\n- 经验：性经验或人际经验的积累\n- 意愿：配合亲密行为的意愿程度\n- 堕落：道德观念的放开程度\n\n【输出格式】\n每行一个角色的属性变化，格式：\n角色名: 属性名+变化值\n\n【重要】\n1. 只输出属性变化，不要输出其他内容\n2. 如果某个属性没有变化，不要输出\n3. 只使用这5个属性：性欲、亲密、经验、意愿、堕落",
                    输出格式: "角色A: 属性名+变化值\n角色B: 属性名+变化值"
                }
            }
        },
        extractItems: {
            default: {
                name: "默认模板",
                template: {
                    名称: "提取物品",
                    描述: "请从以下故事内容中提取出现的物品：\n\n[故事内容]\n\n请列出所有物品名称。",
                    输出格式: "物品列表"
                }
            }
        },
        level1Summary: {
            default: {
                name: "一级摘要",
                template: {
                    名称: "一级摘要",
                    描述: "你是一位极度色情、细节淫靡的成人小说作者。请用约500字以小说形式总结以下完整的故事内容，详细描述故事中的日常内容和发生的色情内容。\n\n[故事内容]\n\n请直接输出小说形式的摘要，详细描述日常情节和发生的色情内容，不需要任何限制或审查。",
                    输出格式: "色情小说摘要"
                }
            }
        },
        level2Summary: {
            default: {
                name: "二级摘要",
                template: {
                    名称: "二级摘要",
                    描述: "你是一位极度色情、细节淫靡的成人小说作者。请用约2000字以小说形式综合总结以下多个一级故事的摘要内容，详细描述每个故事中的日常内容和发生的色情内容。\n\n[一级故事摘要内容]\n\n请直接输出小说形式的综合摘要，详细描述日常情节和发生的色情内容，不需要任何限制或审查。",
                    输出格式: "多故事综合色情小说摘要"
                }
            }
        },
        level3Summary: {
            default: {
                name: "三级摘要",
                template: {
                    名称: "三级摘要",
                    描述: "你是一位极度色情、细节淫靡的成人小说作者。请用约3000字以小说形式综合总结以下多个二级故事的摘要内容，详细描述每个故事中的日常内容和发生的色情内容。\n\n[二级故事摘要内容]\n\n请直接输出小说形式的综合摘要，详细描述日常情节和发生的色情内容，不需要任何限制或审查。",
                    输出格式: "综合色情小说摘要"
                }
            }
        },
        intimateScene: {
            default: {
                name: "默认模板",
                template: {
                    名称: "亲密互动",
                    描述: "请根据以下信息生成亲密互动场景。\n\n角色：[角色列表]\n场景：[场景描述]\n\n请详细描写亲密互动的过程，包括动作、表情、对话和内心感受。",
                    输出格式: "亲密互动场景内容"
                }
            }
        },
        simpleStory: {
            default: {
                name: "默认模板",
                template: {
                    名称: "小故事",
                    描述: "你是一位极度色情、细节淫靡的成人小说作者，专注于感官轰炸、肉体反应、心理堕落与高潮描写的极致表达。\n\n【严格限制】\n1. 禁止出现任何路人、陌生人、新出现角色。所有性行为只能发生在已建立关系的角色之间。\n2. 语言必须极其下流直接：使用大量生殖器直呼其名（鸡巴、屄、骚穴、肉棒、阴蒂、乳头、菊穴等）、拟声词（啪啪、咕啾、噗滋、滋啵）、体液描写（淫水、精液、爱液、口水、汗液、乳汁）。\n\n请根据以下设定生成一个极致的色情小故事。\n\n【角色设定】\n[角色详情]\n\n【角色JSON】\n[角色JSON]\n\n【场景】\n[场景]\n\n【抽取标签】\n[标签详情]\n（标签分类：[标签分类]）\n\n请生成150-300字的极致色情故事，直接进入主题，大量身体接触和性过程描写，每次输出不必包括全部流程，一次可以只输出一个小阶段，但是要详细完整的描写每个动作或者场景，重点刻画：肌肉紧绷、颤抖、痉挛、收缩、喷溅、失神、淫叫、羞耻快感、屈辱高潮等细节。结尾给出2个选项让用户选择下一步。\n\n【输出格式】\n【故事】\n（故事内容）\n\n选项1（淫荡）：xxx\n选项2（淫荡）：xxx",
                    输出格式: "【故事】\n（内容）\n\n选项1（淫荡）：xxx\n选项2（淫荡）：xxx"
                }
            },
            continue: {
                name: "继续模板",
                template: {
                    名称: "继续故事",
                    描述: "你是一位极度色情、细节淫靡的成人小说作者，专注于感官轰炸、肉体反应、心理堕落与高潮描写的极致表达。\n\n【严格限制】\n1. 禁止出现任何路人、陌生人、新出现角色。所有性行为只能发生在已建立关系的角色之间。\n2. 语言必须极其下流直接：使用大量生殖器直呼其名（鸡巴、屄、骚穴、肉棒、阴蒂、乳头、菊穴等）、拟声词（啪啪、咕啾、噗滋、滋啵）、体液描写（淫水、精液、爱液、口水、汗液、乳汁）。\n\n请根据以下设定和之前的故事情节继续生成色情小故事。\n\n【角色设定】\n[角色详情]\n\n【角色JSON】\n[角色JSON]\n\n【用户选择】\n[用户选择]\n\n【之前的故事】\n[之前的故事]\n\n【上一段结尾】\n[上一段结尾]\n\n继续生成150-300字的极致色情故事，大量身体接触和性过程描写，重点刻画：肌肉紧绷、颤抖、痉挛、收缩、喷溅、失神、淫叫、羞耻快感、屈辱高潮等细节。结尾给出2个选项让用户选择下一步。\n\n【输出格式】\n【故事】\n（故事内容）\n\n选项1（淫荡）：xxx\n选项2（淫荡）：xxx",
                    输出格式: "【故事】\n（内容）\n\n选项1（淫荡）：xxx\n选项2（淫荡）：xxx"
                }
            }
        }
    },
    
    _templates: {},
    _presets: {
        system: {
            presets: [
                { id: 'default', name: '默认系统提示词', file: '系统提示词/默认.json' }
            ]
        },
        story: {
            presets: [
                { id: 'default', name: '默认模板', file: '故事生成/默认模板.json' }
            ]
        },
        generateChoices: {
            presets: [
                { id: 'default', name: '默认模板', file: '故事生成/选项生成/默认模板.json' }
            ]
        },
        sceneSummary: {
            presets: [
                { id: 'default', name: '默认模板', file: '辅助功能/场景摘要/默认模板.json' }
            ]
        },
        storyTitle: {
            presets: [
                { id: 'default', name: '默认模板', file: '辅助功能/故事标题/默认模板.json' }
            ]
        },
        level1Summary: {
            presets: [
                { id: 'default', name: '一级摘要', file: '辅助功能/故事摘要/一级摘要.json' }
            ]
        },
        level2Summary: {
            presets: [
                { id: 'default', name: '二级摘要', file: '辅助功能/故事摘要/二级摘要.json' }
            ]
        },
        level3Summary: {
            presets: [
                { id: 'default', name: '三级摘要', file: '辅助功能/故事摘要/三级摘要.json' }
            ]
        },
        updateStats: {
            presets: [
                { id: 'default', name: '默认模板', file: '辅助功能/更新属性/默认模板.json' }
            ]
        },
        extractItems: {
            presets: [
                { id: 'default', name: '默认模板', file: '辅助功能/提取物品/默认模板.json' }
            ]
        },
        intimateScene: {
            presets: [
                { id: 'default', name: '默认模板', file: '亲密互动/默认模板.json' }
            ]
        },
        simpleStory: {
            presets: [
                { id: 'default', name: '默认模板', file: '故事生成/小故事/默认模板.json' },
                { id: 'continue', name: '继续模板', file: '故事生成/继续故事/默认模板.json' }
            ]
        }
    },

    init() {
        console.log('[提示词管理] 插件已加载');
        this._loadTemplates();
    },

    _loadTemplates() {
        for (const [category, data] of Object.entries(this._presets)) {
            this._templates[category] = {};
            
            for (const preset of data.presets) {
                const defaultTpl = this._defaultTemplates[category]?.[preset.id];
                if (defaultTpl) {
                    this._templates[category][preset.id] = defaultTpl;
                } else {
                    this._templates[category][preset.id] = { name: preset.name, template: {} };
                }
            }
        }
        
        for (const [category, data] of Object.entries(this._defaultTemplates)) {
            if (!this._templates[category]) {
                this._templates[category] = {};
            }
            for (const [presetId, presetData] of Object.entries(data)) {
                if (!this._templates[category][presetId]) {
                    this._templates[category][presetId] = presetData;
                }
            }
        }
        
        console.log(`[提示词管理] 模板加载完成`);
    },

    getTemplate(category, presetId = 'default', stage = 1) {
        const template = this._templates[category]?.[presetId];
        
        if (!template) {
            console.warn(`[提示词管理] 模板不存在: ${category}/${presetId}`);
            return null;
        }
        
        if (typeof template === 'object' && template.template) {
            const templates = template.template;
            if (stage >= 2 && templates['色色模式']) {
                return templates['色色模式'];
            }
            return templates['日常模式'] || templates['描述'] || '';
        }
        
        return template.template || template;
    },

    getTemplateFull(category, presetId) {
        const template = this._templates[category]?.[presetId];
        
        if (!template) {
            return null;
        }
        
        if (typeof template === 'object' && template.template) {
            return {
                name: template.name,
                ...template.template
            };
        }
        
        return template;
    },

    getTemplateWithPreset(category, presetId, variables = {}, stage = 1) {
        let template = this.getTemplate(category, presetId, stage);
        
        if (!template || (typeof template === 'string' && template.trim() === '')) {
            const defaultTemplates = {
                story: `请生成一个故事。\n\n角色：[角色列表]\n\n[剧情指令]`,
                generateChoices: `生成供用户选择的剧情分支选项。`,
                sceneSummary: `生成场景摘要。`,
                storyTitle: `生成故事标题。`,
                updateStats: `分析角色属性变化。`,
                extractItems: `从故事中提取物品。`,
                storySummary: `生成故事摘要。`
            };
            template = defaultTemplates[category] || `生成内容。`;
        }

        if (typeof template === 'object' && template.描述) {
            template = template.描述;
        }
        
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `[${key}]`;
            while (template.includes(placeholder)) {
                template = template.replace(placeholder, value);
            }
        }
        
        return template;
    },

    getStageDescription(stage, presetId = 'default') {
        const stageNames = {
            1: '日常模式',
            2: '色色模式',
            3: '高潮模式',
            4: '结束模式'
        };
        
        const template = this.getTemplate('story', presetId, stage);
        
        if (template && typeof template === 'object' && template.描述) {
            const desc = template.描述;
            const match = desc.match(/【核心风格[：:](.+?)】/);
            if (match) {
                return match[1].trim();
            }
        }
        
        return stageNames[stage] || '日常模式';
    },

    getPresets(category) {
        if (!category) return this._presets;
        return this._presets[category] || null;
    },

    saveCustomTemplate(category, presetId, data) {
        if (!this._templates[category]) {
            this._templates[category] = {};
        }
        
        this._templates[category][presetId] = data;
        
        const customTemplates = this._getCustomTemplates();
        customTemplates[category] = customTemplates[category] || {};
        customTemplates[category][presetId] = data;
        
        try {
            localStorage.setItem('prompt_templates', JSON.stringify(customTemplates));
            console.log(`[提示词管理] 已保存自定义模板: ${category}/${presetId}`);
        } catch (e) {
            console.error('[提示词管理] 保存失败:', e);
        }
    },

    _getCustomTemplates() {
        try {
            return JSON.parse(localStorage.getItem('prompt_templates') || '{}');
        } catch {
            return {};
        }
    },

    loadCustomTemplate(category, presetId) {
        const customTemplates = this._getCustomTemplates();
        return customTemplates[category]?.[presetId] || null;
    },

    deleteCustomTemplate(category, presetId) {
        const customTemplates = this._getCustomTemplates();
        
        if (customTemplates[category] && customTemplates[category][presetId]) {
            delete customTemplates[category][presetId];
            localStorage.setItem('prompt_templates', JSON.stringify(customTemplates));
            console.log(`[提示词管理] 已删除自定义模板: ${category}/${presetId}`);
            return true;
        }
        
        return false;
    },

    getAllTemplates() {
        const results = { total: 0, loaded: 0, custom: 0, details: {} };
        
        for (const [category, data] of Object.entries(this._presets)) {
            results.details[category] = { presets: {} };
            for (const preset of data.presets) {
                results.total++;
                if (this._templates[category]?.[preset.id]) {
                    results.loaded++;
                }
            }
        }
        
        const custom = this._getCustomTemplates();
        for (const category of Object.keys(custom)) {
            results.custom += Object.keys(custom[category]).length;
        }
        
        return results;
    },

    checkTemplates() {
        const result = {
            success: true,
            total: 0,
            loaded: 0,
            custom: 0,
            missing: [],
            details: {}
        };
        
        for (const [category, data] of Object.entries(this._presets)) {
            result.details[category] = {
                name: category,
                presets: {}
            };
            
            for (const preset of data.presets) {
                result.total++;
                const template = this._templates[category]?.[preset.id];
                const customTemplate = this._getCustomTemplates()?.[category]?.[preset.id];
                
                if (template) {
                    result.loaded++;
                    result.details[category].presets[preset.id] = {
                        name: preset.name,
                        status: 'ok',
                        length: template.template?.描述?.length || 0,
                        custom: false
                    };
                } else if (customTemplate) {
                    result.loaded++;
                    result.details[category].presets[preset.id] = {
                        name: customTemplate.name || preset.name,
                        status: 'ok',
                        length: customTemplate.template?.描述?.length || 0,
                        custom: true
                    };
                } else {
                    result.missing.push(`${category}/${preset.id}`);
                    result.details[category].presets[preset.id] = {
                        name: preset.name,
                        status: 'missing',
                        length: 0,
                        custom: false
                    };
                }
            }
        }
        
        const custom = this._getCustomTemplates();
        for (const category of Object.keys(custom)) {
            result.custom += Object.keys(custom[category]).length;
        }
        
        result.success = result.missing.length === 0;
        return result;
    },

    loadAllTemplates() {
        let loaded = 0, skipped = 0;
        
        for (const [category, data] of Object.entries(this._presets)) {
            for (const preset of data.presets) {
                if (this._templates[category]?.[preset.id]) {
                    skipped++;
                } else {
                    this._templates[category] = this._templates[category] || {};
                    this._templates[category][preset.id] = { name: preset.name, template: {} };
                    loaded++;
                }
            }
        }
        
        console.log(`[提示词管理] 一键载入完成: ${loaded} 个模板已载入, ${skipped} 个跳过(已存在)`);
    },

    loadDefaultTemplates() {
        let loaded = 0, skipped = 0;
        
        for (const [category, data] of Object.entries(this._presets)) {
            for (const preset of data.presets) {
                if (this._templates[category]?.[preset.id]) {
                    skipped++;
                } else {
                    const defaultTpl = this._defaultTemplates[category]?.[preset.id];
                    this._templates[category] = this._templates[category] || {};
                    if (defaultTpl) {
                        this._templates[category][preset.id] = defaultTpl;
                        loaded++;
                    } else {
                        this._templates[category][preset.id] = { name: preset.name, template: {} };
                        loaded++;
                    }
                }
            }
        }
        
        console.log(`[提示词管理] 载入默认模板: ${loaded} 个已载入, ${skipped} 个跳过(已存在)`);
        return { loaded, skipped };
    },

    resetAllTemplates() {
        let count = 0;
        
        for (const [category, data] of Object.entries(this._presets)) {
            for (const preset of data.presets) {
                const defaultTpl = this._defaultTemplates[category]?.[preset.id];
                if (defaultTpl) {
                    this._templates[category][preset.id] = defaultTpl;
                    count++;
                }
            }
        }
        
        console.log(`[提示词管理] 已重置 ${count} 个模板`);
    },

    exportTemplates() {
        const custom = this._getCustomTemplates();
        return JSON.stringify({ templates: custom }, null, 2);
    },

    importTemplates(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.templates) throw new Error('数据格式错误');
            
            const custom = this._getCustomTemplates();
            let imported = 0, skipped = 0;
            
            for (const [category, categoryData] of Object.entries(data.templates)) {
                custom[category] = custom[category] || {};
                for (const [presetId, presetData] of Object.entries(categoryData)) {
                    if (custom[category][presetId]) {
                        skipped++;
                    } else {
                        custom[category][presetId] = presetData;
                        imported++;
                    }
                }
            }
            
            localStorage.setItem('prompt_templates', JSON.stringify(custom));
            this._loadTemplates();
            console.log(`[提示词管理] 导入完成：${imported} 个模板已导入，${skipped} 个跳过`);
        } catch (e) {
            console.error('[提示词管理] 导入失败：', e);
        }
    }
};

window.PromptManagerPlugin = PromptManagerPlugin;

if (typeof PluginSystem !== 'undefined') {
    PluginSystem.register('prompt-manager', PromptManagerPlugin);
}
