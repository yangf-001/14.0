const LoadingManager = {
    _progress: 0,
    _message: '',
    _indeterminate: true,
    _showed: false,

    show(message = '加载中...', indeterminate = true) {
        this._message = message;
        this._indeterminate = indeterminate;
        this._showed = true;
        
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) {
            console.warn('Modal element not found');
            return;
        }

        modalTitle.textContent = '请稍候';
        
        if (indeterminate) {
            modalBody.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <div class="loading">
                    <div class="progress-bar-container" style="width: 100%; max-width: 300px; margin: 0 auto 16px;">
                        <div class="progress-bar" id="loadingProgressBar" style="width: 0%;">${this._progress}%</div>
                    </div>
                    <p>${message}</p>
                </div>
            `;
        }
        
        modal.classList.add('active');
    },

    hide() {
        this._showed = false;
        this._progress = 0;
        
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    setProgress(value, message) {
        if (!this._showed) return;
        
        this._progress = Math.min(100, Math.max(0, value));
        this._indeterminate = false;
        
        if (message) {
            this._message = message;
        }
        
        const progressBar = document.getElementById('loadingProgressBar');
        if (progressBar) {
            progressBar.style.width = this._progress + '%';
            progressBar.textContent = this._progress + '%';
        }
        
        const messageEl = document.querySelector('#modalBody .loading p');
        if (messageEl && message) {
            messageEl.textContent = message;
        }
    },

    updateMessage(message) {
        if (!this._showed) return;
        
        this._message = message;
        const messageEl = document.querySelector('#modalBody .loading p');
        if (messageEl) {
            messageEl.textContent = message;
        }
    },

    isShowing() {
        return this._showed;
    },

    getProgress() {
        return this._progress;
    }
};

window.LoadingManager = LoadingManager;
