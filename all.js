document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const daysContainer = document.getElementById('days-container');
    const monthYearDisplay = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const taskStats = document.getElementById('task-stats');
    const tasksList = document.getElementById('tasks-list');
    const emptyState = document.getElementById('empty-state');
    
    const taskTitleInput = document.getElementById('task-title');
    const taskTimeInput = document.getElementById('task-time');
    const addTaskBtn = document.getElementById('add-task-btn');

    // === State ===
    let currentDate = new Date(); // Using to render the calendar month
    let selectedDate = new Date(); // The date currently selected by the user
    
    // Store localized date string "YYYY-MM-DD"
    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Format human readable date for display
    const formatDisplayDate = (date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('zh-TW', options);
    };

    let tasksData = JSON.parse(localStorage.getItem('planner_tasks')) || {};
    // State shape: { "2026-04-18": [{id: 1, title: 'Meeting', time: '14:00'}, ...] }

    // === Helper Functions ===
    const saveTasks = () => {
        localStorage.setItem('planner_tasks', JSON.stringify(tasksData));
    };

    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

    // === Calendar Logic ===
    const renderCalendar = () => {
        daysContainer.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Display month/year e.g., "2026年 4月"
        const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
        monthYearDisplay.textContent = `${year}年 ${monthNames[month]}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // 1. Previous month blank days
        for (let i = firstDayOfMonth; i > 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day-cell', 'other-month');
            dayDiv.textContent = daysInPrevMonth - i + 1;
            daysContainer.appendChild(dayDiv);
        }

        const today = new Date();
        const todayStr = formatDate(today);
        const selectedStr = formatDate(selectedDate);

        // 2. Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day-cell');
            dayDiv.textContent = i;
            
            const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            if (cellDateStr === todayStr) {
                dayDiv.classList.add('today');
            }
            if (cellDateStr === selectedStr) {
                dayDiv.classList.add('selected');
            }

            // Check if there are tasks for this day to show dots
            if (tasksData[cellDateStr] && tasksData[cellDateStr].length > 0) {
                const dotContainer = document.createElement('div');
                dotContainer.classList.add('task-dots');
                // Show up to 3 dots
                for(let k=0; k < Math.min(tasksData[cellDateStr].length, 3); k++) {
                    const dot = document.createElement('div');
                    dot.classList.add('dot');
                    dotContainer.appendChild(dot);
                }
                dayDiv.appendChild(dotContainer);
            }

            dayDiv.addEventListener('click', () => {
                selectedDate = new Date(year, month, i);
                renderCalendar();
                renderTasks();
            });

            daysContainer.appendChild(dayDiv);
        }

        // 3. Next month blank days to fill the grid (7 cols * 6 rows = 42 cells typically)
        const currentCellsCount = firstDayOfMonth + daysInMonth;
        const totalGridCells = Math.ceil(currentCellsCount / 7) * 7;
        const remainingCells = totalGridCells - currentCellsCount;

        for (let i = 1; i <= remainingCells; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day-cell', 'other-month');
            dayDiv.textContent = i;
            daysContainer.appendChild(dayDiv);
        }
    };

    // Calendar Handlers
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        selectedDate = new Date();
        renderCalendar();
        renderTasks();
    });

    // === Task Logic ===
    const renderTasks = () => {
        const selectedStr = formatDate(selectedDate);
        selectedDateDisplay.textContent = formatDisplayDate(selectedDate);
        
        const dailyTasks = tasksData[selectedStr] || [];
        
        // Sort tasks by time
        dailyTasks.sort((a, b) => {
            if(!a.time) return 1;
            if(!b.time) return -1;
            return a.time.localeCompare(b.time);
        });

        taskStats.textContent = `${dailyTasks.length} 個行程`;

        if (dailyTasks.length === 0) {
            emptyState.classList.remove('hidden');
            tasksList.innerHTML = '';
        } else {
            emptyState.classList.add('hidden');
            tasksList.innerHTML = '';
            
            dailyTasks.forEach(task => {
                const li = document.createElement('li');
                li.classList.add('task-item');
                
                const timeDisplay = task.time ? `<div class="task-time"><i class="fa-regular fa-clock"></i> ${task.time}</div>` : '';
                
                li.innerHTML = `
                    <div class="task-info">
                        <div class="task-title">${task.title}</div>
                        ${timeDisplay}
                    </div>
                    <div class="task-actions">
                        <button class="action-btn export-btn" title="加入至行事曆" data-id="${task.id}">
                            <i class="fa-solid fa-calendar-plus"></i>
                        </button>
                        <button class="action-btn delete-btn" title="刪除行程" data-id="${task.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;

                // Export Event
                li.querySelector('.export-btn').addEventListener('click', () => exportToCalendar(task, selectedStr));
                
                // Delete Event
                li.querySelector('.delete-btn').addEventListener('click', () => {
                    if (confirm('確定要刪除這個行程嗎？')) {
                        tasksData[selectedStr] = tasksData[selectedStr].filter(t => t.id !== task.id);
                        if (tasksData[selectedStr].length === 0) delete tasksData[selectedStr];
                        saveTasks();
                        renderTasks();
                        renderCalendar(); // To update dots
                    }
                });

                tasksList.appendChild(li);
            });
        }
    };

    addTaskBtn.addEventListener('click', () => {
        const title = taskTitleInput.value.trim();
        const time = taskTimeInput.value;

        if (!title) {
            alert('請輸入行程名稱');
            return;
        }

        const selectedStr = formatDate(selectedDate);
        if (!tasksData[selectedStr]) {
            tasksData[selectedStr] = [];
        }

        tasksData[selectedStr].push({
            id: generateId(),
            title: title,
            time: time
        });

        saveTasks();
        
        // Reset form
        taskTitleInput.value = '';
        taskTimeInput.value = '';
        
        renderTasks();
        renderCalendar(); // Update dots
    });

    // Enter key support for input
    taskTitleInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') addTaskBtn.click();
    });

    // === Export to Calendar Logic ===
    const exportToCalendar = (task, dateStr) => {
        let startDateTime = '';
        let endDateTime = '';
        let isAllDay = false;
        
        const [year, month, day] = dateStr.split('-');
        
        if (task.time) {
            const [hour, minute] = task.time.split(':');
            
            // Create a local date object, then convert to UTC string format required by google
            const startDate = new Date(year, month - 1, day, hour, minute);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration
            
            const formatForGcal = (d) => {
                return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
            };
            
            startDateTime = formatForGcal(startDate);
            endDateTime = formatForGcal(endDate);
        } else {
            // All day event
            isAllDay = true;
            // Next day for all day event end
            const endDate = new Date(year, month - 1, day);
            endDate.setDate(endDate.getDate() + 1);
            
            const formatAllDay = (d) => {
                return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
            };
            
            startDateTime = formatAllDay(new Date(year, month - 1, day));
            endDateTime = formatAllDay(endDate);
        }

        // 1. Ask user which format to export
        const choice = confirm(`是否要開啟 Google Calendar？\n[確認] 開啟 Google 行事曆頁面\n[取消] 下載 .ics 備忘錄檔案`);
        
        if (choice) {
            // --- Google Calendar ---
            const url = new URL('https://calendar.google.com/calendar/render');
            url.searchParams.append('action', 'TEMPLATE');
            url.searchParams.append('text', task.title);
            url.searchParams.append('dates', `${startDateTime}/${endDateTime}`);
            window.open(url.toString(), '_blank');
        } else {
            // --- ICS Download ---
            const gcalToIcsFormat = (d) => d; 
            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'BEGIN:VEVENT',
                `SUMMARY:${task.title}`,
                `DTSTART${isAllDay ? ';VALUE=DATE:' : ':'}${startDateTime}`,
                `DTEND${isAllDay ? ';VALUE=DATE:' : ':'}${endDateTime}`,
                'END:VEVENT',
                'END:VCALENDAR'
            ].join('\n');

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${task.title}.ics`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        }
    };

    // === Initialization ===
    renderCalendar();
    renderTasks();
});
