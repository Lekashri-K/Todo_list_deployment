document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    var inputTask = document.getElementById('input_task');
    var addBtn = document.getElementById('add');
    var tasksContainer = document.getElementById('tasks');
    var emptyState = document.getElementById('empty-state');
    var priorityOptions = document.querySelectorAll('.priority-option');
    var totalTasksEl = document.getElementById('total-tasks');
    var completedTasksEl = document.getElementById('completed-tasks');
    var pendingTasksEl = document.getElementById('pending-tasks');
    var themeToggle = document.getElementById('themeToggle');
    var themeStatus = document.getElementById('themeStatus');
    var body = document.body;

    // Motivation elements
    var motiveText = document.getElementById('motiveText');
    var motiveAuthor = document.getElementById('motiveAuthor');
    var refreshMotiveBtn = document.getElementById('refreshMotive');
    var achievementBadge = document.getElementById('achievementBadge');

    // State
    var currentPriority = 'high';
    var tasks = JSON.parse(localStorage.getItem('flowTasks')) || [];
    var taskIdCounter = 1;
    
    // Calculate initial taskIdCounter
    if (tasks.length > 0) {
        var maxId = 0;
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id > maxId) {
                maxId = tasks[i].id;
            }
        }
        taskIdCounter = maxId + 1;
    }

    // Check for saved theme preference
    var savedTheme = localStorage.getItem('flowTaskTheme') || 'day';
    if (savedTheme === 'night') {
        themeToggle.checked = true;
        body.classList.add('night-mode');
        themeStatus.textContent = 'Night Mode';
    }

    // API Configuration
    var QUOTE_APIS = [
        'https://api.quotable.io/random',
        'https://zenquotes.io/api/random',
        'https://stoic-quotes.com/api/quote'
    ];

    // Initialize
    updateStats();
    renderTasks();
    loadMotivationalQuote();

    // Add sample tasks if empty
    if (tasks.length === 0) {
        addSampleTasks();
    }

    // Event Listeners
    addBtn.addEventListener('click', addNewTask);
    inputTask.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') addNewTask();
    });

    // Theme toggle
    themeToggle.addEventListener('change', function () {
        if (this.checked) {
            body.classList.add('night-mode');
            localStorage.setItem('flowTaskTheme', 'night');
            themeStatus.textContent = 'Night Mode';
            showNotification('Night mode activated 🌙', 'success');
        } else {
            body.classList.remove('night-mode');
            localStorage.setItem('flowTaskTheme', 'day');
            themeStatus.textContent = 'Day Mode';
            showNotification('Day mode activated ☀️', 'success');
        }
    });

    // Refresh motivation quote
    refreshMotiveBtn.addEventListener('click', loadMotivationalQuote);

    // Priority selector
    for (var i = 0; i < priorityOptions.length; i++) {
        priorityOptions[i].addEventListener('click', function () {
            for (var j = 0; j < priorityOptions.length; j++) {
                priorityOptions[j].classList.remove('active');
            }
            this.classList.add('active');
            currentPriority = this.dataset.priority;

            // Add animation feedback
            this.style.animation = 'pulse 0.5s ease';
            setTimeout(function () {
                this.style.animation = '';
            }.bind(this), 500);
        });
    }

    // Functions
    function loadMotivationalQuote() {
        // Show loading state
        motiveText.innerHTML = '<div class="loading-quote"><div class="spinner"></div><span>Loading inspiration...</span></div>';
        motiveAuthor.textContent = '';

        // Try to load from API
        loadQuoteFromAPI(0);
    }

    function loadQuoteFromAPI(apiIndex) {
        if (apiIndex >= QUOTE_APIS.length) {
            // All APIs failed, use fallback
            useFallbackQuote();
            return;
        }

        var apiUrl = QUOTE_APIS[apiIndex];
        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl, true);
        xhr.onload = function () {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    var quoteData = null;

                    if (apiUrl.includes('zenquotes.io')) {
                        quoteData = {
                            text: data[0].q,
                            author: data[0].a
                        };
                    } else if (apiUrl.includes('quotable.io')) {
                        quoteData = {
                            text: data.content,
                            author: data.author
                        };
                    } else if (apiUrl.includes('stoic-quotes.com')) {
                        quoteData = {
                            text: data.text,
                            author: data.author
                        };
                    }

                    if (quoteData) {
                        displayQuote(quoteData);
                    } else {
                        loadQuoteFromAPI(apiIndex + 1);
                    }
                } catch (error) {
                    loadQuoteFromAPI(apiIndex + 1);
                }
            } else {
                loadQuoteFromAPI(apiIndex + 1);
            }
        };
        xhr.onerror = function () {
            loadQuoteFromAPI(apiIndex + 1);
        };
        xhr.send();
    }

    function useFallbackQuote() {
        var fallbackQuotes = [
            { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
            { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
            { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
            { text: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer" },
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain" }
        ];
        var randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        displayQuote(randomQuote);
    }

    function displayQuote(quoteData) {
        motiveText.innerHTML = '"' + quoteData.text + '"';
        motiveAuthor.textContent = '— ' + quoteData.author;

        // Add animation
        motiveText.style.animation = 'pulse 0.5s ease';
        setTimeout(function () {
            motiveText.style.animation = '';
        }, 500);
    }

    function showAchievement(message) {
        achievementBadge.textContent = '🎉 ' + message;
        achievementBadge.style.display = 'block';

        // Hide after 3 seconds
        setTimeout(function () {
            achievementBadge.style.display = 'none';
        }, 3000);
    }

    function addNewTask() {
        var text = inputTask.value.trim();

        if (!text) {
            showNotification('Please enter a task description!', 'warning');
            inputTask.focus();
            return;
        }

        var newTask = {
            id: taskIdCounter++,
            text: text,
            completed: false,
            priority: currentPriority,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
        saveTasks();
        renderTasks();

        // Clear input and show feedback
        inputTask.value = '';
        inputTask.focus();
        showNotification('Task added successfully!', 'success');

        // Check for milestone
        if (tasks.length === 5) {
            showAchievement('5 Tasks Added!');
            setTimeout(loadMotivationalQuote, 1000);
        }

        // Animation for new task
        var newTaskElement = tasksContainer.querySelector('.task-item:first-child');
        if (newTaskElement) {
            newTaskElement.style.animation = 'pulse 0.8s ease';
            setTimeout(function () {
                newTaskElement.style.animation = '';
            }, 800);
        }
    }

    function renderTasks() {
        // Clear container
        tasksContainer.innerHTML = '';

        if (tasks.length === 0) {
            tasksContainer.appendChild(emptyState);
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';

            // Sort tasks: incomplete first, then by priority
            var sortedTasks = tasks.slice().sort(function (a, b) {
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                var priorityOrder = { high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });

            // Create task elements
            for (var i = 0; i < sortedTasks.length; i++) {
                var taskElement = createTaskElement(sortedTasks[i]);
                tasksContainer.appendChild(taskElement);
            }
        }

        updateStats();
    }

    function createTaskElement(task) {
        var taskDiv = document.createElement('div');
        taskDiv.className = 'task-item ' + (task.completed ? 'completed' : '');
        taskDiv.dataset.id = task.id;

        // Format date
        var taskDate = new Date(task.createdAt);
        var formattedDate = taskDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        var priorityText = task.priority === 'high' ? 'High Priority' :
                          task.priority === 'medium' ? 'Medium Priority' : 'Low Priority';

        taskDiv.innerHTML = '<div class="task-content">' +
            '<div class="task-checkbox ' + (task.completed ? 'checked' : '') + '"></div>' +
            '<div class="task-info">' +
            '<div class="task-text">' + escapeHtml(task.text) + '</div>' +
            '<div class="task-priority ' + task.priority + '">' +
            priorityText + ' • ' + formattedDate +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="task-actions">' +
            '<button class="complete-btn">' +
            '<i class="fas fa-' + (task.completed ? 'undo' : 'check') + '"></i>' +
            (task.completed ? 'Undo' : 'Complete') +
            '</button>' +
            '<button class="delete-btn">' +
            '<i class="fas fa-trash"></i> Delete' +
            '</button>' +
            '</div>';

        // Add event listeners
        var checkbox = taskDiv.querySelector('.task-checkbox');
        var completeBtn = taskDiv.querySelector('.complete-btn');
        var deleteBtn = taskDiv.querySelector('.delete-btn');
        var taskText = taskDiv.querySelector('.task-text');

        checkbox.addEventListener('click', function () {
            toggleTaskCompletion(task.id);
        });

        completeBtn.addEventListener('click', function () {
            toggleTaskCompletion(task.id);
        });

        deleteBtn.addEventListener('click', function () {
            taskDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(function () {
                deleteTask(task.id);
            }, 300);
        });

        // Double-click to edit
        taskText.addEventListener('dblclick', function () {
            editTask(task.id, taskText);
        });

        return taskDiv;
    }

    function toggleTaskCompletion(id) {
        var taskIndex = -1;
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id === id) {
                taskIndex = i;
                break;
            }
        }
        
        if (taskIndex !== -1) {
            var wasCompleted = tasks[taskIndex].completed;
            tasks[taskIndex].completed = !wasCompleted;
            saveTasks();
            renderTasks();

            var status = tasks[taskIndex].completed ? 'completed' : 'marked as pending';
            showNotification('Task ' + status + '!', 'success');

            // Update completed count and check for milestones
            var newCompletedCount = 0;
            for (var j = 0; j < tasks.length; j++) {
                if (tasks[j].completed) newCompletedCount++;
            }

            // Achievement milestones
            if (tasks[taskIndex].completed) {
                if (newCompletedCount === 3) {
                    showAchievement('3 Tasks Completed!');
                } else if (newCompletedCount === 10) {
                    showAchievement('10 Tasks Completed! 🎯');
                    setTimeout(loadMotivationalQuote, 1000);
                } else if (newCompletedCount % 5 === 0) {
                    showAchievement(newCompletedCount + ' Tasks Done!');
                }

                // Load new quote after completing a task (33% chance)
                if (Math.random() < 0.33) {
                    setTimeout(loadMotivationalQuote, 500);
                }
            }
        }
    }

    function deleteTask(id) {
        var newTasks = [];
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id !== id) {
                newTasks.push(tasks[i]);
            }
        }
        tasks = newTasks;
        saveTasks();
        renderTasks();
        showNotification('Task deleted!', 'warning');
    }

    function editTask(id, taskTextElement) {
        var currentText = taskTextElement.textContent;
        var input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'input_task';
        input.style.width = '100%';
        input.style.marginTop = '5px';

        taskTextElement.parentNode.replaceChild(input, taskTextElement);
        input.focus();
        input.select();

        function saveEdit() {
            var newText = input.value.trim();
            if (newText && newText !== currentText) {
                var taskIndex = -1;
                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].id === id) {
                        taskIndex = i;
                        break;
                    }
                }
                if (taskIndex !== -1) {
                    tasks[taskIndex].text = newText;
                    saveTasks();
                    renderTasks();
                    showNotification('Task updated!', 'success');
                }
            } else {
                renderTasks();
            }
        }

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') saveEdit();
        });
    }

    function updateStats() {
        var totalTasks = tasks.length;
        var completedTasks = 0;
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].completed) completedTasks++;
        }
        var pendingTasks = totalTasks - completedTasks;

        totalTasksEl.textContent = totalTasks;
        completedTasksEl.textContent = completedTasks;
        pendingTasksEl.textContent = pendingTasks;

        // Update badge color based on progress
        if (completedTasks === totalTasks && totalTasks > 0) {
            showAchievement('All Tasks Completed! 🎊');
            setTimeout(loadMotivationalQuote, 1000);
        }
    }

    function saveTasks() {
        localStorage.setItem('flowTasks', JSON.stringify(tasks));
    }

    function showNotification(message, type) {
        // Remove existing notification
        var existingNotification = document.querySelector('.notification');
        if (existingNotification) existingNotification.remove();

        // Create notification
        var notification = document.createElement('div');
        notification.className = 'notification';

        var icon = type === 'success' ? 'check-circle' : 'exclamation-triangle';
        var isNightMode = body.classList.contains('night-mode');
        var color = type === 'success' ? (isNightMode ? '#34d399' : '#10b981') :
                    (isNightMode ? '#fbbf24' : '#f59e0b');

        notification.innerHTML = '<i class="fas fa-' + icon + '"></i><span>' + message + '</span>';

        // Style notification
        notification.style.cssText = 'position: fixed;' +
            'top: 30px;' +
            'right: 30px;' +
            'background: ' + (isNightMode ? '#1e293b' : 'white') + ';' +
            'color: ' + color + ';' +
            'padding: 18px 25px;' +
            'border-radius: 12px;' +
            'box-shadow: 0 10px 25px ' + (isNightMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)') + ';' +
            'display: flex;' +
            'align-items: center;' +
            'gap: 12px;' +
            'z-index: 1000;' +
            'font-weight: 500;' +
            'border-left: 5px solid ' + color + ';' +
            'animation: fadeIn 0.4s ease;' +
            'max-width: 350px;' +
            'border: 1px solid ' + (isNightMode ? '#374151' : '#e2e8f0') + ';';

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(function () {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(function () {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    function addSampleTasks() {
        var sampleTasks = [
            { id: 1, text: 'Complete project proposal', completed: false, priority: 'high', createdAt: new Date().toISOString() },
            { id: 2, text: 'Buy groceries for the week', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
            { id: 3, text: 'Call mom for her birthday', completed: true, priority: 'high', createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: 4, text: 'Schedule dentist appointment', completed: false, priority: 'low', createdAt: new Date().toISOString() },
            { id: 5, text: 'Read 30 pages of current book', completed: false, priority: 'medium', createdAt: new Date().toISOString() }
        ];

        tasks = sampleTasks;
        taskIdCounter = 6;
        saveTasks();
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
