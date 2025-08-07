// Dashboard Manager for BID AI Wedding Assistant
class DashboardManager {
    constructor() {
        this.data = {
            coupleName: "Priya & Arjun",
            weddingDate: "",
            progress: 0,
            daysLeft: 0,
            budget: "₹25 Lakhs",
            budgetUsed: "₹0"
        };
        
        this.quickActions = [
            { id: 1, title: "📝 Wedding Form", status: "⏳ Pending", screen: "wedding-form" },
            { id: 2, title: "🎨 Visual Style", status: "⏳ Pending", screen: "visual-preferences" },
            { id: 3, title: "🏛️ Find Venues", status: "⏳ Coming Soon", screen: null },
            { id: 4, title: "👥 Find Vendors", status: "⏳ Coming Soon", screen: null },
            { id: 5, title: "💰 Budget Plan", status: "⏳ Coming Soon", screen: null },
            { id: 6, title: "📅 Timeline", status: "⏳ Coming Soon", screen: null }
        ];

        this.recentActivity = [
            { id: 1, message: "🤖 Welcome to BID AI Wedding Assistant!", time: "Just now", priority: "high" },
            { id: 2, message: "📝 Complete your wedding form to get started", time: "1 min ago", priority: "medium" },
            { id: 3, message: "🎨 Set your visual preferences for better matches", time: "2 min ago", priority: "medium" }
        ];

        this.upcomingTasks = [
            { id: 1, task: "Complete wedding details form", dueDate: "Today", priority: "high", completed: false },
            { id: 2, task: "Set visual style preferences", dueDate: "Today", priority: "high", completed: false },
            { id: 3, task: "Define budget allocation", dueDate: "This week", priority: "medium", completed: false }
        ];

        this.container = document.getElementById('dashboard-container');
        this.init();
    }

    init() {
        this.loadData();
        this.render();
    }

    loadData() {
        // Load from storage
        const storedData = window.weddingStorage.getDashboardData();
        this.data = { ...this.data, ...storedData };
        
        // Calculate dynamic values
        this.calculateProgress();
        this.calculateDaysLeft();
        this.updateQuickActionsStatus();
    }

    calculateProgress() {
        this.data.progress = window.weddingStorage.calculateOverallProgress();
    }

    calculateDaysLeft() {
        this.data.daysLeft = window.weddingStorage.calculateDaysUntilWedding();
    }

    updateQuickActionsStatus() {
        const weddingForm = window.weddingStorage.getWeddingForm();
        const visualPrefs = window.weddingStorage.getVisualPreferences();

        // Update wedding form status
        const formComplete = weddingForm.yourName && weddingForm.partnerName && weddingForm.weddingDate;
        if (formComplete) {
            this.quickActions[0].status = "✅ Complete";
        } else if (weddingForm.yourName || weddingForm.partnerName) {
            this.quickActions[0].status = "🔄 In Progress";
        }

        // Update visual preferences status
        const visualComplete = visualPrefs.decorTheme && visualPrefs.cuisineStyle && visualPrefs.photoStyle && visualPrefs.venueType;
        if (visualComplete) {
            this.quickActions[1].status = "✅ Complete";
        } else if (visualPrefs.decorTheme || visualPrefs.cuisineStyle) {
            this.quickActions[1].status = "🔄 In Progress";
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h1 class="card-title">🎉 Welcome to Your Indian Wedding AI Planner</h1>
                    <h2 class="text-lg font-semibold text-gray-700 mb-4">${this.data.coupleName}</h2>
                    <div class="flex justify-center gap-4 flex-wrap">
                        ${this.renderInfoCards()}
                    </div>
                </div>
                
                <div class="grid grid-2 gap-6">
                    <div class="space-y-6">
                        ${this.renderProgressSection()}
                        ${this.renderQuickActions()}
                    </div>
                    
                    <div class="space-y-6">
                        ${this.renderRecentActivity()}
                        ${this.renderUpcomingTasks()}
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderInfoCards() {
        return `
            <div class="info-card">
                <span class="info-label">Wedding Date</span>
                <span class="info-value">${this.formatDate(this.data.weddingDate) || 'Not Set'}</span>
            </div>
            <div class="info-card">
                <span class="info-label">Days Remaining</span>
                <span class="info-value">${this.data.daysLeft || 'TBD'}</span>
            </div>
            <div class="info-card">
                <span class="info-label">Overall Progress</span>
                <span class="info-value">${this.data.progress}%</span>
            </div>
        `;
    }

    renderProgressSection() {
        return `
            <div class="section">
                <h3 class="section-title">📊 Wedding Progress</h3>
                <div class="progress-container">
                    <div class="progress">
                        <div class="progress-fill" style="width: ${this.data.progress}%"></div>
                    </div>
                    <span class="progress-text">${this.data.progress}% Complete</span>
                </div>
                
                <div class="budget-info">
                    <div class="budget-item">
                        <span class="budget-label">Total Budget:</span>
                        <span class="budget-value">${this.data.budget}</span>
                    </div>
                    <div class="budget-item">
                        <span class="budget-label">Used:</span>
                        <span class="budget-value">${this.data.budgetUsed}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderQuickActions() {
        return `
            <div class="section">
                <h3 class="section-title">⚡ Quick Actions</h3>
                <div class="actions-grid">
                    ${this.quickActions.map(action => `
                        <div class="action-card" data-action="${action.id}" data-screen="${action.screen}">
                            <div class="action-header">
                                <div class="action-title">${action.title}</div>
                                <div class="action-status">${action.status}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderRecentActivity() {
        return `
            <div class="section">
                <h3 class="section-title">📋 Recent Activity</h3>
                <div class="activity-list">
                    ${this.recentActivity.map(activity => `
                        <div class="activity-item">
                            <div class="activity-message">${activity.message}</div>
                            <div class="activity-time">${activity.time}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderUpcomingTasks() {
        return `
            <div class="section">
                <h3 class="section-title">📅 Upcoming Tasks</h3>
                <div class="tasks-list">
                    ${this.upcomingTasks.map(task => `
                        <div class="task-item" data-task-id="${task.id}">
                            <div class="task-header">
                                <div class="task-checkbox ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                                    ${task.completed ? '✓' : ''}
                                </div>
                                <div class="task-text ${task.completed ? 'completed' : ''}">${task.task}</div>
                            </div>
                            <div class="task-footer">
                                <span class="task-due">${task.dueDate}</span>
                                <span class="task-priority ${task.priority}">${task.priority}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Quick action clicks
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const screen = e.currentTarget.getAttribute('data-screen');
                if (screen && window.navigationManager) {
                    window.navigationManager.navigateTo(screen);
                }
            });
        });

        // Task checkboxes
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.getAttribute('data-task-id'));
                this.toggleTask(taskId);
            });
        });
    }

    toggleTask(taskId) {
        const task = this.upcomingTasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.calculateProgress();
            this.render();
            this.saveData();
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    saveData() {
        window.weddingStorage.saveDashboardData(this.data);
    }

    refresh() {
        this.loadData();
        this.render();
    }

    // Add custom CSS for dashboard
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .info-card {
                background: linear-gradient(135deg, var(--primary-pink), var(--primary-green));
                color: white;
                padding: 0.75rem 1rem;
                border-radius: 10px;
                text-align: center;
                min-width: 120px;
                flex: 1;
                max-width: 160px;
            }
            
            .info-label {
                display: block;
                font-size: 0.75rem;
                opacity: 0.9;
                margin-bottom: 0.25rem;
            }
            
            .info-value {
                display: block;
                font-size: 1rem;
                font-weight: bold;
            }
            
            .section {
                background: var(--gray-50);
                border-radius: 12px;
                padding: 1rem;
                border: 1px solid var(--gray-200);
            }
            
            .section-title {
                color: var(--primary-gold);
                font-size: 1rem;
                font-weight: 600;
                margin-bottom: 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .progress-container {
                margin-bottom: 1rem;
            }
            
            .budget-info {
                display: flex;
                gap: 0.75rem;
            }
            
            .budget-item {
                flex: 1;
                text-align: center;
                padding: 0.75rem;
                background: white;
                border-radius: 6px;
                border: 1px solid var(--gray-200);
            }
            
            .budget-label {
                display: block;
                font-size: 0.75rem;
                color: var(--gray-500);
                margin-bottom: 0.25rem;
            }
            
            .budget-value {
                display: block;
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--gray-700);
            }
            
            .actions-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
            }
            
            .action-card {
                background: white;
                border: 2px solid var(--gray-200);
                border-radius: 10px;
                padding: 0.75rem;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
            }
            
            .action-card:hover {
                border-color: var(--primary-gold);
                transform: translateY(-1px);
                box-shadow: var(--shadow-hover);
            }
            
            .action-title {
                font-weight: 600;
                color: var(--gray-700);
                font-size: 0.75rem;
                margin-bottom: 0.25rem;
            }
            
            .action-status {
                font-size: 0.625rem;
                color: var(--gray-500);
            }
            
            .activity-list, .tasks-list {
                max-height: 200px;
                overflow-y: auto;
            }
            
            .activity-item, .task-item {
                background: white;
                border: 1px solid var(--gray-200);
                border-radius: 8px;
                padding: 0.75rem;
                margin-bottom: 0.5rem;
            }
            
            .activity-message, .task-text {
                font-size: 0.75rem;
                color: var(--gray-700);
                margin-bottom: 0.25rem;
            }
            
            .activity-time {
                font-size: 0.625rem;
                color: var(--gray-500);
            }
            
            .task-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.25rem;
            }
            
            .task-checkbox {
                width: 1rem;
                height: 1rem;
                border: 2px solid var(--primary-gold);
                border-radius: 3px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                transition: all 0.2s ease;
                font-size: 0.625rem;
            }
            
            .task-checkbox.completed {
                background: var(--primary-gold);
                color: white;
            }
            
            .task-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .task-due {
                font-size: 0.625rem;
                color: var(--gray-500);
            }
            
            .task-priority {
                font-size: 0.625rem;
                padding: 0.125rem 0.375rem;
                border-radius: 10px;
                font-weight: 500;
            }
            
            .task-priority.high {
                background: #FEE2E2;
                color: #DC2626;
            }
            
            .task-priority.medium {
                background: #FEF3C7;
                color: #D97706;
            }
            
            .task-priority.low {
                background: #DCFCE7;
                color: #16A34A;
            }
            
            .task-text.completed {
                text-decoration: line-through;
                opacity: 0.6;
            }
            
            @media (max-width: 768px) {
                .actions-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
    window.dashboardManager.addStyles();
}); 