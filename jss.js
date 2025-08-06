// Ensure you’ve included SortableJS & FullCalendar in your index.html before this script

document.addEventListener('DOMContentLoaded', () => {
  let todos    = JSON.parse(localStorage.getItem('todos')) || [];
  let calendar = null;

  // DOM refs
  const form            = document.getElementById('todo-form');
  const input           = document.getElementById('todo-input');
  const dueDateInput    = document.getElementById('due-date');
  const priorityInput   = document.getElementById('priority');
  const tagsInput       = document.getElementById('tags');
  const list            = document.getElementById('todo-list');
  const filter          = document.getElementById('filter');
  const sort            = document.getElementById('sort');
  const search          = document.getElementById('search');
  const bulkCompleteBtn = document.getElementById('bulk-complete');
  const bulkDeleteBtn   = document.getElementById('bulk-delete');
  const exportBtn       = document.getElementById('export');
  const importInput     = document.getElementById('import');
  const checkbox        = document.getElementById('dark-mode-toggle');
  const analytics       = {
    total:     document.getElementById('total-count'),
    completed: document.getElementById('completed-count'),
    overdue:   document.getElementById('overdue-count'),
  };

  // Initialize
  initNav();
  initCalendar();
  applyStoredTheme();
  populate();

  // Event listeners
  form.addEventListener('submit', addTask);
  filter.addEventListener('change', populate);
  sort.addEventListener('change', populate);
  search.addEventListener('input', populate);
  bulkCompleteBtn.addEventListener('click', bulkComplete);
  bulkDeleteBtn.addEventListener('click', bulkDelete);

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(todos, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'todos.json';
    a.click();
  });

  importInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      todos = JSON.parse(reader.result);
      saveAndPopulate();
    };
    reader.readAsText(file);
  });

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  });

  // ===== NAVIGATION =====
  function initNav() {
    const links    = document.querySelectorAll('.site-header nav a');
    const sections = Array.from(links).map(l => document.querySelector(l.getAttribute('href')));

    links.forEach((link, i) => {
      link.addEventListener('click', e => {
        e.preventDefault();
        sections[i].scrollIntoView({ behavior: 'smooth' });
      });
    });

    window.addEventListener('scroll', () => {
      const pos = window.scrollY + 80;
      sections.forEach((sec, i) => {
        if (sec.offsetTop <= pos && sec.offsetTop + sec.offsetHeight > pos) {
          links.forEach(l => l.classList.remove('active'));
          links[i].classList.add('active');
        }
      });
    });
  }

  // ===== THEME =====
  function applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      checkbox.checked = true;
    } else {
      document.documentElement.removeAttribute('data-theme');
      checkbox.checked = false;
    }
  }

  // ===== TODO FUNCTIONS =====
  function addTask(e) {
    e.preventDefault();
    todos.push({
      id: Date.now(),
      text: input.value.trim(),
      completed: false,
      created: Date.now(),
      dueDate: dueDateInput.value || null,
      priority: priorityInput.value,
      tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
    });
    saveAndPopulate();
    form.reset();
  }

  function populate() {
    let data = [...todos];
    if (filter.value !== 'all') {
      data = data.filter(t => filter.value === 'active' ? !t.completed : t.completed);
    }
    if (search.value.trim()) {
      data = data.filter(t => t.text.toLowerCase().includes(search.value.toLowerCase()));
    }
    switch (sort.value) {
      case 'createdAsc': data.sort((a,b)=>a.created-b.created); break;
      case 'dueAsc':     data.sort((a,b)=>new Date(a.dueDate||0)-new Date(b.dueDate||0)); break;
      case 'priority':   data.sort((a,b)=>['low','medium','high'].indexOf(b.priority)-['low','medium','high'].indexOf(a.priority)); break;
      default:           data.sort((a,b)=>b.created-a.created);
    }
    renderList(data);
    updateAnalytics();
    updateCalendar();
  }

  function renderList(items) {
    list.innerHTML = '';
    items.forEach(t => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (t.completed ? ' completed' : '');
      li.dataset.id = t.id;

      const cb   = document.createElement('input');
      cb.type    = 'checkbox';
      cb.checked = t.completed;
      cb.addEventListener('change', () => editField(t.id, 'completed', !t.completed));

      const span = document.createElement('span');
      span.className     = 'text';
      span.textContent   = t.text;
      span.contentEditable = true;
      span.addEventListener('blur', () => editField(t.id, 'text', span.textContent));

      const date = document.createElement('input');
      date.type    = 'date';
      date.value   = t.dueDate || '';
      date.addEventListener('change', () => editField(t.id, 'dueDate', date.value));

      const pr = document.createElement('select');
      ['low','medium','high'].forEach(p => {
        const o = document.createElement('option');
        o.value       = p;
        o.textContent = p;
        if (p === t.priority) o.selected = true;
        pr.appendChild(o);
      });
      pr.addEventListener('change', () => editField(t.id, 'priority', pr.value));

      const tg = document.createElement('span');
      tg.className   = 'tags';
      tg.textContent = t.tags.join(', ');

      const del = document.createElement('button');
      del.textContent = '✖';
      del.addEventListener('click', () => deleteTask(t.id));

      li.append(cb, span, date, pr, tg, del);
      list.appendChild(li);
    });
    new Sortable(list, { onEnd: saveOrder });
  }

  function editField(id, field, val) {
    const task = todos.find(t => t.id === id);
    task[field] = val;
    saveAndPopulate();
  }

  function deleteTask(id) {
    todos = todos.filter(t => t.id !== id);
    saveAndPopulate();
  }

  function bulkComplete() {
    document.querySelectorAll('#todo-list input[type=checkbox]:checked')
      .forEach(cb => editField(+cb.closest('li').dataset.id, 'completed', true));
  }

  function bulkDelete() {
    document.querySelectorAll('#todo-list input[type=checkbox]:checked')
      .forEach(cb => deleteTask(+cb.closest('li').dataset.id));
  }

  function saveOrder() {
    const ids = Array.from(list.children).map(li => +li.dataset.id);
    todos.sort((a,b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    saveAndPopulate();
  }

  function saveAndPopulate() {
    localStorage.setItem('todos', JSON.stringify(todos));
    populate();
  }

  function updateAnalytics() {
    const now = Date.now();
    analytics.total.textContent     = todos.length;
    analytics.completed.textContent = todos.filter(t => t.completed).length;
    analytics.overdue.textContent   = todos.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < now).length;
  }

  // ===== CALENDAR =====
  function initCalendar() {
    const calEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calEl, {
      initialView: 'dayGridMonth',
      contentHeight: 350,
      dayCellMinHeight: 50,
      events: []
    });
    calendar.render();
  }

  function updateCalendar() {
    calendar.removeAllEvents();
    todos.filter(t => t.dueDate).forEach(t =>
      calendar.addEvent({ title: t.text, date: t.dueDate })
    );
  }
});
