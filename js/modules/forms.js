const Forms = {
    generateCharacterForm(isEdit = false, character = null) {
        const defaults = {
            name: '',
            gender: '女',
            role: '配角',
            age: App.CONSTANTS.MIN_AGE,
            appearance: '',
            personality: ''
        };
        const data = isEdit ? { ...defaults, ...character } : defaults;
        
        const genderOptions = App.CONSTANTS.GENDER_OPTIONS.map(g => 
            `<option value="${g}" ${data.gender === g ? 'selected' : ''}>${g}</option>`
        ).join('');
        
        const roleOptions = App.CONSTANTS.ROLE_OPTIONS.map(r => 
            `<option value="${r}" ${data.role === r ? 'selected' : ''}>${r}</option>`
        ).join('');
        
        return `
            <div class="form-group">
                <label>角色名</label>
                <input type="text" id="charName" value="${data.name}" placeholder="例如：小美">
            </div>
            <div class="form-group">
                <label>性别</label>
                <select id="charGender">${genderOptions}</select>
            </div>
            <div class="form-group">
                <label>角色定位</label>
                <select id="charRole">${roleOptions}</select>
            </div>
            <div class="form-group">
                <label>年龄</label>
                <input type="number" id="charAge" value="${data.age}" min="1">
            </div>
            ${!isEdit ? `
            <div class="form-group">
                <label>外貌描述（可选）</label>
                <textarea id="charAppearance" rows="2" placeholder="例如：身材高挑，长发披肩...">${data.appearance}</textarea>
            </div>
            <div class="form-group">
                <label>性格（可选）</label>
                <input type="text" id="charPersonality" placeholder="例如：温柔活泼" value="${data.personality}">
            </div>
            ` : ''}
        `;
    },
    
    getCharacterFormData() {
        return {
            name: document.getElementById('charName').value,
            gender: document.getElementById('charGender').value,
            role: document.getElementById('charRole').value,
            age: parseInt(document.getElementById('charAge').value) || App.CONSTANTS.MIN_AGE
        };
    },
    
    generateWorldForm(isEdit = false, worldData = null) {
        const defaults = { name: '', type: '现代' };
        const data = isEdit ? { ...defaults, ...worldData } : defaults;
        
        const typeOptions = App.CONSTANTS.WORLD_TYPES.map(t => 
            `<option value="${t}" ${data.type === t ? 'selected' : ''}>${t}</option>`
        ).join('');
        
        return `
            <div class="form-group">
                <label>世界名称</label>
                <input type="text" id="worldName" value="${data.name}" placeholder="例如：我的异世界">
            </div>
            <div class="form-group">
                <label>类型</label>
                <select id="worldType">${typeOptions}</select>
            </div>
        `;
    },
    
    getWorldFormData() {
        return {
            name: document.getElementById('worldName').value,
            type: document.getElementById('worldType').value
        };
    }
};