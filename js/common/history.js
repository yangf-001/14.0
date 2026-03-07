const HistoryManager = {
    _undoStack: [],
    _redoStack: [],
    _maxSize: 50,
    _enabled: false,

    enable() {
        this._enabled = true;
    },

    disable() {
        this._enabled = false;
    },

    push(action) {
        if (!this._enabled) return;
        
        const historyItem = {
            type: action.type,
            data: this._deepClone(action.data),
            timestamp: Date.now()
        };
        
        this._undoStack.push(historyItem);
        
        if (this._undoStack.length > this._maxSize) {
            this._undoStack.shift();
        }
        
        this._redoStack = [];
    },

    undo() {
        if (!this.canUndo()) return null;
        
        const item = this._undoStack.pop();
        this._redoStack.push(item);
        
        return item;
    },

    redo() {
        if (!this.canRedo()) return null;
        
        const item = this._redoStack.pop();
        this._undoStack.push(item);
        
        return item;
    },

    canUndo() {
        return this._undoStack.length > 0;
    },

    canRedo() {
        return this._redoStack.length > 0;
    },

    clear() {
        this._undoStack = [];
        this._redoStack = [];
    },

    getUndoCount() {
        return this._undoStack.length;
    },

    getRedoCount() {
        return this._redoStack.length;
    },

    _deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};

window.HistoryManager = HistoryManager;
