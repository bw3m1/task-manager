// Task data structure
let tasks = JSON.parse(localStorage.getItem('tasks')) || [
  {
    id: '1',
    name: 'Welcome Task',
    type: 'task',
    completed: false,
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: '# Welcome to Task Manager\n\nThis is your first task. You can edit it or create new ones.'
  },
  {
    id: '2',
    name: 'Sample Project',
    type: 'folder',
    expanded: true,
    children: [
      {
        id: '3',
        name: 'Research',
        type: 'task',
        completed: false,
        priority: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: 'Research potential solutions for the project.'
      },
      {
        id: '4',
        name: 'Design',
        type: 'task',
        completed: false,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: 'Design the user interface.'
      }
    ]
  }
];

let selectedTasks = [];
let currentEditor = null;
let currentTask = null;
let isPreviewMode = false;

// Initialize Monaco Editor
function initEditor() {
  require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs' } });

  require(['vs/editor/editor.main'], function () {
    currentEditor = monaco.editor.create(document.getElementById('taskEditor'), {
      value: '',
      language: 'markdown',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      lineNumbers: 'off',
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      fontSize: 14
    });

    currentEditor.onDidChangeModelContent(() => {
      if (currentTask) {
        currentTask.content = currentEditor.getValue();
        currentTask.updatedAt = new Date().toISOString();
        saveTasks();
        if (isPreviewMode) updateMarkdownPreview();
      }
    });
  });
}

// Toggle Markdown Preview
function toggleMarkdownPreview() {
  isPreviewMode = !isPreviewMode;
  const editorDiv = document.getElementById('taskEditor');
  const previewDiv = document.getElementById('markdownPreview');
  const btn = document.getElementById('togglePreviewBtn');
  if (isPreviewMode) {
    previewDiv.style.display = 'block';
    editorDiv.style.display = 'none';
    btn.textContent = 'Edit';
    updateMarkdownPreview();
  } else {
    previewDiv.style.display = 'none';
    editorDiv.style.display = 'block';
    btn.textContent = 'Preview';
    if (currentEditor) currentEditor.layout();
  }
}

// Update Markdown Preview
function updateMarkdownPreview() {
  const previewDiv = document.getElementById('markdownPreview');
  if (currentTask && currentTask.content) {
    previewDiv.innerHTML = marked.parse(currentTask.content);
  } else {
    previewDiv.innerHTML = '<em>No content</em>';
  }
}

// Render task list
function renderTaskList() {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';

  function renderItems(items, parentPath = '') {
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
      const itemPath = parentPath ? `${parentPath}/${item.id}` : item.id;
      const isFolder = item.type === 'folder';
      const div = document.createElement('div');
      div.className = `task-item${isFolder ? ' folder' : ''}${item.expanded ? ' expanded' : ''}`;
      div.dataset.id = item.id;
      div.dataset.path = itemPath;

      if (selectedTasks.includes(item.id)) {
        div.classList.add('selected');
      }

      div.innerHTML = `
                        <div class="toggle" style="${isFolder ? '' : 'visibility: hidden;'}">▶</div>
                        <img src="${getIcon(item)}" class="task-icon">
                        <span class="name">${item.name}</span>
                    `;

      // Folder toggle functionality
      if (isFolder) {
        const toggle = div.querySelector('.toggle');

        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          item.expanded = !item.expanded;
          renderTaskList();
        });

        div.addEventListener('click', (e) => {
          if (e.target !== toggle) {
            toggleTaskSelection(item.id, e);
          }
        });
      } else {
        div.addEventListener('click', (e) => {
          toggleTaskSelection(item.id, e);
        });
      }

      // Context menu
      div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, item);
      });

      fragment.appendChild(div);

      if (isFolder && item.children && item.expanded) {
        const children = document.createElement('div');
        children.className = 'children';
        children.appendChild(renderItems(item.children, itemPath));
        fragment.appendChild(children);
      }
    });

    return fragment;
  }

  taskList.appendChild(renderItems(tasks));
  updateStatusBar();
}

// Get appropriate icon for task
function getIcon(task) {
  if (task.type === 'folder') {
    return task.expanded ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2M1YzVjNSIgZD0iTTEwIDRINGMtMS4xIDAtMiAuOS0yIDJ2MTJjMCAxLjEuOSAyIDIgMmgxNmMxLjEgMCAyLS45IDItMlY4YzAtMS4xLS45LTItMi0yaC04bC0yLTJ6Ii8+PC9zdmc+' :
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2M1YzVjNSIgZD0iTTEwIDRINGMtMS4xIDAtMiAuOS0yIDJ2MTJjMCAxLjEuOSAyIDIgMmgxNmMxLjEgMCAyLS45IDItMlY4YzAtMS4xLS45LTItMi0yaC04bC0yLTJ6Ii8+PC9zdmc+';
  } else {
    if (task.completed) {
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzRjYWY1MCIgZD0iTTkgMTYuMTdMNC44MyAxMmwtMS40MiAxLjQxTDkgMTkgMjEgN2wtMS40MS0xLjQxeiIvPjwvc3ZnPg==';
    } else {
      switch (task.priority) {
        case 'high': return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2Y0NDMzNiIgZD0iTTE5IDEzaC02djZoLTJ2LTZINXYtMmg2VjVoMnY2aDZ2MnoiLz48L3N2Zz4=';
        case 'medium': return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmYjkwMCIgZD0iTTQgMTBoMTZ2Mkg0eiIvPjwvc3ZnPg==';
        case 'low': return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzYxZDQ2ZiIgZD0iTTcgMTVoMTB2LTJIN3oiLz48L3N2Zz4=';
        default: return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2M1YzVjNSIgZD0iTTE5IDV2MTRINVY1aDE0bTAtMkg1Yy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDE0YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6Ii8+PC9zdmc+';
      }
    }
  }
}

// Toggle task selection
function toggleTaskSelection(taskId, event) {
  if (event.ctrlKey || event.metaKey) {
    // Multi-select with Ctrl/Cmd
    const index = selectedTasks.indexOf(taskId);
    if (index === -1) {
      selectedTasks.push(taskId);
    } else {
      selectedTasks.splice(index, 1);
    }
  } else if (event.shiftKey && selectedTasks.length > 0) {
    // Range select with Shift
    const allTaskIds = flattenTasks(tasks);
    const lastSelectedIndex = allTaskIds.indexOf(selectedTasks[selectedTasks.length - 1]);
    const currentIndex = allTaskIds.indexOf(taskId);

    const start = Math.min(lastSelectedIndex, currentIndex);
    const end = Math.max(lastSelectedIndex, currentIndex);

    selectedTasks = [];
    for (let i = start; i <= end; i++) {
      selectedTasks.push(allTaskIds[i]);
    }
  } else {
    // Single select
    selectedTasks = [taskId];
  }

  renderTaskList();
  updateTaskDetails();
}

// Flatten tasks for shift+click selection
function flattenTasks(items, result = []) {
  items.forEach(item => {
    result.push(item.id);
    if (item.type === 'folder' && item.children) {
      flattenTasks(item.children, result);
    }
  });
  return result;
}

// Update task details in the editor
function updateTaskDetails() {
  if (selectedTasks.length === 1) {
    const task = findTaskById(selectedTasks[0], tasks);
    if (task) {
      currentTask = task;
      document.getElementById('taskTitle').textContent = task.name;
      if (currentEditor && !isPreviewMode) {
        currentEditor.setValue(task.content || '');
      }
      if (isPreviewMode) updateMarkdownPreview();
    }
  } else {
    currentTask = null;
    document.getElementById('taskTitle').textContent = `${selectedTasks.length} tasks selected`;
    if (currentEditor && !isPreviewMode) {
      currentEditor.setValue('');
    }
    if (isPreviewMode) {
      document.getElementById('markdownPreview').innerHTML = '';
    }
  }
}

// Find task by ID
function findTaskById(id, items) {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.type === 'folder' && item.children) {
      const found = findTaskById(id, item.children);
      if (found) return found;
    }
  }
  return null;
}

// Show context menu
function showContextMenu(event, task) {
  const contextMenu = document.getElementById('contextMenu');
  contextMenu.style.display = 'block';
  contextMenu.style.left = `${event.clientX}px`;
  contextMenu.style.top = `${event.clientY}px`;

  let menuHTML = '';

  if (task.type === 'task') {
    menuHTML = `
                    <div class="context-menu-item" data-action="open">Open</div>
                    <div class="context-menu-divider"></div>
                    <div class="context-menu-item" data-action="rename">Rename</div>
                    <div class="context-menu-item" data-action="delete">Delete</div>
                    <div class="context-menu-divider"></div>
                    <div class="context-menu-item" data-action="complete">Mark as ${task.completed ? 'Incomplete' : 'Complete'}</div>
                    <div class="context-menu-divider"></div>
                    <div class="context-menu-item" data-action="priority-high">Set Priority: High</div>
                    <div class="context-menu-item" data-action="priority-medium">Set Priority: Medium</div>
                    <div class="context-menu-item" data-action="priority-low">Set Priority: Low</div>
                `;
  } else if (task.type === 'folder') {
    menuHTML = `
                    <div class="context-menu-item" data-action="open">Open</div>
                    <div class="context-menu-divider"></div>
                    <div class="context-menu-item" data-action="new-task">New Task</div>
                    <div class="context-menu-item" data-action="new-folder">New Folder</div>
                    <div class="context-menu-divider"></div>
                    <div class="context-menu-item" data-action="rename">Rename</div>
                    <div class="context-menu-item" data-action="delete">Delete</div>
                `;
  }

  contextMenu.innerHTML = menuHTML;

  // Add event listeners to menu items
  contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      handleContextMenuAction(item.dataset.action, task);
      contextMenu.style.display = 'none';
    });
  });

  // Close menu when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      contextMenu.style.display = 'none';
    }
  });
}

// Handle context menu actions
function handleContextMenuAction(action, task) {
  switch (action) {
    case 'open':
      selectedTasks = [task.id];
      renderTaskList();
      updateTaskDetails();
      break;
    case 'rename':
      renameTask(task);
      break;
    case 'delete':
      deleteTask(task);
      break;
    case 'complete':
      toggleTaskCompletion(task);
      break;
    case 'priority-high':
      setTaskPriority(task, 'high');
      break;
    case 'priority-medium':
      setTaskPriority(task, 'medium');
      break;
    case 'priority-low':
      setTaskPriority(task, 'low');
      break;
    case 'new-task':
      addNewTask(task);
      break;
    case 'new-folder':
      addNewFolder(task);
      break;
  }
}

// Rename a task
function renameTask(task) {
  const element = document.querySelector(`[data-id="${task.id}"]`);
  const nameSpan = element.querySelector('.name');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'rename-input';
  input.value = task.name;
  nameSpan.replaceWith(input);
  input.select();

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const newName = input.value.trim();
      if (newName) {
        task.name = newName;
        saveTasks();
      }
      renderTaskList();
    } else if (e.key === 'Escape') {
      renderTaskList();
    }
  });

  input.addEventListener('blur', () => {
    renderTaskList();
  });
}

// Delete a task
function deleteTask(task) {
  if (confirm(`Are you sure you want to delete "${task.name}"?`)) {
    deleteTaskFromStructure(task, tasks);
    saveTasks();
    renderTaskList();
    if (selectedTasks.includes(task.id)) {
      selectedTasks = [];
      updateTaskDetails();
    }
  }
}

// Delete task from structure
function deleteTaskFromStructure(task, items) {
  const index = items.indexOf(task);
  if (index !== -1) {
    items.splice(index, 1);
  } else {
    for (const item of items) {
      if (item.type === 'folder' && item.children) {
        deleteTaskFromStructure(task, item.children);
      }
    }
  }
}

// Toggle task completion
function toggleTaskCompletion(task) {
  task.completed = !task.completed;
  task.updatedAt = new Date().toISOString();
  saveTasks();
  renderTaskList();
}

// Set task priority
function setTaskPriority(task, priority) {
  task.priority = priority;
  task.updatedAt = new Date().toISOString();
  saveTasks();
  renderTaskList();
}

// Add new task
function addNewTask(parentFolder = null) {
  const newTask = {
    id: 'task_' + Date.now(),
    name: 'New Task',
    type: 'task',
    completed: false,
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: '# New Task\n\nEnter your task details here in markdown format.'
  };

  if (parentFolder && parentFolder.type === 'folder') {
    if (!parentFolder.children) parentFolder.children = [];
    parentFolder.children.push(newTask);
    parentFolder.expanded = true;
  } else {
    tasks.push(newTask);
  }

  saveTasks();
  renderTaskList();
  selectedTasks = [newTask.id];
  updateTaskDetails();
}

// Add new folder
function addNewFolder(parentFolder = null) {
  const newFolder = {
    id: 'folder_' + Date.now(),
    name: 'New Folder',
    type: 'folder',
    expanded: true,
    children: []
  };

  if (parentFolder && parentFolder.type === 'folder') {
    if (!parentFolder.children) parentFolder.children = [];
    parentFolder.children.push(newFolder);
    parentFolder.expanded = true;
  } else {
    tasks.push(newFolder);
  }

  saveTasks();
  renderTaskList();
  selectedTasks = [newFolder.id];
  updateTaskDetails();
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  updateStatusBar();
}

// Update status bar
function updateStatusBar() {
  const totalTasks = countTasks(tasks);
  document.getElementById('lineInfo').textContent = `${totalTasks} tasks`;
}

// Count all tasks (excluding folders)
function countTasks(items) {
  let count = 0;
  items.forEach(item => {
    if (item.type === 'task') {
      count++;
    } else if (item.type === 'folder' && item.children) {
      count += countTasks(item.children);
    }
  });
  return count;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initEditor();
  renderTaskList();

  // Add new task on Enter in input
  document.getElementById('taskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const taskName = e.target.value.trim();
      if (taskName) {
        addNewTask();
        const newTask = tasks.find(t => t.name === 'New Task');
        if (newTask) {
          newTask.name = taskName;
          saveTasks();
          renderTaskList();
        }
      }
      e.target.value = '';
    }
  });

  // Toggle Markdown preview
  document.getElementById('togglePreviewBtn').addEventListener('click', toggleMarkdownPreview);

  // Close context menu on Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('contextMenu').style.display = 'none';
    }
  });

  // Handle menu actions
  document.querySelectorAll('.menu-item [data-action]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = e.target.dataset.action;
      handleMenuAction(action);
    });
  });
});

// Handle menu bar actions
function handleMenuAction(action) {
  switch (action) {
    case 'new-task':
      addNewTask();
      break;
    case 'new-folder':
      addNewFolder();
      break;
    case 'save':
      saveTasks();
      document.getElementById('statusMessage').textContent = 'Tasks saved';
      setTimeout(() => {
        document.getElementById('statusMessage').textContent = 'Ready';
      }, 2000);
      break;
    case 'export':
      exportTasks();
      break;
    case 'settings':
      alert('Settings dialog would open here');
      break;
    case 'undo':
    case 'redo':
    case 'cut':
    case 'copy':
    case 'paste':
      // These would be implemented with a proper state management system
      document.getElementById('statusMessage').textContent = `${action} not implemented yet`;
      setTimeout(() => {
        document.getElementById('statusMessage').textContent = 'Ready';
      }, 2000);
      break;
    case 'delete':
      if (selectedTasks.length > 0) {
        const task = findTaskById(selectedTasks[0], tasks);
        if (task) deleteTask(task);
      }
      break;
    case 'select-all':
      selectedTasks = flattenTasks(tasks);
      renderTaskList();
      updateTaskDetails();
      break;
    case 'toggle-sidebar':
      document.querySelector('.task-list-container').classList.toggle('hidden');
      break;
    case 'toggle-markdown':
      // Toggle between markdown editor and preview
      break;
    case 'zoom-in':
    case 'zoom-out':
    case 'reset-zoom':
      // Implement zoom functionality
      break;
    case 'mark-complete':
      selectedTasks.forEach(taskId => {
        const task = findTaskById(taskId, tasks);
        if (task) task.completed = true;
      });
      saveTasks();
      renderTaskList();
      break;
    case 'mark-incomplete':
      selectedTasks.forEach(taskId => {
        const task = findTaskById(taskId, tasks);
        if (task) task.completed = false;
      });
      saveTasks();
      renderTaskList();
      break;
    case 'set-priority-high':
      selectedTasks.forEach(taskId => {
        const task = findTaskById(taskId, tasks);
        if (task) task.priority = 'high';
      });
      saveTasks();
      renderTaskList();
      break;
    case 'set-priority-medium':
      selectedTasks.forEach(taskId => {
        const task = findTaskById(taskId, tasks);
        if (task) task.priority = 'medium';
      });
      saveTasks();
      renderTaskList();
      break;
    case 'set-priority-low':
      selectedTasks.forEach(taskId => {
        const task = findTaskById(taskId, tasks);
        if (task) task.priority = 'low';
      });
      saveTasks();
      renderTaskList();
      break;
    case 'sort-by-name':
      sortTasks('name');
      break;
    case 'sort-by-date':
      sortTasks('createdAt');
      break;
    case 'sort-by-priority':
      sortTasks('priority');
      break;
    case 'documentation':
      window.open('./documentation/doccumentation_index.html', '_blank');
      break;
    case 'about':
      alert('Task Manager v1.0\n\nA simple task management web application.');
      break;
  }
}

// Sort tasks
function sortTasks(by) {
  function sortItems(items) {
    return items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;

      if (by === 'priority') {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else {
        if (a[by] < b[by]) return -1;
        if (a[by] > b[by]) return 1;
        return 0;
      }
    }).map(item => {
      if (item.type === 'folder' && item.children) {
        item.children = sortItems(item.children);
      }
      return item;
    });
  }

  tasks = sortItems(tasks);
  saveTasks();
  renderTaskList();
}

// Export tasks
function exportTasks() {
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tasks-export.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Theme switching (similar to your file explorer)
function applyTheme(theme) {
  document.body.classList.remove('light-theme', 'contrast-dark-theme', 'contrast-light-theme');

  switch (theme) {
    case 'light':
      document.body.classList.add('light-theme');
      break;
    case 'contrast-dark':
      document.body.classList.add('contrast-dark-theme');
      break;
    case 'contrast-light':
      document.body.classList.add('contrast-light-theme');
      break;
    case 'automatic':
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (!prefersDark) {
        document.body.classList.add('light-theme');
      }
      break;
  }

  if (currentEditor) {
    const editorTheme = theme === 'light' || theme === 'contrast-light' ? 'vs' : 'vs-dark';
    monaco.editor.setTheme(editorTheme);
  }
}