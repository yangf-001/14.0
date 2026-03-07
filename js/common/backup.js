const BackupManager = {
    _version: '1.0',
    _exportKeys: ['worlds', 'currentWorldId', 'settings', 'pluginData'],

    exportAll() {
        const backup = {
            version: this._version,
            timestamp: Date.now(),
            data: {}
        };

        this._exportKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                backup.data[key] = JSON.parse(value);
            }
        });

        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (key.startsWith('world_') || key.startsWith('archive_')) {
                backup.data[key] = JSON.parse(localStorage.getItem(key));
            }
        });

        return backup;
    },

    exportCurrentWorld() {
        const world = Data.getCurrentWorld();
        if (!world) return null;

        const worldData = localStorage.getItem('world_' + world.id);
        
        return {
            version: this._version,
            timestamp: Date.now(),
            worldId: world.id,
            worldName: world.name,
            data: worldData ? JSON.parse(worldData) : null
        };
    },

    downloadBackup(backup, filename) {
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    async importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    if (!backup.version) {
                        throw new Error('无效的备份文件');
                    }
                    this._restoreBackup(backup);
                    resolve(backup);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    },

    _restoreBackup(backup) {
        if (backup.data) {
            Object.keys(backup.data).forEach(key => {
                localStorage.setItem(key, JSON.stringify(backup.data[key]));
            });
        }
        
        if (backup.worldId) {
            const world = Data.getWorlds().find(w => w.id === backup.worldId);
            if (world) {
                Data.setCurrentWorld(backup.worldId);
            }
        } else if (backup.data && backup.data.currentWorldId) {
            const world = Data.getWorlds().find(w => w.id === backup.data.currentWorldId);
            if (world) {
                Data.setCurrentWorld(backup.worldId);
            }
        }

        window.location.reload();
    },

    restoreFromData(backupData) {
        if (!backupData.data) return false;
        
        try {
            Object.keys(backupData.data).forEach(key => {
                localStorage.setItem(key, JSON.stringify(backupData.data[key]));
            });
            return true;
        } catch (e) {
            console.error('恢复数据失败:', e);
            return false;
        }
    },

    getBackupInfo(backup) {
        const info = {
            version: backup.version,
            timestamp: backup.timestamp,
            date: new Date(backup.timestamp).toLocaleString(),
            worldCount: 0,
            archiveCount: 0,
            size: JSON.stringify(backup).length
        };

        if (backup.data) {
            if (backup.data.worlds) {
                info.worldCount = backup.data.worlds.length;
            }
            
            const archiveKeys = Object.keys(backup.data).filter(k => k.startsWith('archive_'));
            info.archiveCount = archiveKeys.length;
        }

        return info;
    },

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
};

window.BackupManager = BackupManager;
