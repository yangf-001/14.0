const Modal = {
    _onCloseCallback: null,
    
    show(title, content, options = {}) {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modal = document.getElementById('modal');
        
        if (!modalTitle || !modalBody || !modal) {
            console.error('Modal elements not found');
            return;
        }
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.classList.add('active');
        
        if (options.onClose) {
            this._onCloseCallback = options.onClose;
        }
    },
    
    close() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        if (this._onCloseCallback) {
            this._onCloseCallback();
            this._onCloseCallback = null;
        }
    }
};

// 暴露到全局
window.closeModal = function() {
    Modal.close();
};