const Archive = {
    viewArchive(archiveId) {
        const world = Data.getCurrentWorld();
        const archives = Story.getArchives(world.id);
        const archive = archives.find(a => a.id === archiveId);
        
        if (!archive) return;
        
        const archiveInfo = this._extractArchiveInfo(archive);
        const modalContent = this._buildArchiveViewContent(archive, archiveInfo);
        App.namespace.modal.show(archive.title, modalContent);
    },
    
    viewArchivedStory(archiveId) {
        const world = Data.getCurrentWorld();
        const archived = Story.getArchivedStories(world.id);
        const archive = archived.find(a => a.id === archiveId);
        
        if (!archive) return;
        
        const archiveInfo = this._extractArchivedStoryInfo(archive);
        const modalContent = this._buildArchivedStoryViewContent(archive, archiveInfo);
        App.namespace.modal.show(archive.title, modalContent);
    },
    
    viewLevel2Story(archiveId) {
        const world = Data.getCurrentWorld();
        const level2 = Story.getLevel2Archives(world.id);
        const archive = level2.find(a => a.id === archiveId);
        
        if (!archive) return;
        
        const archiveInfo = this._extractLevel2StoryInfo(archive);
        const modalContent = this._buildLevel2StoryViewContent(archive, archiveInfo);
        App.namespace.modal.show(archive.title, modalContent);
    },
    
    viewLevel3Story(archiveId) {
        const world = Data.getCurrentWorld();
        const level3 = Story.getLevel3Archives(world.id);
        const archive = level3.find(a => a.id === archiveId);
        
        if (!archive) return;
        
        const archiveInfo = this._extractLevel3StoryInfo(archive);
        const modalContent = this._buildLevel3StoryViewContent(archive, archiveInfo);
        App.namespace.modal.show(archive.title, modalContent);
    },
    
    _extractArchiveInfo(archive) {
        let charNames = '';
        let storyContent = '';
        
        if (archive.stories && archive.stories.length > 0) {
            const storyTitles = archive.stories.map((s, i) => `${i + 1}. ${s.title}`).join('<br>');
            const lastStory = archive.stories[archive.stories.length - 1];
            charNames = Array.isArray(lastStory.characters) 
                ? lastStory.characters.map(c => c.name).join('、') 
                : (lastStory.characters || '未知');
            storyContent = `
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.85rem; color: var(--text-dim);">故事列表</div>
                    <div>${storyTitles}</div>
                </div>
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.85rem; color: var(--text-dim);">故事数</div>
                    <div>${archive.stories.length}个故事</div>
                </div>
            `;
        } else {
            charNames = Array.isArray(archive.characters) 
                ? archive.characters.map(c => c.name).join('、') 
                : archive.characters;
            storyContent = `
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.85rem; color: var(--text-dim);">幕数</div>
                    <div>${archive.sceneCount}幕</div>
                </div>
            `;
        }
        
        return { charNames, storyContent };
    },
    
    _extractArchivedStoryInfo(archive) {
        const charNames = Array.isArray(archive.characters) 
            ? archive.characters.map(c => c.name).join('、') 
            : archive.characters;
        
        return {
            charNames,
            sceneCount: archive.sceneCount,
            archivedAt: archive.archivedAt,
            summary: archive.summary
        };
    },
    
    _extractLevel2StoryInfo(archive) {
        return {
            sceneCount: archive.sceneCount,
            archivedAt: archive.archivedAt,
            summary: archive.summary
        };
    },
    
    _extractLevel3StoryInfo(archive) {
        const storiesHtml = archive.stories ? archive.stories.map(s => `
            <div style="margin-bottom: 12px; padding: 8px; background: var(--border); border-radius: 6px;">
                <div style="font-weight: 500; margin-bottom: 4px;">${s.title}</div>
                <div style="font-size: 0.85rem;">${s.summary}</div>
            </div>
        `).join('') : '';
        
        return {
            storyCount: archive.stories ? archive.stories.length : 0,
            archivedAt: archive.archivedAt,
            summary: archive.summary,
            storiesHtml
        };
    },
    
    _buildArchiveViewContent(archive, info) {
        return `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">角色</div>
                <div>${info.charNames}</div>
            </div>
            ${info.storyContent}
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">开始时间</div>
                <div>${formatDateTime(archive.startTime)}</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">结束时间</div>
                <div>${formatDateTime(archive.endTime)}</div>
            </div>
            <button class="btn btn-secondary" onclick="App.namespace.modal.close()">关闭</button>
        `;
    },
    
    _buildArchivedStoryViewContent(archive, info) {
        return `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">角色</div>
                <div>${info.charNames}</div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">幕数</div>
                <div>${info.sceneCount}幕</div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">归档时间</div>
                <div>${formatDateTime(info.archivedAt)}</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">故事概要</div>
                <div>${info.summary || '无'}</div>
            </div>
            <button class="btn btn-secondary" onclick="App.namespace.modal.close()">关闭</button>
        `;
    },
    
    _buildLevel2StoryViewContent(archive, info) {
        return `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">幕数</div>
                <div>${info.sceneCount}幕</div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">归档时间</div>
                <div>${formatDateTime(info.archivedAt)}</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">故事摘要</div>
                <div style="max-height: 300px; overflow-y: auto;">${info.summary || '无'}</div>
            </div>
            <button class="btn btn-secondary" onclick="App.namespace.modal.close()">关闭</button>
        `;
    },
    
    _buildLevel3StoryViewContent(archive, info) {
        return `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">故事数量</div>
                <div>${info.storyCount}个故事</div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">归档时间</div>
                <div>${formatDateTime(info.archivedAt)}</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 0.85rem; color: var(--text-dim);">合集摘要</div>
                <div style="max-height: 300px; overflow-y: auto;">${info.summary || '无'}</div>
            </div>
            <button class="btn btn-secondary" onclick="App.namespace.modal.close()">关闭</button>
        `;
    },
    
    resumeArchive(archiveId) {
        try {
            const story = Story.resumeArchive(archiveId);
            if (story) {
                App.namespace.router.showPage('story');
            } else {
                alert('无法继续此故事，可能缺少保存的剧情内容');
            }
        } catch (err) {
            alert('错误：' + err.message);
        }
    },
    
    exportArchive(archiveId) {
        try {
            Story.exportArchive(archiveId);
            
            if (typeof AchievementPlugin !== 'undefined') {
                AchievementPlugin.updateStats('export');
            }
        } catch (err) {
            alert('导出失败：' + err.message);
        }
    },
    
    deleteArchive(archiveId) {
        if (!confirm('确定要删除这个故事吗？此操作不可恢复。')) return;
        
        try {
            if (Story.deleteArchive(archiveId)) {
                App.namespace.router.showPage('story');
            } else {
                alert('删除失败');
            }
        } catch (err) {
            alert('错误：' + err.message);
        }
    }
};

// 暴露到全局
window.viewArchive = function(archiveId) {
    Archive.viewArchive(archiveId);
};

window.viewArchivedStory = function(archiveId) {
    Archive.viewArchivedStory(archiveId);
};

window.viewLevel2Story = function(archiveId) {
    Archive.viewLevel2Story(archiveId);
};

window.viewLevel3Story = function(archiveId) {
    Archive.viewLevel3Story(archiveId);
};

window.resumeArchive = function(archiveId) {
    Archive.resumeArchive(archiveId);
};

window.exportArchive = function(archiveId) {
    Archive.exportArchive(archiveId);
};

window.deleteArchive = function(archiveId) {
    Archive.deleteArchive(archiveId);
};