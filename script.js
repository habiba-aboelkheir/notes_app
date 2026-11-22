const titleInput = document.getElementById('noteTitle');
const descInput = document.getElementById('noteDesc');
const importantCheckbox = document.getElementById('isImportant');
const addBtn = document.getElementById('addNoteBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const searchInput = document.getElementById('searchInput');
const filterImportantCheckbox = document.getElementById('filterImportant');
const notesContainer = document.getElementById('notesContainer');

let notes = JSON.parse(localStorage.getItem('myNotes')) || [];
let editId = null; // لتتبع الملاحظة الجاري تعديلها

function saveNotes() {
    localStorage.setItem('myNotes', JSON.stringify(notes));
}

function displayNotes() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const onlyImportant = filterImportantCheckbox.checked;

    notesContainer.innerHTML = '';

    // تصفية الملاحظات حسب البحث والفلتر
    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchTerm) || 
                              note.desc.toLowerCase().includes(searchTerm);
        const matchesFilter = onlyImportant ? note.important : true;
        return matchesSearch && matchesFilter;
    });

    if (filteredNotes.length === 0) {
        notesContainer.innerHTML = '<p class="empty-msg">No notes found.</p>';
        return;
    }

    filteredNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.classList.add('note-card');

        noteCard.innerHTML = `
            <div>
                <div class="note-header">
                    <span class="star ${note.important ? 'important' : ''}" 
                          title="Toggle Important" 
                          onclick="toggleImportant(${note.id})">★</span>
                    <div class="card-actions">
                        <button class="icon-btn edit-btn" title="Edit" onclick="startEdit(${note.id})">✏️</button>
                        <button class="icon-btn delete-btn" title="Delete" onclick="deleteNote(${note.id})">🗑️</button>
                    </div>
                </div>
                <h3>${escapeHTML(note.title)}</h3>
                <p>${escapeHTML(note.desc)}</p>
            </div>
        `;
        notesContainer.appendChild(noteCard);
    });
}

// إضافة ملاحظة جديدة أو حفظ التعديل
addBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    const important = importantCheckbox.checked;

    if (title === '' || desc === '') {
        alert('Please enter both title and description.');
        return;
    }

    if (editId !== null) {
        // تحديث ملاحظة موجودة
        const index = notes.findIndex(n => n.id === editId);
        if (index !== -1) {
            notes[index] = { id: editId, title, desc, important };
        }
        resetForm();
    } else {
        // إضافة ملاحظة جديدة بمعرف فريد
        notes.unshift({
            id: Date.now(),
            title,
            desc,
            important
        });
        resetForm();
    }

    saveNotes();
    displayNotes();
});

// بدء وضع التعديل
function startEdit(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    titleInput.value = note.title;
    descInput.value = note.desc;
    importantCheckbox.checked = note.important;

    editId = id;
    addBtn.textContent = 'Update Note';
    addBtn.classList.add('edit-mode');
    cancelEditBtn.classList.remove('hidden');
    titleInput.focus();
}

// إلغاء التعديل وإعادة الحقول لوضعها الطبيعي
function resetForm() {
    titleInput.value = '';
    descInput.value = '';
    importantCheckbox.checked = false;
    editId = null;
    addBtn.textContent = 'Add Note';
    addBtn.classList.remove('edit-mode');
    cancelEditBtn.classList.add('hidden');
}

cancelEditBtn.addEventListener('click', resetForm);

// حذف ملاحظة
function deleteNote(id) {
    if (editId === id) resetForm();
    notes = notes.filter(note => note.id !== id);
    saveNotes();
    displayNotes();
}

// تغيير حالة الأهمية بالضغط على النجمة
function toggleImportant(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        note.important = !note.important;
        saveNotes();
        displayNotes();
    }
}

// حماية النصوص المدخلة من أكواد HTML الضارة
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// تفعيل البحث والفلترة الفورية
searchInput.addEventListener('input', displayNotes);
filterImportantCheckbox.addEventListener('change', displayNotes);

// التشغيل الأولي
displayNotes();س