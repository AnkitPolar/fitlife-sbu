// Admin Dashboard Management System
class AdminDashboard {
    constructor() {
        // Initialize state
        this.state = {
            customers: [],
            stats: {
                totalCustomers: 0,
                totalRevenue: 0,
                activeUsers: 0,
                registeredUsers: 0,
                planSubscribers: {
                    1: { count: 0, price: 99 },    // 1 month plan
                    3: { count: 0, price: 399 },   // 3 months plan
                    6: { count: 0, price: 699 }    // 6 months plan
                }
            }
        };

        // Initialize the dashboard
        this.init();
    }

    init() {
        // Load saved data
        this.loadData();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Load registered users first
        this.loadRegisteredUsers();
        
        // Initial dashboard update
        this.updateDashboard();

        // Add sample data if no data exists
        if (this.state.customers.length === 0) {
            this.addSampleData();
        }
    }

    initializeEventListeners() {
        // Form submission handler
        const form = document.getElementById('add-customer-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Add search functionality
        this.initializeSearch();

        // Add sidebar toggle for mobile
        this.initializeSidebarToggle();
    }

    initializeSearch() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'customer-search';
        searchInput.placeholder = 'Search customers...';
        searchInput.className = 'search-input';

        searchContainer.appendChild(searchInput);
        document.querySelector('.sidebar-menu').insertBefore(
            searchContainer, 
            document.getElementById('customer-list')
        );

        // Debounced search handler
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchCustomers(e.target.value);
            }, 300);
        });
    }

    initializeSidebarToggle() {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '☰';
        document.querySelector('header').prepend(toggleBtn);

        toggleBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('customer-name');
        const planSelect = document.getElementById('plan-select');

        if (!nameInput || !planSelect) return;

        const name = nameInput.value.trim();
        const plan = planSelect.value;

        if (this.validateCustomerData(name, plan)) {
            this.addCustomer(name, parseInt(plan));
            e.target.reset();
        }
    }

    validateCustomerData(name, plan) {
        if (name.length < 2) {
            this.showNotification('Name must be at least 2 characters long', 'error');
            return false;
        }
        if (!plan || !['1', '3', '6'].includes(plan)) {
            this.showNotification('Please select a valid plan', 'error');
            return false;
        }

        // Check if user is already a customer
        const isAlreadyCustomer = this.state.customers.some(customer => customer.name === name);
        if (isAlreadyCustomer) {
            this.showNotification('This user is already a customer!', 'error');
            return false;
        }

        return true;
    }

    addCustomer(name, plan) {
        const email = document.getElementById('customer-email').value;
        const password = document.getElementById('customer-password').value;

        if (!email || !password) {
            this.showNotification('Email and password are required', 'error');
            return;
        }

        const customer = {
            id: Date.now(),
            name,
            plan,
            joinDate: new Date().toISOString(),
            status: 'active'
        };

        this.state.customers.unshift(customer);
        this.updateStats('add', customer);
        this.saveData();
        this.updateDashboard();
        this.showNotification('Customer added successfully!');

        // Update customer list in sidebar
        this.updateCustomerList(this.state.customers);

        // Add to registered users with complete user data
        this.addRegisteredUser({
            userId: name,
            email: email,
            password: password,
            country: 'N/A',
            createdAt: new Date().toISOString(),
            status: 'active'
        });
    }

    removeCustomer(id) {
        const customerIndex = this.state.customers.findIndex(c => c.id === id);
        if (customerIndex !== -1) {
            const customer = this.state.customers[customerIndex];
            this.state.customers.splice(customerIndex, 1);
            this.updateStats('remove', customer);
            this.saveData();
            this.updateDashboard();
            this.showNotification('Customer removed successfully');
        }
    }

    updateStats(action, customer) {
        const stats = this.state.stats;
        const planPrice = stats.planSubscribers[customer.plan].price;

        if (action === 'add') {
            stats.totalCustomers++;
            stats.activeUsers++;
            stats.totalRevenue += planPrice;
            stats.planSubscribers[customer.plan].count++;
        } else if (action === 'remove') {
            stats.totalCustomers--;
            stats.activeUsers--;
            stats.totalRevenue -= planPrice;
            stats.planSubscribers[customer.plan].count--;
        }
    }

    searchCustomers(query) {
        const filteredCustomers = query 
            ? this.state.customers.filter(customer => 
                customer.name.toLowerCase().includes(query.toLowerCase()))
            : this.state.customers;
        
        this.updateCustomerList(filteredCustomers);
    }

    updateDashboard() {
        this.updateCustomerList(this.state.customers);
        this.updateStatCards();
        this.updatePlanCards();
        this.loadRegisteredUsers();
    }

    updateCustomerList(customers) {
        const customerList = document.getElementById('customer-list');
        if (!customerList) return;

        customerList.innerHTML = customers.length ? '' : '<div class="no-customers">No customers found</div>';

        customers.forEach(customer => {
            const customerElement = document.createElement('div');
            customerElement.className = 'customer-item';
            customerElement.innerHTML = `
                <div class="customer-info">
                    <div class="customer-name">${this.escapeHtml(customer.name)}</div>
                    <div class="customer-plan">${customer.plan} Month Plan</div>
                    <div class="customer-date">${new Date(customer.joinDate).toLocaleDateString()}</div>
                </div>
                <button class="remove-customer" data-id="${customer.id}">×</button>
            `;

            customerElement.querySelector('.remove-customer').addEventListener('click', 
                () => this.removeCustomer(customer.id));
            
            customerList.appendChild(customerElement);
        });

        // Update stats display
        document.getElementById('total-customers').textContent = this.state.stats.totalCustomers;
        document.getElementById('active-users').textContent = this.state.stats.activeUsers;
        document.getElementById('total-revenue').textContent = `₹${this.state.stats.totalRevenue}`;
    }

    updateStatCards() {
        const { stats } = this.state;
        const elements = {
            'total-customers': stats.totalCustomers,
            'total-revenue': `Rs${stats.totalRevenue.toLocaleString()}`,
            'active-users': stats.activeUsers,
            'registered-users': stats.registeredUsers
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }
    }

    updatePlanCards() {
        const { planSubscribers } = this.state.stats;
        Object.entries(planSubscribers).forEach(([plan, data]) => {
            const element = document.getElementById(`plan-${plan}-subscribers`);
            if (element) {
                element.textContent = `${data.count} subscribers`;
            }
        });
    }

    loadData() {
        try {
            const savedData = localStorage.getItem('adminDashboardData');
            if (savedData) {
                this.state = JSON.parse(savedData);
            }
            // Add sample data if no customers are loaded
            if (this.state.customers.length === 0) {
                this.addSampleData();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Error loading saved data', 'error');
        }
    }

    saveData() {
        try {
            localStorage.setItem('adminDashboardData', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving data:', error);
            this.showNotification('Error saving data', 'error');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    addSampleData() {
        const sampleCustomers = [
            { name: 'John Doe', plan: 1 },
            { name: 'Jane Smith', plan: 3 },
            { name: 'Bob Johnson', plan: 6 },
            { name: 'Alice Brown', plan: 1 },
            { name: 'Charlie Wilson', plan: 3 },
            { name: 'Emily Davis', plan: 6 },
            { name: 'Michael Miller', plan: 1 },
            { name: 'Sarah Wilson', plan: 3 },
            { name: 'David Anderson', plan: 6 },
            { name: 'Laura Thomas', plan: 1 },
            { name: 'Daniel Jackson', plan: 3 },
            { name: 'Sophia White', plan: 6 },
            { name: 'James Harris', plan: 1 },
            { name: 'Olivia Martin', plan: 3 },
            { name: 'Liam Thompson', plan: 6 },
            { name: 'Emma Garcia', plan: 1 },
            { name: 'Noah Martinez', plan: 3 },
            { name: 'Ava Robinson', plan: 6 },
            { name: 'Lucas Clark', plan: 1 },
            { name: 'Mia Rodriguez', plan: 3 }
        ];

        sampleCustomers.forEach(customer => {
            this.addCustomer(customer.name, customer.plan);
            this.addRegisteredUser(customer.name);
        });
    }

    addRegisteredUser(userData) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Check if the user already exists (case-insensitive)
        const userExists = users.some(user => 
            user.userId.toLowerCase() === userData.userId.toLowerCase() ||
            user.email.toLowerCase() === userData.email.toLowerCase()
        );
        if (userExists) return; // Exit if user already exists

        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
        this.loadRegisteredUsers();
    }

    loadRegisteredUsers() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        // Filter out admin and sort by registration date (newest first)
        const regularUsers = users
            .filter(user => user.email !== 'admin@admin.com')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        this.state.stats.registeredUsers = regularUsers.length;
        
        const tbody = document.getElementById('registered-users-list');
        if (!tbody) return;

        tbody.innerHTML = regularUsers.map(user => `
            <tr>
                <td>${this.escapeHtml(user.userId)}</td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${this.escapeHtml(user.country || 'N/A')}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td><span class="user-status ${user.status || 'active'}">${user.status || 'active'}</span></td>
                <td>
                    <button class="remove-user-btn" onclick="adminDashboard.removeRegisteredUser('${user.userId}')">
                        Remove
                    </button>
                </td>
            </tr>
        `).join('');

        // Update registered users count in stats
        document.getElementById('registered-users').textContent = regularUsers.length;
    }

    removeRegisteredUser(userId) {
        if (confirm('Are you sure you want to remove this user?')) {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const updatedUsers = users.filter(user => user.userId !== userId);
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            
            // Update the display
            this.loadRegisteredUsers();
            this.updateStatCards();
            
            // Remove from customers if they are a customer
            const customer = this.state.customers.find(c => c.name === userId);
            if (customer) {
                this.removeCustomer(customer.id);
            }
            
            this.showNotification('User removed successfully');
        }
    }

    loginUser() {
        const usernameInput = document.getElementById('login-username');
        const username = usernameInput.value.trim();

        if (!username) {
            this.showNotification('Please enter your name', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        console.log('Users in local storage:', users); // Debugging line

        // Check if user exists by comparing userId case-insensitively
        const userExists = users.some(user => 
            user.userId.toLowerCase() === username.toLowerCase()
        );
        console.log('Attempting to login with:', username); // Debugging line
        console.log('User exists:', userExists); // Debugging line

        if (userExists) {
            this.showNotification('Login successful!', 'success');
            // Add a slight delay before redirect to show the success message
            setTimeout(() => {
                window.location.href = 'landing-page.html';
            }, 1000);
        } else {
            this.showNotification('User not found', 'error');
        }
    }
}

// Add required styles
const styles = `
    .search-container {
        margin-bottom: 15px;
    }

    .search-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #34495e;
        border-radius: 4px;
        background-color: #34495e;
        color: white;
    }

    .search-input::placeholder {
        color: #95a5a6;
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.5s ease-out;
    }

    .notification.success {
        background-color: #27ae60;
    }

    .notification.error {
        background-color: #e74c3c;
    }

    .notification.fade-out {
        animation: fadeOut 0.5s ease-out;
    }

    .customer-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .customer-info {
        flex: 1;
    }

    .customer-name {
        font-weight: 500;
    }

    .customer-plan {
        font-size: 0.8rem;
        opacity: 0.8;
    }

    .customer-date {
        font-size: 0.7rem;
        opacity: 0.6;
    }

    .remove-customer {
        background: none;
        border: none;
        color: #e74c3c;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0 5px;
    }

    .remove-customer:hover {
        color: #c0392b;
    }

    .sidebar-toggle {
        display: none;
        padding: 8px;
        font-size: 1.5rem;
        background: none;
        border: none;
        color: #2c3e50;
    }

    @media (max-width: 768px) {
        .sidebar-toggle {
            display: block;
        }

        .sidebar {
            position: fixed;
            left: -100%;
            top: 0;
            height: 100vh;
            z-index: 1000;
            transition: left 0.3s ease;
        }

        .sidebar.active {
            left: 0;
        }
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();

    // Initialize login event listener
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', () => adminDashboard.loginUser());
    }
});