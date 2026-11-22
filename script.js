const titleInput = document.getElementById('noteTitle');
const descInput = document.getElementById('noteDesc');
const importantCheckbox = document.getElementById('isImportant');
const pinnedCheckbox = document.getElementById('isPinned');
const addBtn = document.getElementById('addNoteBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const searchInput = document.getElementById('searchInput');
const notesContainer = document.getElementById('notesContainer');
const notesCount = document.getElementById('notesCount');
const charCounter = document.getElementById('charCounter');
const colorDots = document.querySelectorAll('.color-dot');
const filterPills = document.querySelectorAll('.pill');
const themeToggle = document.getElementById('themeToggle');
const toastContainer = document.getElementById('toastContainer');

let notes = JSON.parse(localStorage.getItem('vibeNotesPro')) || [];
let editId = null;
let selectedColor = 'default';
let currentFilter = 'all';

// 1. إدارة الوضع الداكن الافتراضي والنهاري
const savedTheme = localStorage.getItem('vibeThemePro') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('vibeThemePro', next);
    updateThemeIcon(next);
});

function updateThemeIcon(theme) {
    themeToggle.innerHTML = theme === 'dark' 
        ? '<i class="fa-solid fa-sun"></i>' 
        : '<i class="fa-solid fa-moon"></i>';
}

// 2. عداد الحروف الحي
function updateCharCount() {
    const len = titleInput.value.length + descInput.value.length;
    charCounter.textContent = `${len} chars`;
}
titleInput.addEventListener('input', updateCharCount);
descInput.addEventListener('input', updateCharCount);

// 3. اختصارات لوحة المفاتيح (Ctrl+Enter للحفظ، و "/" للبحث)
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement === titleInput || document.activeElement === descInput) {
            addBtn.click();
        }
    }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInput.focus();
    }
});

// 4. نظام الإشعارات الذكية (Toast)
function showToast(message, icon = 'fa-circle-check', color = '#10b981') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${color}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
    }, 2400);
}

// اختيار الألوان
colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        selectedColor = dot.dataset.color;
    });
});

// الفلترة
filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.filter;
        displayNotes();
    });
});

function saveNotes() {
    localStorage.setItem('vibeNotesPro', JSON.stringify(notes));
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function displayNotes() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    notesContainer.innerHTML = '';

    // ترتيب الملاحظات المثبتة في الأعلى دائماً
    const sortedNotes = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    const filteredNotes = sortedNotes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchTerm) || 
                              note.desc.toLowerCase().includes(searchTerm);
        if (currentFilter === 'important') return matchesSearch && note.important;
        if (currentFilter === 'pinned') return matchesSearch && note.pinned;
        return matchesSearch;
    });

    notesCount.textContent = `${notes.length} ${notes.length === 1 ? 'Note' : 'Notes'}`;

    if (filteredNotes.length === 0) {
        notesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                <h3>Clean slate</h3>
                <p>Press above to capture your next big idea.</p>
            </div>
        `;
        return;
    }

    filteredNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.setAttribute('data-color', note.color || 'default');

        card.innerHTML = `
            <div>
                <div class="note-top">
                    <h3>${escapeHTML(note.title)}</h3>
                    <div class="note-badges">
                        <button class="badge-icon ${note.pinned ? 'pin-active' : ''}" onclick="togglePin(${note.id})" title="Pin to top">
                            <i class="fa-solid fa-thumbtack"></i>
                        </button>
                        <button class="badge-icon ${note.important ? 'star-active' : ''}" onclick="toggleImportant(${note.id})" title="Mark Important">
                            <i class="fa-solid fa-star"></i>
                        </button>
                    </div>
                </div>
                <p>${escapeHTML(note.desc)}</p>
            </div>
            <div class="note-bottom">
                <span class="note-date">${note.date || 'Just now'}</span>
                <div class="card-actions">
                    <button class="card-btn copy" onclick="copyNote(${note.id}, this)" title="Copy Note">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                    <button class="card-btn edit" onclick="startEdit(${note.id})" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="card-btn delete" onclick="deleteNote(${note.id})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        notesContainer.appendChild(card);
    });
}

addBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    const important = importantCheckbox.checked;
    const pinned = pinnedCheckbox.checked;

    if (!title && !desc) {
        titleInput.focus();
        showToast('Write a title or note first!', 'fa-circle-exclamation', '#f59e0b');
        return;
    }

    if (editId !== null) {
        const index = notes.findIndex(n => n.id === editId);
        if (index !== -1) {
            notes[index] = {
                ...notes[index],
                title: title || 'Untitled Note',
                desc,
                important,
                pinned,
                color: selectedColor,
                date: 'Edited ' + formatDate(Date.now())
            };
        }
        showToast('Note updated successfully');
    } else {
        notes.unshift({
            id: Date.now(),
            title: title || 'Untitled Note',
            desc,
            important,
            pinned,
            color: selectedColor,
            date: formatDate(Date.now())
        });
        showToast('Note added to workspace');
    }

    resetForm();
    saveNotes();
    displayNotes();
});

function startEdit(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    titleInput.value = note.title;
    descInput.value = note.desc;
    importantCheckbox.checked = note.important;
    pinnedCheckbox.checked = note.pinned || false;
    selectedColor = note.color || 'default';

    colorDots.forEach(d => d.classList.toggle('active', d.dataset.color === selectedColor));
    updateCharCount();

    editId = id;
    addBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Save Changes</span>';
    addBtn.classList.add('edit-mode');
    cancelEditBtn.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    titleInput.focus();
}

function resetForm() {
    titleInput.value = '';
    descInput.value = '';
    importantCheckbox.checked = false;
    pinnedCheckbox.checked = false;
    selectedColor = 'default';
    colorDots.forEach(d => d.classList.toggle('active', d.dataset.color === 'default'));
    updateCharCount();
    
    editId = null;
    addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> <span>Add Note</span>';
    addBtn.classList.remove('edit-mode');
    cancelEditBtn.classList.add('hidden');
}

cancelEditBtn.addEventListener('click', resetForm);

function deleteNote(id) {
    if (editId === id) resetForm();
    notes = notes.filter(n => n.id !== id);
    saveNotes();
    displayNotes();
    showToast('Note deleted', 'fa-trash', '#f43f5e');
}

function toggleImportant(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        note.important = !note.important;
        saveNotes();
        displayNotes();
    }
}

function togglePin(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        note.pinned = !note.pinned;
        saveNotes();
        displayNotes();
        showToast(note.pinned ? 'Pinned to top' : 'Unpinned', 'fa-thumbtack', '#818cf8');
    }
}

function copyNote(id, btnElement) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const textToCopy = `${note.title}\n${note.desc}`.trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
        btnElement.classList.add('copied');
        btnElement.innerHTML = '<i class="fa-solid fa-check"></i>';
        showToast('Copied to clipboard!');
        setTimeout(() => {
            btnElement.classList.remove('copied');
            btnElement.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 1500);
    });
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

searchInput.addEventListener('input', displayNotes);

// التشغيل الأولي
displayNotes();