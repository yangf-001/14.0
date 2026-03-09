const Keyboard = {
    _shortcuts: {},
    _enabled: true,

    init() {
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));
    },

    _handleKeyDown(e) {
        if (!this._enabled) return;
        
        const target = e.target;
        const isInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
        
        if (isInput) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._triggerShortcut('enter', target);
                return;
            }
            if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this._triggerShortcut('ctrlS', target);
                return;
            }
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (e.shiftKey) {
                    this._triggerShortcut('ctrlShiftZ', target);
                } else {
                    this._triggerShortcut('ctrlZ', target);
                }
                return;
            }
            if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this._triggerShortcut('ctrlY', target);
                return;
            }
        }
        
        if (e.key === 'Escape') {
            e.preventDefault();
            this._triggerShortcut('escape', target);
            return;
        }
        
        if (e.key === 'Tab' && !isInput) {
            e.preventDefault();
            this._triggerShortcut('tab', target);
            return;
        }
    },

    _triggerShortcut(name, target) {
        const handlers = this._shortcuts[name];
        if (handlers && handlers.length > 0) {
            handlers.forEach(handler => {
                try {
                    handler(target);
                } catch (e) {
                    console.error(`快捷键 ${name} 执行失败:`, e);
                }
            });
        }
    },

    register(name, handler) {
        if (!this._shortcuts[name]) {
            this._shortcuts[name] = [];
        }
        this._shortcuts[name].push(handler);
    },

    unregister(name, handler) {
        if (this._shortcuts[name]) {
            this._shortcuts[name] = this._shortcuts[name].filter(h => h !== handler);
        }
    },

    enable() {
        this._enabled = true;
    },

    disable() {
        this._enabled = false;
    },

    showHint() {
        const hints = [
            { key: 'Enter', action: '发送消息' },
            { key: 'Ctrl + S', action: '保存' },
            { key: 'Ctrl + Z', action: '撤销' },
            { key: 'Ctrl + Shift + Z', action: '重做' },
            { key: 'Escape', action: '关闭弹窗' }
        ];
        return hints;
    }
};

Keyboard.init();
window.Keyboard = Keyboard;

Keyboard.register('escape', function() {
    const modal = document.getElementById('modal');
    if (modal && modal.classList.contains('active')) {
        modal.classList.remove('active');
    }
});

Keyboard.register('enter', function(target) {
    if (target && target.id === 'customChoiceText') {
        const text = target.value.trim();
        if (text) {
            window.makeCustomChoice();
        }
    }
});

Keyboard.register('ctrlS', function() {
    const world = Data.getCurrentWorld();
    if (world && Story.current && Story.current.status === 'ongoing') {
        Data.saveStory(world.id, Story.current);
        const saveIndicator = document.getElementById('saveIndicator');
        if (saveIndicator) {
            saveIndicator.textContent = '已保存';
            saveIndicator.style.opacity = '1';
            setTimeout(() => {
                saveIndicator.style.opacity = '0';
            }, 1500);
        } else {
            console.log(`[手动保存] ${new Date().toLocaleTimeString()} - ${world.name}`);
        }
    }
});

Keyboard.register('ctrlZ', function() {
    if (HistoryManager.canUndo()) {
        const item = HistoryManager.undo();
        if (item && window.onHistoryUndo) {
            window.onHistoryUndo(item);
        }
    }
});

Keyboard.register('ctrlShiftZ', function() {
    if (HistoryManager.canRedo()) {
        const item = HistoryManager.redo();
        if (item && window.onHistoryRedo) {
            window.onHistoryRedo(item);
        }
    }
});

Keyboard.register('ctrlY', function() {
    if (HistoryManager.canRedo()) {
        const item = HistoryManager.redo();
        if (item && window.onHistoryRedo) {
            window.onHistoryRedo(item);
        }
    }
});
