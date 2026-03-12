const Settings = {
    getDefaults() {
        return {
            api: {
                provider: 'DeepSeek',
                endpoint: 'https://api.deepseek.com',
                model: 'deepseek-chat'
            },
            content: {
                tone: '浪漫',
                detailLevel: '中',
                intimacy: 30,
                romance: true,
                adventure: true,
                mystery: false,
                comedy: false,
                drama: true,
                forbidden: [],
                customPrompt: ''
            },
            output: {
                style: '叙事',
                length: '中篇',
                perspective: '第三人称',
                format: '流畅叙述'
            },
            adult: {
                enabled: true,
                intensity: 50,
                variety: 50,
                include: [],
                exclude: []
            }
        };
    },

    get(worldId) {
        if (worldId) {
            return Data.getSettings(worldId) || this.getDefaults();
        }
        return this.getDefaults();
    },

    save(worldId, settings) {
        if (worldId) {
            Data.updateSettings(worldId, settings);
        }
        localStorage.setItem('globalSettings', JSON.stringify(settings));
    },

    getContentOptions() {
        return {
            tone: ['浪漫', '冒险', '悬疑', '喜剧', '剧情', '科幻', '奇幻', '都市'],
            detailLevel: ['简洁', '中', '详细', '奢华'],
            intimacy: ['纯爱', '暧昧', '亲密', '热烈', '激情'],
            style: ['叙事', '对话', '诗意', '直接', '感官', '极简'],
            perspective: ['第一人称', '第三人称', '全知视角'],
            length: ['短篇', '中篇', '长篇', '超长']
        };
    },

    getAdultOptions() {
        return {
            intensity: [
                { value: 0, label: '无' },
                { value: 25, label: '轻微' },
                { value: 50, label: '中等' },
                { value: 75, label: '强烈' },
                { value: 100, label: '极限' }
            ],
            include: [
                { value: 'kiss', label: '亲吻' },
                { value: 'embrace', label: '拥抱' },
                { value: 'touch', label: '抚摸' },
                { value: 'sex', label: '性爱' },
                { value: 'fetish', label: '特殊性癖' },
                { value: 'bdsm', label: 'SM' },
                { value: 'group', label: '多人' }
            ],
            exclude: [
                { value: 'violence', label: '暴力' },
                { value: 'noncon', label: '非自愿' },
                { value: 'minors', label: '未成年人' },
                { value: 'animals', label: '动物' }
            ]
        };
    },

    buildPromptContext(settings) {
        const ctx = [];
        
        if (settings.content) {
            ctx.push(`风格基调：${settings.content.tone || '浪漫'}`);
            ctx.push(`描写程度：${settings.content.detailLevel || '中'}`);
            
            if (settings.adult?.enabled) {
                const intimacyLabels = ['纯爱', '暧昧', '亲密', '热烈', '激情', '淫乱', '重口'];
                const intimacyIdx = Math.min(6, Math.floor((settings.adult.intensity || 0) / 15));
                ctx.push(`亲密程度：${intimacyLabels[intimacyIdx]}`);
            }
            
            const genres = [];
            if (settings.content.romance) genres.push('言情');
            if (settings.content.adventure) genres.push('冒险');
            if (settings.content.mystery) genres.push('悬疑');
            if (settings.content.comedy) genres.push('喜剧');
            if (settings.content.drama) genres.push('剧情');
            if (genres.length) ctx.push(`题材：${genres.join('、')}`);
            
            if (settings.content.customPrompt) ctx.push(`自定义要求：${settings.content.customPrompt}`);
        }
        
        if (settings.output) {
            ctx.push(`文风：${settings.output.style || '叙事'}`);
            ctx.push(`篇幅：${settings.output.length || '中篇'}`);
            ctx.push(`视角：${settings.output.perspective || '第三人称'}`);
        }
        
        return ctx.join('。') + '。';
    }
};

window.Settings = Settings;
